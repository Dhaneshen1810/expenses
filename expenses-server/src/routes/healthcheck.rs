use std::sync::Arc;

use axum::{routing::get, Router};

use crate::{handlers::healthcheck::health_checker_handler, AppState};

pub fn healthcheck_routes(app_state: Arc<AppState>) -> Router {
    Router::new()
        .route("/api/healthchecker", get(health_checker_handler))
        .with_state(app_state)
}
