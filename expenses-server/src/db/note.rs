use super::DB;
use crate::error::MyError;
use crate::response::{NoteData, NoteListResponse, NoteResponse, SingleNoteResponse};
use crate::{
    error::MyError::*, model::NoteModel, schema::CreateNoteSchema, schema::UpdateNoteSchema,
};
use chrono::prelude::*;
use futures::StreamExt;
use mongodb::bson::{doc, oid::ObjectId};
use mongodb::options::{FindOneAndUpdateOptions, FindOptions, IndexOptions, ReturnDocument};
use mongodb::{bson, IndexModel};
use std::str::FromStr;

type Result<T> = std::result::Result<T, MyError>;

impl DB {
    pub async fn fetch_notes(&self, limit: i64, page: i64) -> Result<NoteListResponse> {
        let find_options = FindOptions::builder()
            .limit(limit)
            .skip(u64::try_from((page - 1) * limit).unwrap())
            .build();

        let mut cursor = self
            .note_collection
            .find(None, find_options)
            .await
            .map_err(MongoQueryError)?;

        let mut json_result: Vec<NoteResponse> = Vec::new();
        while let Some(doc) = cursor.next().await {
            json_result.push(self.doc_to_note(&doc.unwrap())?);
        }

        Ok(NoteListResponse {
            status: "success",
            results: json_result.len(),
            notes: json_result,
        })
    }

    pub async fn create_note(&self, body: &CreateNoteSchema) -> Result<SingleNoteResponse> {
        let now = Utc::now();

        let note = NoteModel {
            id: ObjectId::new(),
            title: body.title.clone(),
            content: body.content.clone(),
            category: body.category.clone(),
            published: body.published.or(Some(false)),
            createdAt: now,
            updatedAt: now,
        };

        self.note_collection
            .insert_one(&note, None)
            .await
            .map_err(MongoQueryError)?;

        Ok(SingleNoteResponse {
            status: "success",
            data: NoteData {
                note: self.doc_to_note(&note)?,
            },
        })
    }

    pub async fn get_note(&self, id: &str) -> Result<SingleNoteResponse> {
        let oid = ObjectId::from_str(id).map_err(|_| InvalidIDError(id.to_owned()))?;

        let note_doc = self
            .note_collection
            .find_one(doc! {"_id":oid }, None)
            .await
            .map_err(MongoQueryError)?;

        match note_doc {
            Some(doc) => {
                let note = self.doc_to_note(&doc)?;
                Ok(SingleNoteResponse {
                    status: "success",
                    data: NoteData { note },
                })
            }
            None => Err(NotFoundError(id.to_string())),
        }
    }

    pub async fn edit_note(&self, id: &str, body: &UpdateNoteSchema) -> Result<SingleNoteResponse> {
        let oid = ObjectId::from_str(id).map_err(|_| InvalidIDError(id.to_owned()))?;

        let update = doc! {
            "$set": bson::to_document(body).map_err(MongoSerializeBsonError)?,
        };

        let options = FindOneAndUpdateOptions::builder()
            .return_document(ReturnDocument::After)
            .build();

        if let Some(doc) = self
            .note_collection
            .find_one_and_update(doc! {"_id": oid}, update, options)
            .await
            .map_err(MongoQueryError)?
        {
            let note = self.doc_to_note(&doc)?;
            let note_response = SingleNoteResponse {
                status: "success",
                data: NoteData { note },
            };
            Ok(note_response)
        } else {
            Err(NotFoundError(id.to_string()))
        }
    }

    pub async fn delete_note(&self, id: &str) -> Result<()> {
        let oid = ObjectId::from_str(id).map_err(|_| InvalidIDError(id.to_owned()))?;
        let filter = doc! {"_id": oid };

        let result = self
            .note_collection
            .delete_one(filter, None)
            .await
            .map_err(MongoQueryError)?;

        match result.deleted_count {
            0 => Err(NotFoundError(id.to_string())),
            _ => Ok(()),
        }
    }

    fn doc_to_note(&self, note: &NoteModel) -> Result<NoteResponse> {
        let note_response = NoteResponse {
            id: note.id.to_hex(),
            title: note.title.to_owned(),
            content: note.content.to_owned(),
            category: note.category.to_owned().unwrap_or(String::from("")),
            published: note.published.unwrap(),
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
        };

        Ok(note_response)
    }
}
