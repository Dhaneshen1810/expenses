use axum::{http::HeaderMap, response::IntoResponse, Json};

use crate::auth::verify_session;

pub async fn session_handler(headers: HeaderMap) -> impl IntoResponse {
    match verify_session(&headers).await {
        Ok(session) => Json(session).into_response(),
        Err(response) => response,
    }
}
