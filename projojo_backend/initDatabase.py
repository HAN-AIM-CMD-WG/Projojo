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
            $ba isa businessAssociation( $b, $s );
        fetch { 
            'name': $s.fullName, 
            'email': $s.email, 
            'provider': $ip.name,
            'business': $b.name,
            'location': [$b.location],
            'supervisorLocation': [$ba.location],
        };
    """
    result = Db.read_transact(read_query)
    # print(result)
    for user in result:
        print(user)

    # Example 2: Run a second query
    print()
    print("Running a sample query for skills")
    skill_query = """
        match 
            $sk isa skill;
        fetch { 
            'name': $sk.name,	
            'isPending': $sk.isPending,
            'createdAt': $sk.createdAt,
        };
    """
    skill_result = Db.read_transact(skill_query)
    # print(result)
    for skill in skill_result:
        print(skill)

    # Example 3: Run a third query
    print()
    print("Running a sample query for projects")
    project_query = """
        match 
            $b isa business;
            $p isa project;
            businessProjects( $b, $p );
        fetch { 
            'businessName': $b.name,
            'projectName': $p.name,	
        };
    """
    project_query = Db.read_transact(project_query)
    # print(result)
    for project in project_query:
        print(project)

    # Example 4: Run a fourth query
    print()
    print("Running a sample query for tasks")
    task_query = """
        match 
            $b isa business;
            $p isa project;
            $t isa task;
            businessProjects( $b, $p );
            projectTask( $p, $t );
        fetch { 
            'businessName': $b.name,
            'projectName': $p.name,	
            'taskName': $t.name,	
            'totalNeeded': $t.totalNeeded,
        };
    """
    task_query = Db.read_transact(task_query)
    # print(result)
    for task in task_query:
        print(task)

    # Example 5: Run a fifth query
    print()
    print("Running a sample query for task skills")
    task_query = """
        match 
            $t isa task;
            $sk isa skill;
            taskSkill( $t, $sk );
        fetch { 	
            'taskName': $t.name,	
            'skillName': $sk.name,
        };
    """
    task_query = Db.read_transact(task_query)
    # print(result)
    for task in task_query:
        print(task)    

    # Example 6: Run a sixth query
    print()
    print("Running a sample query for student skills")
    student_query = """
        match 
            $s isa student;
            $sk isa skill;
            $stsk isa studentSkill( $s, $sk );
        fetch { 	
            'studentName': $s.fullName,	
            'skillName': $sk.name,
            'description': $stsk.description,
        };
    """
    student_query = Db.read_transact(student_query)
    # print(result)
    for student in student_query:
        print(student)    

    Db.driver.close()



if __name__ == "__main__":
    main()
