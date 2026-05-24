use std::sync::Arc;

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};

use crate::{
    error::MyError,
    model::RoutineModel,
    response::SingleRoutineResponse,
    schema::{CreateRoutineSchema, FilterOptions},
    AppState,
};
use mongodb::bson::{doc, oid::ObjectId};

// type Result<T> = std::result::Result<T, MyError>;

pub async fn routine_list_handler(
    opts: Option<Query<FilterOptions>>,
    State(app_state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let Query(opts) = opts.unwrap_or_default();

    let limit = opts.limit.unwrap_or(10) as i64;
    let page = opts.page.unwrap_or(1) as i64;

    match app_state
        .db
        .fetch_routines(limit, page)
        .await
        .map_err(MyError::from)
    {
        Ok(res) => Ok(Json(res)),
        Err(e) => Err(e.into()),
    }
}

pub async fn create_routine_handler(
    State(app_state): State<Arc<AppState>>,
    Json(body): Json<CreateRoutineSchema>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    match app_state
        .db
        .create_routine(&body)
        .await
        .map_err(MyError::from)
    {
        Ok(res) => Ok((StatusCode::CREATED, Json(res))),
        Err(e) => Err(e.into()),
    }
}

pub async fn get_routine_handler(
    Path(id): Path<String>,
    State(app_state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    match app_state.db.get_routine(&id).await.map_err(MyError::from) {
        Ok(res) => Ok(Json(res)),
        Err(e) => Err(e.into()),
    }
}

pub async fn delete_routine_handler(
    Path(id): Path<String>,
    State(app_state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    match app_state
        .db
        .delete_routine(&id)
        .await
        .map_err(MyError::from)
    {
        Ok(_) => Ok(StatusCode::NO_CONTENT),
        Err(e) => Err(e.into()),
    }
}

// pub async fn delete_note_handler(
//     Path(id): Path<String>,
//     State(app_state): State<Arc<AppState>>,
// ) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
//     match app_state.db.delete_note(&id).await.map_err(MyError::from) {
//         Ok(_) => Ok(StatusCode::NO_CONTENT),
//         Err(e) => Err(e.into()),
//     }
// }

// pub async fn get_routine_handler(
//     Path(id): Path<String>,
//     State(app_state): State<Arc<AppState>>,
// ) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
//     match app_state.db.get_note(&id).await.map_err(MyError::from) {
//         Ok(res) => Ok(Json(res)),
//         Err(e) => Err(e.into()),
//     }
// }

// pub async fn edit_note_handler(
//     Path(id): Path<String>,
//     State(app_state): State<Arc<AppState>>,
//     Json(body): Json<UpdateNoteSchema>,
// ) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
//     match app_state
//         .db
//         .edit_note(&id, &body)
//         .await
//         .map_err(MyError::from)
//     {
//         Ok(res) => Ok(Json(res)),
//         Err(e) => Err(e.into()),
//     }
// }
