use std::sync::Arc;

use axum::{
    routing::{delete, get, post, put},
    Router,
};

use crate::{
    handlers::task::{
        create_task_handler, create_tasks_from_routines_handler, create_tasks_handler,
        delete_all_tasks_handler, delete_task_handler, get_task_handler, get_today_tasks_handler,
        task_list_handler, update_task_handler,
    },
    AppState,
};

pub fn task_routes(app_state: Arc<AppState>) -> Router {
    Router::new()
        .route("/api/task", post(create_task_handler))
        .route("/api/tasks", post(create_tasks_handler))
        .route("/api/tasks", get(task_list_handler))
        .route("/api/tasks/today", post(create_tasks_from_routines_handler))
        .route("/api/tasks/today", get(get_today_tasks_handler))
        .route(
            "/api/tasks/:id",
            get(get_task_handler), // .patch(edit_note_handler)
                                   // .delete(delete_note_handler),
        )
        .route("/api/tasks/:id", put(update_task_handler))
        .route("/api/tasks/:id", delete(delete_task_handler))
        // .route("/api/tasks", delete(delete_all_tasks_handler))
        .with_state(app_state)
}
