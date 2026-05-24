use chrono::{DateTime, Datelike, Utc};
use chrono_tz::{America::Edmonton, Tz};

// Takes a cron schedule string "* * *" that only has
// - day of month
// - month of year
// - day of week
// - Returns true if schedule includes today
pub struct Schedule {
    pub day_of_month: String,
    pub month_of_year: String,
    pub day_of_week: String,
}

impl Schedule {
    pub fn new(input: String) -> Schedule {
        let mut values = Self::parse(input).into_iter();

        Schedule {
            day_of_month: values.next().unwrap(),
            month_of_year: values.next().unwrap(),
            day_of_week: values.next().unwrap(),
        }
    }

    pub fn parse(input: String) -> Vec<String> {
        input
            .chars()
            .filter(|c| !c.is_whitespace())
            .map(|c| c.to_string())
            .collect()
    }

    pub fn from_date(date: DateTime<Tz>) -> Schedule {
        let day_of_month = date.day().to_string();
        let month_of_year = date.month().to_string();
        let day_of_week = date.weekday().num_days_from_sunday().to_string();

        return Schedule {
            day_of_month,
            month_of_year,
            day_of_week,
        };
    }

    pub fn is_same_schedule(&self, other_task: Schedule) -> bool {
        is_same(&self.day_of_month, &other_task.day_of_month)
            && is_same(&self.month_of_year, &other_task.month_of_year)
            && is_same(&self.day_of_week, &other_task.day_of_week)
    }

    pub fn is_today_schedule(&self) -> bool {
        let today_utc = Utc::now();
        let today_edmonton = today_utc.with_timezone(&Edmonton);

        let today_schedule = Schedule::from_date(today_edmonton);
        self.is_same_schedule(today_schedule)
    }
}

pub fn is_same(value1: &str, value2: &str) -> bool {
    value1 == "*" || value2 == "*" || value1 == value2
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_basic_space_separated_values() {
        let input = String::from("* 11 3");
        let schedule = Schedule::new(input);

        assert_eq!(schedule.day_of_month, String::from("*"));
        assert_eq!(schedule.month_of_year, String::from("11"));
        assert_eq!(schedule.day_of_week, String::from("3"));
    }

    #[test]
    fn creates_schedule_for_today() {
        let today_utc = Utc::now();
        let today_edmonton = today_utc.with_timezone(&Edmonton);
        let schedule = Schedule::from_date(today_edmonton);

        assert_eq!(schedule.day_of_month, String::from("11"));
        assert_eq!(schedule.month_of_year, String::from("3"));
        assert_eq!(schedule.day_of_week, String::from("3"));
    }

    #[test]
    fn tests_is_same() {
        let value_star = "*";
        let value_1 = "1";
        let value_2 = "2";

        assert_eq!(is_same(value_star, value_1), true);
        assert_eq!(is_same(value_1, value_1), true);
        assert_eq!(is_same(value_2, value_1), false);
    }

    #[test]
    fn verifies_if_task_is_for_same() {
        let first_schedule = Schedule::new(String::from("* 12 9"));
        let second_schedule = Schedule::new(String::from("* 12 9"));

        assert_eq!(first_schedule.is_same_schedule(second_schedule), true);

        let third_schedule = Schedule::new(String::from("* * 9"));
        let fourth_schedule = Schedule::new(String::from("* 12 9"));

        assert_eq!(third_schedule.is_same_schedule(fourth_schedule), true);

        let fifth_schedule = Schedule::new(String::from("1 12 9"));
        let sixth_schedule = Schedule::new(String::from("1 12 8"));

        assert_eq!(fifth_schedule.is_same_schedule(sixth_schedule), false);
    }

    #[test]
    fn verifies_if_is_today_schedule() {
        let schedule = Schedule::new(String::from("* * *"));

        assert_eq!(schedule.is_today_schedule(), true);
    }
}
