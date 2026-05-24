use std::sync::Arc;

use axum::{
    routing::{delete, get, post},
    Router,
};

use crate::{
    handlers::expenses::{create_expense_handler, delete_expense_handler, expense_list_handler},
    AppState,
};

pub fn expenses_routes(app_state: Arc<AppState>) -> Router {
    Router::new()
        .route("/api/expenses", post(create_expense_handler))
        .route("/api/expenses", get(expense_list_handler))
        .route("/api/expenses/:id", delete(delete_expense_handler))
        .with_state(app_state)
}
