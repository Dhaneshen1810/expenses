use crate::{model::TaskModel, schema::CreateTaskSchema};
use chrono::Utc;
use mongodb::bson::oid::ObjectId;

pub fn create_task(input: CreateTaskSchema) -> TaskModel {
    let now = Utc::now();

    let task = TaskModel {
        id: ObjectId::new(),
        title: input.title.clone(),
        description: input.description.clone(),
        isCompleted: false,
        createdAt: now,
        updatedAt: now,
    };

    return task;
}

pub fn create_tasks(input: Vec<CreateTaskSchema>) -> Vec<TaskModel> {
    let mut tasks: Vec<TaskModel> = Vec::new();
    let now = Utc::now();

    for data in input {
        let task = TaskModel {
            id: ObjectId::new(),
            title: data.title.clone(),
            description: data.description.clone(),
            isCompleted: false,
            createdAt: now,
            updatedAt: now,
        };

        tasks.push(task);
    }

    return tasks;
}
