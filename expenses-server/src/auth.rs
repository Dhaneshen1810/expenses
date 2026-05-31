use axum::{
    body::Body,
    http::{header, Request, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;

fn auth_server_url() -> String {
    std::env::var("AUTH_SERVER_URL").unwrap_or_else(|_| "http://localhost:8080".to_string())
}

pub async fn require_auth(req: Request<Body>, next: Next) -> Response {
    let Some(auth_header) = req.headers().get(header::AUTHORIZATION).cloned() else {
        return unauthorized("Missing Authorization bearer token");
    };

    let Ok(auth_header_value) = auth_header.to_str() else {
        return unauthorized("Invalid Authorization header");
    };

    if !auth_header_value.starts_with("Bearer ") {
        return unauthorized("Authorization header must use Bearer scheme");
    }

    let me_url = format!("{}/me", auth_server_url().trim_end_matches('/'));
    let auth_res = reqwest::Client::new()
        .get(me_url)
        .header(header::AUTHORIZATION, auth_header_value)
        .send()
        .await;

    match auth_res {
        Ok(res) if res.status().is_success() => next.run(req).await,
        Ok(_) => unauthorized("Invalid or expired session"),
        Err(_) => (
            StatusCode::BAD_GATEWAY,
            Json(json!({ "error": "Auth service is unavailable" })),
        )
            .into_response(),
    }
}

fn unauthorized(message: &str) -> Response {
    (
        StatusCode::UNAUTHORIZED,
        Json(json!({
            "error": message,
        })),
    )
        .into_response()
}
