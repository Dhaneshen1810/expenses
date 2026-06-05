use std::sync::Arc;

use axum::{routing::get, Router};

use crate::{handlers::session::session_handler, AppState};

pub fn session_routes(app_state: Arc<AppState>) -> Router {
    Router::new()
        .route("/api/session", get(session_handler))
        .with_state(app_state)
}
