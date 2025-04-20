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
    driver = TypeDB.driver( address, Credentials( username, password), DriverOptions(False, None))    
    db = driver.databases.get(name) if driver.databases.contains(name) else None
    
    @staticmethod
    def schema_transact(query):
        with Db.driver.transaction(Db.name, TransactionType.SCHEMA) as tx:
            tx.query(query).resolve()
            tx.commit()
    
    @staticmethod
    def read_transact(query):
        with Db.driver.transaction(Db.name, TransactionType.READ) as tx:
            return tx.query(query).resolve()
        
    @staticmethod
    def write_transact(query):
        with Db.driver.transaction(Db.name, TransactionType.WRITE) as tx:
            tx.query(query).resolve()
            tx.commit()

print( f"Using database: {Db.name}")

def init_database():
    createDB()    
    return Db

def createDB():
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
        with open(Db.seed_path, 'r') as file:
            print("Installing seed data", end="... ")
            seed_query = file.read()
            Db.write_transact(seed_query)
            print("OK")
    # Perform operations with the database


def main():
    createDB()

    # Example: Run a query
    print()
    print("Running a sample query")
    read_query = """
        match 
            $s isa supervisor; 
            $ip isa identityProvider;
            $b isa business;
            authentication( $s, $ip );
            businessAssociation( $b, $s );
        fetch { 
            'name': $s.fullName, 
            'email': $s.email, 
            'provider': $ip.name,
            'business': $b.name,
            'location': [$b.location],
        };
    """
    result = Db.read_transact(read_query)
    # print(result)
    for user in result:
        print(user)
    Db.driver.close()



if __name__ == "__main__":
    main()
