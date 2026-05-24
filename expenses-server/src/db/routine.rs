use super::DB;
use crate::error::MyError;
use crate::model::RoutineModel;
use crate::response::{
    NoteData, NoteListResponse, NoteResponse, RoutineData, RoutineListResponse, RoutineResponse,
    SingleNoteResponse, SingleRoutineResponse,
};
use crate::schema::CreateRoutineSchema;
use crate::utils::schedule::Schedule;
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
    pub async fn fetch_routines(&self, limit: i64, page: i64) -> Result<RoutineListResponse> {
        let find_options = FindOptions::builder()
            .limit(limit)
            .skip(u64::try_from((page - 1) * limit).unwrap())
            .build();

        let mut cursor: mongodb::Cursor<RoutineModel> = self
            .routine_collection
            .find(None, find_options)
            .await
            .map_err(MongoQueryError)?;

        let mut json_result: Vec<RoutineResponse> = Vec::new();
        while let Some(doc) = cursor.next().await {
            json_result.push(self.doc_to_routine(&doc.unwrap())?);
        }

        Ok(RoutineListResponse {
            status: "success",
            results: json_result.len(),
            routines: json_result,
        })
    }

    pub async fn get_all_routines(&self) -> Result<RoutineListResponse> {
        let mut routine_docs = self
            .routine_collection
            .find(None, None)
            .await
            .map_err(MongoQueryError)?;

        let mut json_result: Vec<RoutineResponse> = Vec::new();
        while let Some(doc) = routine_docs.next().await {
            json_result.push(self.doc_to_routine(&doc.unwrap())?);
        }

        Ok(RoutineListResponse {
            status: "success",
            results: json_result.len(),
            routines: json_result,
        })
    }

    pub async fn get_today_routines(&self) -> Result<RoutineListResponse> {
        let mut routine_docs = self
            .routine_collection
            .find(None, None)
            .await
            .map_err(MongoQueryError)?;

        let mut json_result: Vec<RoutineResponse> = Vec::new();
        while let Some(doc) = routine_docs.next().await {
            json_result.push(self.doc_to_routine(&doc.unwrap())?);
        }

        let mut today_routines: Vec<RoutineResponse> = Vec::new();

        for routine in json_result {
            let schedule: Schedule = Schedule::new(routine.recurringOption.frequency.clone());

            if schedule.is_today_schedule() {
                today_routines.push(routine);
            }
        }

        Ok(RoutineListResponse {
            status: "success",
            results: today_routines.len(),
            routines: today_routines,
        })
    }

    pub async fn create_routine(
        &self,
        body: &CreateRoutineSchema,
    ) -> Result<SingleRoutineResponse> {
        let now = Utc::now();

        let routine = RoutineModel {
            id: ObjectId::new(),
            title: body.title.clone(),
            description: body.description.clone(),
            recurringOption: body.recurringOption.clone(),
            createdAt: now,
            updatedAt: now,
        };

        self.routine_collection
            .insert_one(&routine, None)
            .await
            .map_err(MongoQueryError)?;

        Ok(SingleRoutineResponse {
            status: "success",
            data: RoutineData {
                routine: self.doc_to_routine(&routine)?,
            },
        })
    }

    pub async fn get_routine(&self, id: &str) -> Result<SingleRoutineResponse> {
        let oid = ObjectId::from_str(id).map_err(|_| InvalidIDError(id.to_owned()))?;

        let routine_doc = self
            .routine_collection
            .find_one(doc! {"_id":oid }, None)
            .await
            .map_err(MongoQueryError)?;

        match routine_doc {
            Some(doc) => {
                let routine = self.doc_to_routine(&doc)?;
                Ok(SingleRoutineResponse {
                    status: "success",
                    data: RoutineData { routine },
                })
            }
            None => Err(NotFoundError(id.to_string())),
        }
    }

    // pub async fn get_note(&self, id: &str) -> Result<SingleNoteResponse> {
    //     let oid = ObjectId::from_str(id).map_err(|_| InvalidIDError(id.to_owned()))?;

    //     let note_doc = self
    //         .note_collection
    //         .find_one(doc! {"_id":oid }, None)
    //         .await
    //         .map_err(MongoQueryError)?;

    //     match note_doc {
    //         Some(doc) => {
    //             let note = self.doc_to_note(&doc)?;
    //             Ok(SingleNoteResponse {
    //                 status: "success",
    //                 data: NoteData { note },
    //             })
    //         }
    //         None => Err(NotFoundError(id.to_string())),
    //     }
    // }

    // pub async fn edit_note(&self, id: &str, body: &UpdateNoteSchema) -> Result<SingleNoteResponse> {
    //     let oid = ObjectId::from_str(id).map_err(|_| InvalidIDError(id.to_owned()))?;

    //     let update = doc! {
    //         "$set": bson::to_document(body).map_err(MongoSerializeBsonError)?,
    //     };

    //     let options = FindOneAndUpdateOptions::builder()
    //         .return_document(ReturnDocument::After)
    //         .build();

    //     if let Some(doc) = self
    //         .note_collection
    //         .find_one_and_update(doc! {"_id": oid}, update, options)
    //         .await
    //         .map_err(MongoQueryError)?
    //     {
    //         let note = self.doc_to_note(&doc)?;
    //         let note_response = SingleNoteResponse {
    //             status: "success",
    //             data: NoteData { note },
    //         };
    //         Ok(note_response)
    //     } else {
    //         Err(NotFoundError(id.to_string()))
    //     }
    // }

    pub async fn delete_routine(&self, id: &str) -> Result<()> {
        let oid = ObjectId::from_str(id).map_err(|_| InvalidIDError(id.to_owned()))?;
        let filter = doc! {"_id": oid };

        let result = self
            .routine_collection
            .delete_one(filter, None)
            .await
            .map_err(MongoQueryError)?;

        match result.deleted_count {
            0 => Err(NotFoundError(id.to_string())),
            _ => Ok(()),
        }
    }

    fn doc_to_routine(&self, routine: &RoutineModel) -> Result<RoutineResponse> {
        let routine_response = RoutineResponse {
            id: routine.id.to_hex(),
            title: routine.title.to_owned(),
            description: routine.description.to_owned(),
            recurringOption: routine.recurringOption.to_owned(),
            createdAt: routine.createdAt,
            updatedAt: routine.updatedAt,
        };

        Ok(routine_response)
    }
}
