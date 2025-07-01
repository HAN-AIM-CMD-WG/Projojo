from typedb.driver import TypeDB, TransactionType, Credentials, DriverOptions
import os
import pprint
from environs import Env
from typing import Any

# Load environment variables from .env file with variable expansion
env = Env(expand_vars=True)
env.read_env()

class Db:
    address = env.str("TYPEDB_SERVER_ADDR")
    name = env.str("TYPEDB_DB_NAME")
    username = env.str("TYPEDB_USERNAME")
    default_password = env.str("TYPEDB_DEFAULT_PASSWORD")
    new_password = env.str("TYPEDB_NEW_PASSWORD")
    reset = env.bool("RESET_DB", default=False)
    base_path = os.path.dirname(os.path.abspath(__file__))
    schema_path = os.path.join(base_path, "schema.tql")
    seed_path = os.path.join(base_path, "seed.tql")
    driver: Any | None = None
    db: Any | None = None
    
    @classmethod
    def initialize_connection(cls):
        """Initialize the TypeDB connection, updating password if needed"""
        if cls.driver is not None:
            return
            
        print(f"Connecting to TypeDB at {cls.address}")
        print(f"Target user: {cls.username}")
        
        # Try new credentials first
        try:
            print("Trying new credentials...")
            cls.driver = TypeDB.driver(cls.address, Credentials(cls.username, cls.new_password), DriverOptions(False, None))
            print("✓ Connected with new credentials - password is already correct")
            
        except Exception as new_cred_error:
            print(f"⚠ New credentials failed: {new_cred_error}")
            print("Trying default credentials...")
            
            try:
                cls.driver = TypeDB.driver(cls.address, Credentials(cls.username, cls.default_password), DriverOptions(False, None))
                print("✓ Connected with default credentials")
                
                # Update password if default and new are different
                if cls.default_password != cls.new_password:
                    print("Updating password...")
                    try:
                        current_user = cls.driver.users.get_current_user()
                        if current_user:
                            current_user.update_password(cls.new_password)
                            print("✓ Password updated successfully")
                            
                            # Reconnect with new password
                            cls.driver.close()
                            cls.driver = TypeDB.driver(cls.address, Credentials(cls.username, cls.new_password), DriverOptions(False, None))
                            print("✓ Reconnected with new credentials")
                        else:
                            print("⚠ Could not get current user for password update")
                    except Exception as password_error:
                        print(f"⚠ Password update failed: {password_error}")
                        print("⚠ Continuing with default credentials")
                else:
                    print("Default and new passwords are the same - no update needed")
                    
            except Exception as default_cred_error:
                print(f"✗ Could not connect with default credentials either: {default_cred_error}")
                raise Exception(f"Could not establish TypeDB connection with either default or new credentials for user '{cls.username}'")
        
        # Set up database reference
        cls.db = cls.driver.databases.get(cls.name) if cls.driver.databases.contains(cls.name) else None
    
    @staticmethod
    def schema_transact(query):
        Db.initialize_connection()
        assert Db.driver is not None, "Driver should be initialized"
        with Db.driver.transaction(Db.name, TransactionType.SCHEMA) as tx:
            tx.query(query).resolve()
            tx.commit()

    @staticmethod
    def read_transact(query, sort_fields=True):
        Db.initialize_connection()
        assert Db.driver is not None, "Driver should be initialized"
        with Db.driver.transaction(Db.name, TransactionType.READ) as tx:
            results = list(tx.query(query).resolve())

            # Sort dictionaries by key for consistent output order if requested
            if sort_fields:
                results = [dict(sorted(item.items())) for item in results]

            return results

    @staticmethod
    def write_transact(query):
        Db.initialize_connection()
        assert Db.driver is not None, "Driver should be initialized"
        with Db.driver.transaction(Db.name, TransactionType.WRITE) as tx:
            tx.query(query).resolve()
            tx.commit()

    @staticmethod
    def close():
        if Db.driver:
            Db.driver.close()
        

print( f"Using database: {Db.name}")

def get_database():
    create_database_if_needed()    
    return Db

def create_database_if_needed():
    Db.initialize_connection()
    assert Db.driver is not None, "Driver should be initialized"
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
            $m isa manages( $s, $b );
        fetch { 
            'name': $s.fullName, 
            'email': $s.email, 
            'provider': $ip.name,
            'business': $b.name,
            'location': [$b.location],
            'supervisorLocation': [$m.location],
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
            hasProjects( $b, $p );
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
            hasProjects( $b, $p );
            containsTask( $p, $t );
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
            requiresSkill( $t, $sk );
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
            $stsk isa hasSkill( $s, $sk );
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
            $tr isa registersForTask( $s, $t );
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
            $m isa manages($s, $b);
            hasProjects($b, $p);
            $c isa creates($s, $p);
        fetch { 
            'supervisorName': $s.fullName,
            'supervisorEmail': $s.email,
            'business': $b.name,
            'project': $p.name,
            'projectDescription': $p.description,
            'createdAt': $c.createdAt,
            'locations': [$m.location]
        };
    """
    projectcreations_query_results = Db.read_transact(projectcreations_query)
    pprint.pp(projectcreations_query_results)

    Db.close()

if __name__ == "__main__":
    main()
