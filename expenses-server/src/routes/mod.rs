use std::sync::Arc;

use axum::Router;
pub mod expenses;
pub mod healthcheck;

use crate::AppState;

pub fn create_router(app_state: Arc<AppState>) -> Router {
    Router::new()
        .merge(expenses::expenses_routes(app_state.clone()))
        .merge(healthcheck::healthcheck_routes(app_state))
}
