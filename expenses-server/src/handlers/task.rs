use crate::{
    schema::UpdateTaskSchema,
    utils::{converter::convert_routines_to_tasks, schedule::Schedule},
};
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use std::sync::Arc;

use crate::{
    error::MyError,
    model::RoutineModel,
    response::SingleRoutineResponse,
    schema::{CreateTaskSchema, FilterOptions},
    AppState,
};
use mongodb::bson::{doc, oid::ObjectId};

// type Result<T> = std::result::Result<T, MyError>;

pub async fn task_list_handler(
    opts: Option<Query<FilterOptions>>,
    State(app_state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let Query(opts) = opts.unwrap_or_default();

    let limit = opts.limit.unwrap_or(10) as i64;
    let page = opts.page.unwrap_or(1) as i64;

    match app_state
        .db
        .fetch_tasks(limit, page)
        .await
        .map_err(MyError::from)
    {
        Ok(res) => Ok(Json(res)),
        Err(e) => Err(e.into()),
    }
}

pub async fn create_task_handler(
    State(app_state): State<Arc<AppState>>,
    Json(body): Json<CreateTaskSchema>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    match app_state.db.create_task(&body).await.map_err(MyError::from) {
        Ok(res) => Ok((StatusCode::CREATED, Json(res))),
        Err(e) => Err(e.into()),
    }
}

pub async fn create_tasks_handler(
    State(app_state): State<Arc<AppState>>,
    Json(body): Json<Vec<CreateTaskSchema>>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    match app_state
        .db
        .create_batch_tasks(&body)
        .await
        .map_err(MyError::from)
    {
        Ok(res) => Ok((StatusCode::CREATED, Json(res))),
        Err(e) => Err(e.into()),
    }
}

pub async fn create_tasks_from_routines_handler(
    State(app_state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let routines_list = app_state.db.get_today_routines().await.unwrap();

    let tasks = convert_routines_to_tasks(routines_list.routines);

    let mut tasks_schema: Vec<CreateTaskSchema> = Vec::new();
    for task in tasks {
        tasks_schema.push(CreateTaskSchema {
            title: task.title,
            description: task.description,
        })
    }

    match app_state
        .db
        .create_batch_tasks(&tasks_schema)
        .await
        .map_err(MyError::from)
    {
        Ok(res) => Ok((StatusCode::CREATED, Json(res))),
        Err(e) => Err(e.into()),
    }
}

// Get routines
// Create tasks from routines
// }

// TODO - create tasks based on routine schedule
// pub async fn create_tasks_from_routine_handler(
//     State(app_state): State<Arc<AppState>>,
//     Json(body): Json<CreateTaskSchema>,
// ) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
//     match app_state.db.create_task(&body).await.map_err(MyError::from) {
//         Ok(res) => Ok((StatusCode::CREATED, Json(res))),
//         Err(e) => Err(e.into()),
//     }
// }

pub async fn update_task_handler(
    Path(id): Path<String>,
    State(app_state): State<Arc<AppState>>,
    Json(body): Json<UpdateTaskSchema>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    match app_state
        .db
        .update_task(&id, &body)
        .await
        .map_err(MyError::from)
    {
        Ok(res) => Ok(Json(res)),
        Err(e) => Err(e.into()),
    }
}

pub async fn get_task_handler(
    Path(id): Path<String>,
    State(app_state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    match app_state.db.get_task(&id).await.map_err(MyError::from) {
        Ok(res) => Ok(Json(res)),
        Err(e) => Err(e.into()),
    }
}

pub async fn get_today_tasks_handler(
    State(app_state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    match app_state.db.get_today_tasks().await.map_err(MyError::from) {
        Ok(res) => Ok(Json(res)),
        Err(e) => Err(e.into()),
    }
}

pub async fn delete_task_handler(
    Path(id): Path<String>,
    State(app_state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    match app_state.db.delete_task(&id).await.map_err(MyError::from) {
        Ok(res) => Ok(Json(res)),
        Err(e) => Err(e.into()),
    }
}

pub async fn delete_all_tasks_handler(
    State(app_state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    match app_state.db.delete_all_tasks().await.map_err(MyError::from) {
        Ok(res) => Ok(Json(res)),
        Err(e) => Err(e.into()),
    }
}
