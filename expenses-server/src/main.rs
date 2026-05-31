mod auth;
mod db;
mod error;
mod factories;
mod handlers;
mod model;
mod response;
mod routes;
mod schema;
mod utils;

use std::sync::Arc;

use axum::http::{
    header::{ACCEPT, AUTHORIZATION, CONTENT_TYPE},
    HeaderValue, Method,
};
use db::DB;
use dotenv::dotenv;
use error::MyError;
use routes::create_router;
use tower_http::cors::CorsLayer;

pub struct AppState {
    db: DB,
}

#[tokio::main]
async fn main() -> Result<(), MyError> {
    dotenv().ok();

    let db = DB::init().await?;

    let cors = CorsLayer::new()
        .allow_origin("http://localhost:3000".parse::<HeaderValue>().unwrap())
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PATCH,
            Method::DELETE,
            Method::PUT,
        ])
        .allow_credentials(true)
        .allow_headers([AUTHORIZATION, ACCEPT, CONTENT_TYPE]);

    let app = create_router(Arc::new(AppState { db: db.clone() })).layer(cors);

    println!("🚀 Server started successfully");
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8000").await.unwrap();
    axum::serve(listener, app).await.unwrap();

    Ok(())
}
