use std::sync::Arc;

use axum::{
    routing::{delete, get, post},
    Router,
};

use crate::{
    handlers::routine::{
        create_routine_handler, delete_routine_handler, get_routine_handler, routine_list_handler,
    },
    AppState,
};

pub fn routine_routes(app_state: Arc<AppState>) -> Router {
    Router::new()
        .route("/api/routines", post(create_routine_handler))
        .route("/api/routines", get(routine_list_handler))
        .route(
            "/api/routines/:id",
            get(get_routine_handler), // .patch(edit_note_handler)
                                      // .delete(delete_note_handler),
        )
        .route("/api/routines/:id", delete(delete_routine_handler))
        .with_state(app_state)
}
