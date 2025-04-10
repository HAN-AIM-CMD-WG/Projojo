from typedb.driver import TypeDB, TransactionType, Credentials, DriverOptions
import os
from dotenv import load_dotenv


# Load environment variables from .env file
load_dotenv()

class Db:
    address = os.getenv("TYPEDB_SERVER_ADDR", "127.0.0.1:1729")
    name = os.getenv("TYPEDB_NAME", "projojo_db")
    username = os.getenv("TYPEDB_USERNAME", "admin")
    password = os.getenv("TYPEDB_PASSWORD", "password")
    reset = True if str.lower(os.getenv("RESET_DB", "no")) == "yes" else False
    schema_path = "db/schema.tql"
    seed_path = "db/seed.tql"
    driver = TypeDB.core_driver( address, Credentials( username, password), DriverOptions(False, None))    
    db = driver.databases.get(name) if driver.databases.contains(name) else None
    
    @staticmethod
    def schema_transact(query):
        with Db.driver.transaction(Db.name, TransactionType.SCHEMA) as tx:
            tx.query(query).resolve()
            tx.commit
    
    @staticmethod
    def read_transact(query):
        with Db.driver.transaction(Db.name, TransactionType.READ) as tx:
            return tx.query(query).resolve()
        
    @staticmethod
    def write_transact(query):
        with Db.driver.transaction(Db.name, TransactionType.WRITE) as tx:
            tx.query(query).resolve()
            tx.commit

print( f"Using database: {Db.name}")

def main():
    if Db.reset and Db.db is not None:
        Db.db.delete()    
        Db.db = None
    if Db.db is None:
        print(f"Creating a new database: {Db.name}")
        Db.driver.databases.create(Db.name)
        Db.db = Db.driver.databases.get(Db.name)
        with open(Db.schema_path, 'r') as file:
            print("Installing schema", end="... ")
            schema_query = file.read()
            Db.schema_transact(schema_query)
            print("OK")
            print(schema_query)
        with open(Db.seed_path, 'r') as file:
            print("Installing seed data", end="... ")
            seed_query = file.read()
            Db.write_transact(seed_query)
            print("OK")
    # Perform operations with the database
    print(f"Connected to database: {Db.name}")

    # Example: Run a query
    print("Running a sample query", end="... ")
    read_query = """
        match $u isa user; 

        fetch { 'phone': $u.phone, 'email': $u.email};
    """
    result = Db.read_transact(read_query).resolve()
    print(f"{len(result)} users:")
    print(result)
    Db.driver.close()



if __name__ == "__main__":
    main()
