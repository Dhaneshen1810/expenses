use crate::error::MyError;
use crate::model::ExpenseModel;
use mongodb::{options::ClientOptions, Client, Collection};

#[derive(Clone, Debug)]
pub struct DB {
    pub expenses_collection: Collection<ExpenseModel>,
}

type Result<T> = std::result::Result<T, MyError>;

impl DB {
    pub async fn init() -> Result<Self> {
        let mongodb_uri = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set.");
        let database_name =
            std::env::var("MONGO_INITDB_DATABASE").expect("MONGO_INITDB_DATABASE must be set.");

        let expenses_collection_name = std::env::var("MONGODB_EXPENSE_COLLECTION")
            .expect("MONGODB_EXPENSE_COLLECTION must be set.");

        let mut client_options = ClientOptions::parse(mongodb_uri).await?;
        client_options.app_name = Some(database_name.to_string());

        let client = Client::with_options(client_options)?;
        let database = client.database(database_name.as_str());

        let expenses_collection = database.collection::<ExpenseModel>(&expenses_collection_name);

        println!("✅ Database connected successfully");

        Ok(Self {
            expenses_collection,
        })
    }
}
