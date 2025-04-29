from typedb.driver import TypeDB, TransactionType, Credentials, DriverOptions
import os
import pprint
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
    def read_transact(query, sort_fields=True):
        with Db.driver.transaction(Db.name, TransactionType.READ) as tx:
            results = list(tx.query(query).resolve())

            # Sort dictionaries by key for consistent output order if requested
            if sort_fields:
                results = [dict(sorted(item.items())) for item in results]

            return results

    @staticmethod
    def write_transact(query):
        with Db.driver.transaction(Db.name, TransactionType.WRITE) as tx:
            tx.query(query).resolve()
            tx.commit()

    @staticmethod
    def close():
        Db.driver.close()
        

print( f"Using database: {Db.name}")

def get_database():
    create_database_if_needed()    
    return Db

def create_database_if_needed():
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
    Db.reset = False     # prevent re-creating the database again 


def main():
    create_database_if_needed()

    # Example: Run a query
    print()
    print("Running a sample query")
    read_query = """
        match 
            $s isa supervisor; 
            $ip isa identityProvider;
            $b isa business;
            authenticates( $s, $ip );
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
    pprint.pp(result)

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
    pprint.pp(skill_result)

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
    project_results = Db.read_transact(project_query)
    pprint.pp(project_results)

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
    task_results = Db.read_transact(task_query)
    pprint.pp(task_results)
    
    # Example 5: Run a fifth query
    print()
    print("Running a sample query for task skills")
    task_skill_query = """
        match 
            $t isa task;
            $sk isa skill;
            taskSkill( $t, $sk );
        fetch { 	
            'taskName': $t.name,	
            'skillName': $sk.name,
        };
    """
    task_skill_results = Db.read_transact(task_skill_query)
    pprint.pp(task_skill_results)

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
    student_results = Db.read_transact(student_query)
    pprint.pp(student_results)

    # Example 7: Run a seventh query
    print()
    print("Running a sample query for task registrations")
    registration_query = """
        match 
            $s isa student;
            $t isa task;
            $tr isa taskRegistration( $s, $t );
        fetch { 	
            'studentName': $s.fullName,	
            'taskName': $t.name,
            'description': $tr.description,
            'isAccepted': $tr.isAccepted,
            'response': $tr.response,
        };
    """
    registration_results = Db.read_transact(registration_query)
    pprint.pp(registration_results)

    print()
    print("Running a sample query for project creations")
    projectcreations_query = """
        match 
            $s isa supervisor;
            $b isa business;
            $p isa project;
            $ba isa businessAssociation($s, $b);
            businessProjects($b, $p);
            $pc isa creates($s, $p);
        fetch { 
            'supervisorName': $s.fullName,
            'supervisorEmail': $s.email,
            'business': $b.name,
            'project': $p.name,
            'projectDescription': $p.description,
            'createdAt': $pc.createdAt,
            'locations': [$ba.location]
        };
    """
    projectcreations_query_results = Db.read_transact(projectcreations_query)
    pprint.pp(projectcreations_query_results)

    Db.close()

if __name__ == "__main__":
    main()
