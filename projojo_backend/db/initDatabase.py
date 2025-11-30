from typing import Any
from typedb.driver import TypeDB, TransactionType, Credentials, DriverOptions
import os
import re
import pprint
from datetime import datetime, date
import time
from dotenv import load_dotenv
from uuid import UUID

# Load environment variables from .env file
load_dotenv()

class Db:
    address = os.getenv("TYPEDB_SERVER_ADDR", "127.0.0.1:1729")
    name = os.getenv("TYPEDB_NAME", "projojo_db")
    username = os.getenv("TYPEDB_USERNAME", "admin")
    password = os.getenv("TYPEDB_PASSWORD", "password")
    reset = True if str.lower(os.getenv("RESET_DB", "no")) == "yes" else False
    base_path = os.path.dirname(os.path.abspath(__file__))
    schema_path = os.path.join(base_path, "schema.tql")
    seed_path = os.path.join(base_path, "seed.tql")

    # Initialize as None - will be connected lazily with retry logic
    driver = None
    db = None
    _connection_established = False

    @classmethod
    def connect_with_retry(cls, max_retries=10, initial_delay=1):
        """Connect to TypeDB with retry logic and exponential backoff"""
        if cls._connection_established and cls.driver is not None:
            return  # Already connected

        delay = initial_delay
        for attempt in range(max_retries):
            try:
                print(f"Attempting to connect to TypeDB at {cls.address} (attempt {attempt + 1}/{max_retries})...")
                cls.driver = TypeDB.driver(cls.address, Credentials(cls.username, cls.password), DriverOptions(False, None))
                cls.db = cls.driver.databases.get(cls.name) if cls.driver.databases.contains(cls.name) else None
                cls._connection_established = True
                print("Successfully connected to TypeDB!")
                return
            except Exception as e:
                print(f"Connection failed: {e}")
                if attempt < max_retries - 1:
                    print(f"Retrying in {delay} seconds...")
                    time.sleep(delay)
                    delay = min(delay * 1.5, 30)  # Exponential backoff with max 30 seconds
                else:
                    print(f"Failed to connect to TypeDB after {max_retries} attempts")
                    raise Exception(f"Failed to connect to TypeDB after {max_retries} attempts. Last error: {e}")

    @classmethod
    def ensure_connection(cls):
        """Ensure we have a valid connection, reconnect if necessary"""
        if not cls._connection_established or cls.driver is None:
            cls.connect_with_retry()

    @staticmethod
    def schema_transact(query: str):
        """
        Execute a schema transaction.

        Note: Schema queries do not support parameterization as they typically
        contain static schema definitions loaded from .tql files.

        Args:
            query: TypeQL schema query string
        """
        Db.ensure_connection()
        with Db.driver.transaction(Db.name, TransactionType.SCHEMA) as tx:
            tx.query(query).resolve()
            tx.commit()

    @staticmethod
    def read_transact(query: str, params: dict[str, Any] = None, sort_fields: bool = True):
        """
        Execute a read transaction.

        Args:
            query: TypeQL query string or template with ~param placeholders
            params: Optional dictionary of parameters to safely interpolate.
                    None values will raise ValueError (use negation patterns instead).
            sort_fields: Whether to sort result dictionary keys

        Returns:
            List of query results

        Raises:
            ValueError: If any parameter value is None
        """
        Db.ensure_connection()
        if params:
            query = build_query(query, params, allow_none=False)
        with Db.driver.transaction(Db.name, TransactionType.READ) as tx:
            results = list(tx.query(query).resolve())

            # Sort dictionaries by key for consistent output order if requested
            if sort_fields:
                results = [dict(sorted(item.items())) for item in results]

            return results

    @staticmethod
    def write_transact(query: str, params: dict[str, Any] = None):
        """
        Execute a write transaction.

        Args:
            query: TypeQL query string or template with ~param placeholders
            params: Optional dictionary of parameters to safely interpolate.
                    None values will remove the containing clause (for optional attributes).
        """
        Db.ensure_connection()
        if params:
            query = build_query(query, params, allow_none=True)
        with Db.driver.transaction(Db.name, TransactionType.WRITE) as tx:
            tx.query(query).resolve()
            tx.commit()

    @staticmethod
    def close():
        if Db.driver is not None:
            Db.driver.close()
        Db.driver = None
        Db.db = None
        Db._connection_established = False

    @staticmethod
    def reopen():
        Db.close()
        Db.connect_with_retry()
        create_database_if_needed()

def sanitize_string(value: str) -> str:
    """
    Sanitize a string value for safe interpolation into TypeQL queries.

    Escapes:
    - Backslashes (\ -> \\) - MUST be first to avoid double-escaping
    - Double quotes (" -> \")

    Args:
        value: The string to sanitize

    Returns:
        Sanitized string safe for TypeQL interpolation
    """
    return value.replace('\\', '\\\\').replace('"', '\\"')


def format_value(value: Any) -> str:
    """
    Format a Python value for TypeQL query interpolation.

    Automatically detects the type and applies appropriate formatting:
    - str: Quoted and escaped
    - UUID: Converted to quoted string
    - int/float: Raw number
    - bool: Lowercase true/false
    - datetime/date: ISO format (unquoted for TypeQL datetime literals)
    - list: TypeQL list format

    Args:
        value: The Python value to format

    Returns:
        TypeQL-formatted string representation

    Note:
        None values should be filtered out before calling this function.
        This function raises ValueError if it receives None.
    """
    if value is None:
        raise ValueError(
            "format_value received None - this is a bug. "
            "None values should be filtered before formatting."
        )

    if isinstance(value, bool):  # Must check before int (bool is subclass of int)
        return 'true' if value else 'false'

    if isinstance(value, UUID):
        return f'"{str(value)}"'

    if isinstance(value, int):
        return str(value)

    if isinstance(value, float):
        return str(value)

    if isinstance(value, datetime):
        return value.strftime('%Y-%m-%dT%H:%M:%S')

    if isinstance(value, date):
        return value.strftime('%Y-%m-%d')

    if isinstance(value, (list, tuple)):
        formatted_items = [format_value(item) for item in value]
        return f"[{', '.join(formatted_items)}]"

    # Default: treat as string
    return f'"{sanitize_string(str(value))}"'


def _remove_none_clauses(template: str, none_params: list[str]) -> str:
    """
    Remove lines/clauses containing None placeholders from the template.

    Handles TypeQL syntax by:
    1. Removing the entire line containing ~param_name
    2. Cleaning up dangling commas
    3. Preserving valid TypeQL structure

    Args:
        template: Query template
        none_params: List of parameter names with None values

    Returns:
        Template with None clauses removed
    """
    result = template

    for param in none_params:
        # Remove entire line containing the placeholder
        # This regex matches a line (with leading whitespace) containing ~param_name
        # and handles both comma-terminated and semicolon-terminated lines
        pattern = rf'^\s*.*~{re.escape(param)}(?![a-zA-Z0-9_]).*$\n?'
        result = re.sub(pattern, '', result, flags=re.MULTILINE)

    # Clean up dangling commas before semicolons or closing braces
    # e.g., "has name "x",\n    ;" -> "has name "x";"
    result = re.sub(r',\s*;', ';', result)
    result = re.sub(r',\s*\)', ')', result)
    result = re.sub(r',\s*}', '}', result)

    return result


def build_query(template: str, params: dict[str, Any], allow_none: bool = False) -> str:
    """
    Build a TypeQL query from a template and parameters.

    Replaces ~param_name placeholders with properly formatted and sanitized values.

    Args:
        template: Query template with ~param_name placeholders
        params: Dictionary of parameter names to values
        allow_none: If True, None values remove the containing clause (for writes).
                    If False, None values raise ValueError (for reads).

    Returns:
        Complete TypeQL query string with interpolated values

    Raises:
        KeyError: If a placeholder in the template has no matching parameter
        ValueError: If None is passed and allow_none is False
    """
    # Handle None values based on allow_none flag
    none_params = [k for k, v in params.items() if v is None]

    if none_params and not allow_none:
        raise ValueError(
            f"Cannot use None in read queries. Parameters with None: {none_params}. "
            "TypeQL has no null literal. Use negation patterns to match absent attributes: "
            "not {{ $x has attr $v; }};"
        )

    # For write queries, None values remove the clause
    regular_params = {k: v for k, v in params.items() if v is not None}

    # First, remove clauses for None params (only when allow_none=True)
    result = _remove_none_clauses(template, none_params) if none_params else template

    # Then substitute regular params
    for key, value in regular_params.items():
        formatted_value = format_value(value)
        # Use word boundary to avoid partial replacements (e.g., ~id vs ~id_name)
        result = re.sub(rf'~{re.escape(key)}(?![a-zA-Z0-9_])', formatted_value, result)

    # Check for any remaining unsubstituted placeholders
    remaining = re.findall(r'~([a-zA-Z_][a-zA-Z0-9_]*)', result)
    if remaining:
        raise KeyError(f"Missing parameters: {remaining}")

    return result


print(f"Using database: {Db.name}")

def get_database():
    Db.ensure_connection()
    create_database_if_needed()
    return Db

def create_database_if_needed():
    Db.ensure_connection()
    if Db.reset and Db.db is not None:
        Db.db.delete()
        Db.db = None
    if Db.db is None:
        print(f"Creating a new database: {Db.name}")
        if Db.driver is not None:  # Additional safety check
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
            with Db.driver.transaction(Db.name, TransactionType.WRITE) as tx:
                tx.query(seed_query).resolve()
                tx.commit()
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
