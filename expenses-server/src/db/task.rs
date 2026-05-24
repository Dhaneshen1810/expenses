use super::DB;
use crate::error::MyError;
use crate::factories;
use crate::model::TaskModel;
use crate::response::{
    BasicResponse, BatchTaskData, BatchTaskResponse, SingleTaskResponse, TaskData,
    TaskListResponse, TaskResponse,
};
use crate::schema::{CreateTaskSchema, UpdateTaskSchema};
use crate::{
    error::MyError::*, model::NoteModel, schema::CreateNoteSchema, schema::UpdateNoteSchema,
};
use chrono::prelude::*;
use futures::StreamExt;
use mongodb::bson::{doc, oid::ObjectId, DateTime as BsonDateTime};
use mongodb::options::{FindOneAndUpdateOptions, FindOptions, IndexOptions, ReturnDocument};
use mongodb::{bson, IndexModel};
use std::str::FromStr;

// use chrono::{Datelike, TimeZone, Utc};
use chrono_tz::America::Edmonton;
use futures::TryStreamExt;

type Result<T> = std::result::Result<T, MyError>;

impl DB {
    pub async fn fetch_tasks(&self, limit: i64, page: i64) -> Result<TaskListResponse> {
        let find_options = FindOptions::builder()
            .limit(limit)
            .skip(u64::try_from((page - 1) * limit).unwrap())
            .build();

        let mut cursor: mongodb::Cursor<TaskModel> = self
            .task_collection
            .find(None, find_options)
            .await
            .map_err(MongoQueryError)?;

        let mut json_result: Vec<TaskResponse> = Vec::new();
        while let Some(doc) = cursor.next().await {
            json_result.push(self.doc_to_task(&doc.unwrap())?);
        }

        Ok(TaskListResponse {
            status: "success",
            results: json_result.len(),
            tasks: json_result,
        })
    }

    pub async fn create_task(&self, body: &CreateTaskSchema) -> Result<SingleTaskResponse> {
        let input: CreateTaskSchema = CreateTaskSchema {
            title: body.title.clone(),
            description: body.description.clone(),
        };

        let task = factories::task::create_task(input);

        self.task_collection
            .insert_one(&task, None)
            .await
            .map_err(MongoQueryError)?;

        Ok(SingleTaskResponse {
            status: "success",
            data: TaskData {
                task: self.doc_to_task(&task)?,
            },
        })
    }

    pub async fn create_batch_tasks(
        &self,
        body: &Vec<CreateTaskSchema>,
    ) -> Result<BatchTaskResponse> {
        let mut tasks: Vec<TaskModel> = Vec::new();

        for task in body {
            let input = CreateTaskSchema {
                title: task.title.clone(),
                description: task.description.clone(),
            };

            let created_task = factories::task::create_task(input);

            tasks.push(created_task);
        }

        self.task_collection
            .insert_many(&tasks, None)
            .await
            .map_err(MongoQueryError)?;

        Ok(BatchTaskResponse {
            status: "success",
            data: BatchTaskData {
                tasks: self.doc_to_tasks(&tasks)?,
            },
        })
    }

    pub async fn get_task(&self, id: &str) -> Result<SingleTaskResponse> {
        let oid = ObjectId::from_str(id).map_err(|_| InvalidIDError(id.to_owned()))?;

        let task_doc = self
            .task_collection
            .find_one(doc! {"_id":oid }, None)
            .await
            .map_err(MongoQueryError)?;

        match task_doc {
            Some(doc) => {
                let task = self.doc_to_task(&doc)?;
                Ok(SingleTaskResponse {
                    status: "success",
                    data: TaskData { task },
                })
            }
            None => Err(NotFoundError(id.to_string())),
        }
    }

    pub async fn get_today_tasks(&self) -> Result<TaskListResponse> {
        let now_edmonton = Edmonton.from_utc_datetime(&Utc::now().naive_utc());

        let start_of_day = Edmonton
            .with_ymd_and_hms(
                now_edmonton.year(),
                now_edmonton.month(),
                now_edmonton.day(),
                0,
                0,
                0,
            )
            .unwrap()
            .with_timezone(&Utc);

        let end_of_day = Edmonton
            .with_ymd_and_hms(
                now_edmonton.year(),
                now_edmonton.month(),
                now_edmonton.day(),
                23,
                59,
                59,
            )
            .unwrap()
            .with_timezone(&Utc);

        let filter = doc! {
            "createdAt": {
                "$gte": BsonDateTime::from_chrono(start_of_day),
                "$lte": BsonDateTime::from_chrono(end_of_day),
            }
        };

        let mut cursor = self.task_collection.find(filter, None).await?;

        let mut tasks = Vec::new();

        while let Some(task) = cursor.try_next().await? {
            println!("task {:?}", task);

            tasks.push(task);
        }

        Ok(TaskListResponse {
            status: "success",
            results: tasks.len(),
            tasks: self.doc_to_tasks(&tasks)?,
        })
    }

    pub async fn delete_task(&self, id: &str) -> Result<BasicResponse> {
        let oid = ObjectId::from_str(id).map_err(|_| InvalidIDError(id.to_owned()))?;
        let filter = doc! {"_id": oid };

        let result = self
            .task_collection
            .delete_one(filter, None)
            .await
            .map_err(MongoQueryError)?;

        match result.deleted_count {
            0 => Err(NotFoundError(id.to_string())),
            _ => Ok(BasicResponse { status: "success" }),
        }
    }

    pub async fn delete_all_tasks(&self) -> Result<BasicResponse> {
        let result = self
            .task_collection
            .delete_many(doc! {}, None)
            .await
            .map_err(MongoQueryError)?;

        Ok(BasicResponse { status: "success" })
    }

    pub async fn update_task(
        &self,
        id: &str,
        body: &UpdateTaskSchema,
    ) -> Result<SingleTaskResponse> {
        let oid = ObjectId::from_str(id).map_err(|_| InvalidIDError(id.to_owned()))?;
        println!("body is {:?}", body);

        let mut set_doc = doc! {};

        set_doc.insert("title", &body.title);
        set_doc.insert("description", &body.description);
        set_doc.insert("isCompleted", &body.isCompleted);
        set_doc.insert(
            "updatedAt",
            mongodb::bson::DateTime::from_chrono(chrono::Utc::now()),
        );

        let update = doc! {
            "$set": set_doc,
        };

        println!("set {:?}", update);

        let options = FindOneAndUpdateOptions::builder()
            .return_document(ReturnDocument::After)
            .build();

        if let Some(doc) = self
            .task_collection
            .find_one_and_update(doc! {"_id": oid}, update, options)
            .await
            .map_err(MongoQueryError)?
        {
            let task = self.doc_to_task(&doc)?;
            println!(
                "isCompleted: {} ({})",
                task.isCompleted,
                std::any::type_name_of_val(&task.isCompleted)
            );
            let task_response = SingleTaskResponse {
                status: "success",
                data: TaskData { task },
            };
            Ok(task_response)
        } else {
            Err(NotFoundError(id.to_string()))
        }
    }

    fn doc_to_task(&self, task: &TaskModel) -> Result<TaskResponse> {
        let task_response = TaskResponse {
            id: task.id.to_hex(),
            title: task.title.to_owned(),
            description: task.description.to_owned(),
            isCompleted: task.isCompleted.to_owned(),
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
        };

        Ok(task_response)
    }

    fn doc_to_tasks(&self, tasks: &Vec<TaskModel>) -> Result<Vec<TaskResponse>> {
        let mut task_responses: Vec<TaskResponse> = Vec::new();

        for task in tasks {
            let task_response = TaskResponse {
                id: task.id.to_hex(),
                title: task.title.to_owned(),
                description: task.description.to_owned(),
                isCompleted: task.isCompleted.to_owned(),
                createdAt: task.createdAt,
                updatedAt: task.updatedAt,
            };

            task_responses.push(task_response);
        }

        Ok(task_responses)
    }
}
