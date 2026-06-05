use axum::{
    body::Body,
    http::{header, HeaderMap, Request, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::{json, Value};

fn auth_server_url() -> String {
    std::env::var("AUTH_SERVER_URL").unwrap_or_else(|_| "http://localhost:8080".to_string())
}

pub async fn require_auth(req: Request<Body>, next: Next) -> Response {
    match verify_session(req.headers()).await {
        Ok(_) => next.run(req).await,
        Err(response) => response,
    }
}

pub async fn verify_session(headers: &HeaderMap) -> Result<Value, Response> {
    let Some(auth_header) = headers.get(header::AUTHORIZATION).cloned() else {
        return Err(unauthorized("Missing Authorization bearer token"));
    };

    let Ok(auth_header_value) = auth_header.to_str() else {
        return Err(unauthorized("Invalid Authorization header"));
    };

    if !auth_header_value.starts_with("Bearer ") {
        return Err(unauthorized("Authorization header must use Bearer scheme"));
    }

    let me_url = format!("{}/me", auth_server_url().trim_end_matches('/'));
    let auth_res = reqwest::Client::new()
        .get(me_url)
        .header(header::AUTHORIZATION, auth_header_value)
        .send()
        .await;

    let res = match auth_res {
        Ok(res) => res,
        Err(_) => {
            return Err((
                StatusCode::BAD_GATEWAY,
                Json(json!({ "error": "Auth service is unavailable" })),
            )
                .into_response())
        }
    };

    if !res.status().is_success() {
        return Err(unauthorized("Invalid or expired session"));
    }

    Ok(res.json::<Value>().await.unwrap_or_else(|_| json!({})))
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
