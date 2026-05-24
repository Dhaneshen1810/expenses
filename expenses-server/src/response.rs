use chrono::{DateTime, Utc};
use serde::Serialize;

use crate::model::{CardOwner, ExpenseCategory, RecurringOption};

#[allow(non_snake_case)]
#[derive(Serialize, Debug)]
pub struct ExpenseResponse {
    pub id: String,
    pub title: String,
    pub amount: i64,
    pub category: ExpenseCategory,
    pub date: DateTime<Utc>,
    pub cardOwner: CardOwner,
    pub createdAt: DateTime<Utc>,
    pub updatedAt: DateTime<Utc>,
}

#[derive(Serialize, Debug)]
pub struct ExpenseData {
    pub expense: ExpenseResponse,
}

#[derive(Serialize, Debug)]
pub struct SingleExpenseResponse {
    pub status: &'static str,
    pub data: ExpenseData,
}

#[derive(Serialize, Debug)]
pub struct ExpenseListResponse {
    pub status: &'static str,
    pub results: usize,
    pub expenses: Vec<ExpenseResponse>,
}

// TODO: remove old code below
#[derive(Serialize)]
pub struct GenericResponse {
    pub status: String,
    pub message: String,
}

#[allow(non_snake_case)]
#[derive(Serialize, Debug)]
pub struct NoteResponse {
    pub id: String,
    pub title: String,
    pub content: String,
    pub category: String,
    pub published: bool,
    pub createdAt: DateTime<Utc>,
    pub updatedAt: DateTime<Utc>,
}

#[derive(Serialize, Debug)]
pub struct NoteData {
    pub note: NoteResponse,
}

#[derive(Serialize, Debug)]
pub struct SingleNoteResponse {
    pub status: &'static str,
    pub data: NoteData,
}

#[derive(Serialize, Debug)]
pub struct NoteListResponse {
    pub status: &'static str,
    pub results: usize,
    pub notes: Vec<NoteResponse>,
}

#[allow(non_snake_case)]
#[derive(Serialize, Debug)]
pub struct RoutineResponse {
    pub id: String,
    pub title: String,
    pub description: String,
    pub recurringOption: RecurringOption,
    pub createdAt: DateTime<Utc>,
    pub updatedAt: DateTime<Utc>,
}

#[derive(Serialize, Debug)]
pub struct RoutineListResponse {
    pub status: &'static str,
    pub results: usize,
    pub routines: Vec<RoutineResponse>,
}

#[derive(Serialize, Debug)]
pub struct RoutineData {
    pub routine: RoutineResponse,
}

#[derive(Serialize, Debug)]
pub struct SingleRoutineResponse {
    pub status: &'static str,
    pub data: RoutineData,
}

// Tasks
#[allow(non_snake_case)]
#[derive(Serialize, Debug)]
pub struct TaskResponse {
    pub id: String,
    pub title: String,
    pub description: String,
    pub isCompleted: bool,
    pub createdAt: DateTime<Utc>,
    pub updatedAt: DateTime<Utc>,
}

#[derive(Serialize, Debug)]
pub struct TaskListResponse {
    pub status: &'static str,
    pub results: usize,
    pub tasks: Vec<TaskResponse>,
}

#[derive(Serialize, Debug)]
pub struct TaskData {
    pub task: TaskResponse,
}

#[derive(Serialize, Debug)]
pub struct BatchTaskData {
    pub tasks: Vec<TaskResponse>,
}

#[derive(Serialize, Debug)]
pub struct SingleTaskResponse {
    pub status: &'static str,
    pub data: TaskData,
}

#[derive(Serialize, Debug)]
pub struct BatchTaskResponse {
    pub status: &'static str,
    pub data: BatchTaskData,
}

#[derive(Serialize, Debug)]
pub struct BasicResponse {
    pub status: &'static str,
}
