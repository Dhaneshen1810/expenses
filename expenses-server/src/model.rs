use chrono::prelude::*;
use mongodb::bson::{self, oid::ObjectId};
use serde::{Deserialize, Serialize};

#[allow(non_snake_case)]
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ExpenseModel {
    #[serde(rename = "_id")]
    pub id: ObjectId,
    pub title: String,
    pub amount: i64,
    pub category: ExpenseCategory,
    #[serde(with = "bson::serde_helpers::chrono_datetime_as_bson_datetime")]
    pub date: DateTime<Utc>,
    pub cardOwner: CardOwner,
    #[serde(with = "bson::serde_helpers::chrono_datetime_as_bson_datetime")]
    pub createdAt: DateTime<Utc>,
    #[serde(with = "bson::serde_helpers::chrono_datetime_as_bson_datetime")]
    pub updatedAt: DateTime<Utc>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum ExpenseCategory {
    Grocery,
    EatingOut,
    Gas,
    DhanMisc,
    NidhiMisc,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum CardOwner {
    Dhan,
    Nidhi,
}

// Old code
#[allow(non_snake_case)]
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct NoteModel {
    #[serde(rename = "_id")]
    pub id: ObjectId,
    pub title: String,
    pub content: String,
    pub category: Option<String>,
    pub published: Option<bool>,
    #[serde(with = "bson::serde_helpers::chrono_datetime_as_bson_datetime")]
    pub createdAt: DateTime<Utc>,
    #[serde(with = "bson::serde_helpers::chrono_datetime_as_bson_datetime")]
    pub updatedAt: DateTime<Utc>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum RecurringEvery {
    Day,
    Week,
    TwoWeeks,
    Month,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum WeekDay {
    Mon,
    Tue,
    Wed,
    Thu,
    Fri,
    Sat,
    Sun,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RecurringOption {
    pub frequency: String,
    // pub every: RecurringEvery,
    // #[serde(skip_serializing_if = "Option::is_none")]
    // pub day: Option<WeekDay>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub time: Option<String>,
}

#[allow(non_snake_case)]
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RoutineModel {
    #[serde(rename = "_id")]
    pub id: ObjectId,
    pub title: String,
    pub description: String,
    pub recurringOption: RecurringOption,
    #[serde(with = "bson::serde_helpers::chrono_datetime_as_bson_datetime")]
    pub createdAt: DateTime<Utc>,
    #[serde(with = "bson::serde_helpers::chrono_datetime_as_bson_datetime")]
    pub updatedAt: DateTime<Utc>,
}

#[allow(non_snake_case)]
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TaskModel {
    #[serde(rename = "_id")]
    pub id: ObjectId,
    pub title: String,
    pub description: String,
    #[serde(default)]
    pub isCompleted: bool,
    #[serde(with = "bson::serde_helpers::chrono_datetime_as_bson_datetime")]
    pub createdAt: DateTime<Utc>,
    #[serde(with = "bson::serde_helpers::chrono_datetime_as_bson_datetime")]
    pub updatedAt: DateTime<Utc>,
}
