use crate::response::RoutineResponse;

#[derive(Debug)]
pub struct Task {
    pub title: String,
    pub description: String,
    pub isCompleted: bool,
}

impl Task {
    pub fn from_routine(routine: RoutineResponse) -> Self {
        Task {
            title: routine.title,
            description: routine.description,
            isCompleted: false,
        }
    }
}

pub fn convert_routines_to_tasks(routines: Vec<RoutineResponse>) -> Vec<Task> {
    let mut tasks: Vec<Task> = Vec::new();

    for routine in routines {
        tasks.push(Task::from_routine(routine));
    }

    tasks
}
