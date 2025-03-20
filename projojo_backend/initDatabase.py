from typedb.driver import TypeDB, TransactionType, Credentials, DriverOptions
from enum import Enum
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Edition(Enum):
    Cloud = 1
    Core = 2

SERVER_ADDR = os.getenv("TYPEDB_SERVER_ADDR", "127.0.0.1:1729")
DB_NAME = os.getenv("TYPEDB_DB_NAME", "projojo_db")
USERNAME = os.getenv("TYPEDB_USERNAME", "admin")
PASSWORD = os.getenv("TYPEDB_PASSWORD", "password")


def main():
    with driver_connect(Edition.Core, SERVER_ADDR) as driver:
        if db_setup(driver, DB_NAME, db_reset=True):
            queries(driver, DB_NAME)
        else:
            print("Terminating...")
            exit()

def driver_connect(edition, uri, username=USERNAME, password=PASSWORD):
    if edition is Edition.Core:
        driver = TypeDB.core_driver(uri, Credentials(username, password), DriverOptions(False, None))
        return driver
    else:
        raise Exception("Cloud edition not supported.")

def db_setup(driver, db_name, db_reset=False):
    print(f"Setting up the database: {db_name}")
    if driver.databases.contains(db_name):
        if db_reset:
            if not replace_database(driver, db_name):
                return False
        else:
            print("Reusing an existing database.")
    else:  # No such database found on the server
        if not create_database(driver, db_name):
            print("Failed to create a new database. Terminating...")
            return False
    if driver.databases.contains(db_name):
        return validate_data(driver, db_name)
    else:
        print("Database not found. Terminating...")
        return False    

def create_database(driver, db_name) -> bool:
    print("Creating a new database", end="...")
    driver.databases.create(db_name)
    print("OK")
    db_schema_setup(driver, db_name)
    db_dataset_setup(driver, db_name)
    return True

def replace_database(driver, db_name) -> bool:
    print("Deleting an existing database", end="...")
    driver.databases.get(db_name).delete()  # Delete the database if it exists already
    print("OK")
    if create_database(driver, db_name):
        return True
    else:
        print("Failed to create a new database. Terminating...")
        return False

def db_schema_setup(driver, db_name, schema_file='schema.tql'):
    with open(schema_file, 'r') as data:
        define_query = data.read()
    with driver.transaction(db_name, TransactionType.SCHEMA) as tx:
        print("Defining schema", end="...")
        tx.query(define_query).resolve()
        tx.commit()
        print("OK")

def db_dataset_setup(driver, db_name, data_file='data_small_single_query.tql'):
    with open(data_file, 'r') as data:
        insert_query = data.read()
    with driver.transaction(db_name, TransactionType.WRITE) as tx:
        print("Loading data", end="...")
        tx.query(insert_query).resolve()
        tx.commit()
        print("OK")


def validate_data(driver, db_name) -> bool:
    with driver.transaction(db_name, TransactionType.READ) as tx:
        count_query = "match $u isa user; reduce $count = count;"
        print("Testing the dataset", end="...")
        count = next(tx.query(count_query).resolve().as_concept_rows()).get("count").try_get_integer()
        if count == 3:
            print("Passed")
            return True
        else:
            print("Validation failed, unexpected number of users:", count, "\n Expected result: 3. Terminating...")
            return False

def queries(driver, db_name):
    print("\nRequest 1 of 6: Fetch all users as JSON objects with emails and phone numbers")
    users = fetch_all_users(driver, DB_NAME)
    assert len(users) == 3

    new_phone = "17778889999"
    new_email = "jk@typedb.com"
    new_username = "k-koolidge"
    print(f"\nRequest 2 of 6: Add a new user with the email {new_email} and phone {new_phone}")
    insert_new_user(driver, DB_NAME, new_email, new_phone, new_username)

    kevin_email = "kevin.morrison@typedb.com"
    print(f"\nRequest 3 of 6: Find direct relatives of a user with email {kevin_email}")
    relatives = get_direct_relatives_by_email(driver, DB_NAME, kevin_email)
    assert relatives is not None
    assert len(relatives) == 1

    print(f"\nRequest 4 of 6: Transitively find all relatives of a user with email {kevin_email}")
    relatives = get_all_relatives_by_email(driver, DB_NAME, kevin_email)
    assert relatives is not None
    assert len(relatives) == 2

    old_kevin_phone = "110000000"
    new_kevin_phone = "110000002"
    print(f"\nRequest 5 of 6: Update the phone of a of user with email {kevin_email} from {old_kevin_phone} to {new_kevin_phone}")
    updated_users = update_phone_by_email(driver, DB_NAME, kevin_email, old_kevin_phone, new_kevin_phone)
    assert updated_users is not None
    assert len(updated_users) == 1

    print(f'\nRequest 6 of 6: Delete the user with email "{new_email}"')
    delete_user_by_email(driver, DB_NAME, new_email)


def fetch_all_users(driver, db_name) -> list:
    with driver.transaction(db_name, TransactionType.READ) as tx:
        query = "match $u isa user; fetch { 'phone': $u.phone, 'email': $u.email };"
        answers = list(tx.query(query).resolve().as_concept_documents())
        for i, JSON in enumerate(answers, start=0):
            print(f"JSON #{i}: {JSON}")
        return answers
    
def insert_new_user(driver, db_name, email, phone, username) -> list:
    with driver.transaction(db_name, TransactionType.WRITE) as tx:
        query = f"""
        insert
          $u isa user, has $e, has $p, has $username;
          $e isa email '{email}';
          $p isa phone '{phone}';
          $username isa username '{username}';
        """
        answers = list(tx.query(query).resolve().as_concept_rows())
        tx.commit()
        for i, row in enumerate(answers, start=1):
            phone = row.get("p").try_get_string()
            email = row.get("e").try_get_string()
            print(f"Added new user. Phone: {phone}, E-mail: {email}")
        return answers    

def get_direct_relatives_by_email(driver, db_name, email):
    with driver.transaction(db_name, TransactionType.READ) as tx:
        users = list(tx.query(f"match $u isa user, has email '{email}';").resolve().as_concept_rows())
        users_len = len(users)
        if users_len == 1:
            answers = list(tx.query(f"""
              match
                $e == '{email}';
                $u isa user, has email $e;
                $family isa family ($u, $relative);
                $relative has username $username;
                not {{ $u is $relative; }};
              select $username;
              sort $username asc;
            """).resolve().as_concept_rows())
            for row in answers:
                print(f"Relative: {row.get('username').try_get_string()}")
            if len(answers) == 0:
                print("No relatives found.")
            return answers
        else:
            print(f"Error: Found {users_len} users, expected 1.")
            return None

def get_all_relatives_by_email(driver, db_name, email):
    with driver.transaction(db_name, TransactionType.READ) as tx:
        users = list(tx.query(f"match $u isa user, has email '{email}';").resolve().as_concept_rows())
        users_len = len(users)
        if users_len == 1:
            answers = list(tx.query(f"""
              match
                $u isa user, has email $e;
                $e == '{email}';
                let $relative in all_relatives($u);
                not {{ $u is $relative; }};
                $relative has username $username;
                select $username;
                sort $username asc;
            """).resolve().as_concept_rows())
            for row in answers:
                print(f"Relative: {row.get('username').try_get_string()}")
            if len(answers) == 0:
                print("No relatives found.")
            return answers
        else:
            print(f"Error: Found {users_len} users, expected 1.")
            return None


def update_phone_by_email(driver, db_name, email, old, new):
    with driver.transaction(db_name, TransactionType.WRITE) as tx:
        answers = list(tx.query(f"""
          match $u isa user, has email '{email}', has phone $phone; $phone == '{old}';
          update $u has phone '{new}';
        """).resolve().as_concept_rows())
        tx.commit()
        answers_len = len(answers)
        if answers_len == 0:
            print("Error: No phones updated")
            return None
        else:
            print(f"Total number of phones updated: {len(answers)}")
            return answers


def delete_user_by_email(driver, db_name, email):
    with driver.transaction(db_name, TransactionType.WRITE) as tx:
        answers = list(tx.query(f"match $u isa user, has email '{email}'; delete $u;").resolve().as_concept_rows())
        tx.commit()
        answers_len = len(answers)
        if answers_len == 0:
            print("Error: No users deleted")
            return None
        else:
            print(f"Total number of users deleted: {len(answers)}")
            return answers

# Example usage
if __name__ == "__main__":
    main()



# class Edition(Enum):
#     Cloud = 1
#     Core = 2

# class TypeDBConnection:
#     def __init__(self):
#         # Load configuration from environment variables
#         self.db_name = os.getenv("TYPEDB_DB_NAME", "projojo_db")
#         self.server_addr = os.getenv("TYPEDB_SERVER_ADDR", "127.0.0.1:1729")
        
#         # Determine TypeDB edition (Core by default)
#         edition_str = os.getenv("TYPEDB_EDITION", "Core")
#         self.typedb_edition = Edition.Cloud if edition_str.lower() == "cloud" else Edition.Core
        
#         # Authentication credentials
#         self.username = os.getenv("TYPEDB_USERNAME", "admin")
#         self.password = os.getenv("TYPEDB_PASSWORD", "password")
        
#         # Driver instance
#         self.driver = None

#     def connect(self):
#         """Establish connection to TypeDB server"""
#         try:
#             if self.typedb_edition is Edition.Core:
#                 self.driver = TypeDB.core_driver(
#                     self.server_addr, 
#                     Credentials(self.username, self.password), 
#                     DriverOptions(False, None)
#                 )
#                 print(f"Connected to TypeDB Core at {self.server_addr}")
#             else:
#                 self.driver = TypeDB.cloud_driver(
#                     [self.server_addr], 
#                     Credentials(self.username, self.password), 
#                     DriverOptions(False, None)
#                 )
#                 print(f"Connected to TypeDB Cloud at {self.server_addr}")
            
#             return self.driver
#         except Exception as e:
#             print(f"Error connecting to TypeDB: {e}")
#             raise

#     def close(self):
#         """Close the TypeDB connection"""
#         if self.driver:
#             self.driver.close()
#             print("TypeDB connection closed")

#     def create_database_if_not_exists(self):
#         """Create database if it doesn't exist"""
#         if not self.driver:
#             raise Exception("Not connected to TypeDB. Call connect() first.")
        
#         if not self.driver.databases.contains(self.db_name):
#             print(f"Creating database '{self.db_name}'...")
#             self.driver.databases.create(self.db_name)
#             print(f"Database '{self.db_name}' created successfully")
#         else:
#             print(f"Database '{self.db_name}' already exists")

#     def get_transaction(self, transaction_type=TransactionType.READ):
#         """Get a transaction for the database"""
#         if not self.driver:
#             raise Exception("Not connected to TypeDB. Call connect() first.")
        
#         return self.driver.transaction(self.db_name, transaction_type)

#     def execute_query(self, query, transaction_type=TransactionType.READ, commit=False):
#         """Execute a query and return the results"""
#         if not self.driver:
#             raise Exception("Not connected to TypeDB. Call connect() first.")
        
#         with self.driver.transaction(self.db_name, transaction_type) as tx:
#             result = list(tx.query(query).resolve().as_concept_rows())
#             if commit:
#                 tx.commit()
#             return result

# # Singleton instance
# typedb_connection = TypeDBConnection()

# def get_connection():
#     """Get the TypeDB connection singleton"""
#     return typedb_connection

# def load_schema(connection):
#     """Load schema definition into the database"""
#     schema_path = os.path.join(os.path.dirname(__file__), "schema.tql")
    
#     try:
#         with open(schema_path, "r") as file:
#             schema_definition = file.read()
        
#         print("Loading schema definition...")
#         connection.execute_query(schema_definition, TransactionType.SCHEMA, commit=True)
#         print("Schema loaded successfully")
#     except Exception as e:
#         print(f"Error loading schema: {e}")
#         raise

# def init_database():
#     """Initialize the database connection and schema"""
#     connection = get_connection()
#     driver = connection.connect()
#     connection.create_database_if_not_exists()
    
#     # Load schema if needed
#     try:
#         # Check if schema is already loaded by trying to find a user entity
#         connection.execute_query("match $x sub user; limit 1;")
#         print("Schema already loaded")
#     except Exception:
#         # If error occurs, schema needs to be loaded
#         load_schema(connection)
    
#     return connection

# # Example usage
# if __name__ == "__main__":
#     # Initialize database connection
#     connection = init_database()
    
#     try:
#         # Example query
#         result = connection.execute_query("match $x isa user; limit 10;")
#         print(f"Query returned {len(result)} results")
#     finally:
#         # Close connection
#         connection.close()
