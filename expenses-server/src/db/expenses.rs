use std::str::FromStr;

use super::DB;
use crate::error::MyError;
use crate::error::MyError::*;
use crate::model::ExpenseModel;
use crate::response::{
    BasicResponse, ExpenseData, ExpenseListResponse, ExpenseResponse, SingleExpenseResponse,
};
use crate::schema::CreateExpenseSchema;
use chrono::prelude::*;
use futures::StreamExt;
use mongodb::bson::doc;
use mongodb::bson::oid::ObjectId;
use mongodb::options::FindOptions;

type Result<T> = std::result::Result<T, MyError>;

impl DB {
    pub async fn fetch_expenses(&self, limit: i64, page: i64) -> Result<ExpenseListResponse> {
        let find_options = FindOptions::builder()
            .limit(limit)
            .skip(u64::try_from((page - 1) * limit).unwrap())
            .build();

        let mut cursor = self
            .expenses_collection
            .find(None, find_options)
            .await
            .map_err(MongoQueryError)?;

        let mut json_result: Vec<ExpenseResponse> = Vec::new();
        while let Some(doc) = cursor.next().await {
            json_result.push(self.doc_to_expense(&doc.unwrap())?);
        }

        Ok(ExpenseListResponse {
            status: "success",
            results: json_result.len(),
            expenses: json_result,
        })
    }

    pub async fn create_expense(
        &self,
        body: &CreateExpenseSchema,
    ) -> Result<SingleExpenseResponse> {
        let now = Utc::now();

        let expense = ExpenseModel {
            id: ObjectId::new(),
            title: body.title.clone(),
            amount: body.amount,
            category: body.category.clone(),
            date: body.date.clone(),
            cardOwner: body.cardOwner.clone(),
            createdAt: now,
            updatedAt: now,
        };

        self.expenses_collection
            .insert_one(&expense, None)
            .await
            .map_err(MongoQueryError)?;

        Ok(SingleExpenseResponse {
            status: "success",
            data: ExpenseData {
                expense: self.doc_to_expense(&expense)?,
            },
        })
    }

    pub async fn delete_expense(&self, id: &str) -> Result<BasicResponse> {
        let oid = ObjectId::from_str(id).map_err(|_| InvalidIDError(id.to_owned()))?;
        let filter = doc! {"_id": oid };

        let result = self
            .expenses_collection
            .delete_one(filter, None)
            .await
            .map_err(MongoQueryError)?;

        match result.deleted_count {
            0 => Err(NotFoundError(id.to_string())),
            _ => Ok(BasicResponse { status: "success" }),
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

    // pub async fn delete_note(&self, id: &str) -> Result<()> {
    //     let oid = ObjectId::from_str(id).map_err(|_| InvalidIDError(id.to_owned()))?;
    //     let filter = doc! {"_id": oid };

    //     let result = self
    //         .note_collection
    //         .delete_one(filter, None)
    //         .await
    //         .map_err(MongoQueryError)?;

    //     match result.deleted_count {
    //         0 => Err(NotFoundError(id.to_string())),
    //         _ => Ok(()),
    //     }
    // }

    fn doc_to_expense(&self, expense: &ExpenseModel) -> Result<ExpenseResponse> {
        let expense_response = ExpenseResponse {
            id: expense.id.to_hex(),
            title: expense.title.to_owned(),
            amount: expense.amount,
            category: expense.category.to_owned(),
            date: expense.date,
            cardOwner: expense.cardOwner.to_owned(),
            createdAt: expense.createdAt,
            updatedAt: expense.updatedAt,
        };

        Ok(expense_response)
    }
}
