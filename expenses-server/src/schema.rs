use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::model::{CardOwner, ExpenseCategory, RecurringOption};

#[derive(Serialize, Deserialize, Debug)]
#[allow(non_snake_case)]
pub struct CreateExpenseSchema {
    pub title: String,
    pub amount: i64,
    pub category: ExpenseCategory,
    pub date: DateTime<Utc>,
    pub cardOwner: CardOwner,
}

// TODO: remove old code below
#[derive(Deserialize, Debug, Default)]
pub struct FilterOptions {
    pub page: Option<usize>,
    pub limit: Option<usize>,
}

#[derive(Deserialize, Debug)]
pub struct ParamOptions {
    pub id: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CreateNoteSchema {
    pub title: String,
    pub content: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub published: Option<bool>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateNoteSchema {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub published: Option<bool>,
}

#[derive(Serialize, Deserialize, Debug)]
#[allow(non_snake_case)]

pub struct CreateRoutineSchema {
    pub title: String,
    pub description: String,
    pub recurringOption: RecurringOption,
}

#[derive(Serialize, Deserialize, Debug)]
#[allow(non_snake_case)]

pub struct CreateTaskSchema {
    pub title: String,
    pub description: String,
}

#[derive(Serialize, Deserialize, Debug)]
#[allow(non_snake_case)]

pub struct UpdateTaskSchema {
    pub title: String,
    pub description: String,
    pub isCompleted: bool,
}
