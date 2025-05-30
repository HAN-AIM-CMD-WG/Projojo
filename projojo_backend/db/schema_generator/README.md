# TypeDB Schema Generator

## Datatypes

### Inferred
Python type hints on Pydantic model attributes are used to infer TypeDB attribute types. The common mappings are:
- `str` -> `string`
- `int` -> `long`
- `float` -> `double`
- `bool` -> `boolean`
- `datetime` (`from datetime import datetime`) -> `datetime`

For example:
```python
from pydantic import BaseModel
from datetime import datetime
from tql_decorators import entity

@entity
class MyEntity(BaseModel):
    name: str # -> string
    is_active: bool # -> boolean
    count: int # -> long
    value: float # -> double
    created_at: datetime # -> datetime
```
The generator will create TypeDB attribute definitions like:
```typeql
# ... Entity definition

attribute name value string;
attribute is_active value boolean;
attribute count value long;
attribute value value double;
attribute created_at value datetime;
```

### Multiplicity
Cardinality for attributes and relations is determined as follows:

1.  **Default for singular attributes**: Attributes with a singular type (e.g., `str`, `int`, `bool`) default to a cardinality of one (`@card(1)`).
    ```python
    from pydantic import BaseModel
    from tql_decorators import entity

    @entity
    class User(BaseModel):
        age: str  # Implicitly @card(1)
    ```

2.  **Default for `list` attributes**: Attributes typed with `list[T]` (e.g., `list[str]`) default to a cardinality of zero or more (`@card(0..)`).
    ```python
    from pydantic import BaseModel
    from tql_decorators import entity

    @entity
    class User(BaseModel):
        tags: list[str] # Implicitly @card(0..)
    ```

3.  **Explicit `Card` annotation**: Cardinality can be explicitly set using the `Annotated` type hint with a `Card` annotation.
    ```python
    from pydantic import BaseModel
    from typing import Annotated
    from tql_decorators import Card, entity

    @entity
    class User(BaseModel):
        pets: Annotated[list[str], Card("1..")] # Explicitly 1 or more, @card(1..)
        email: Annotated[str, Card("1")] # Explicitly 1, @card(1) (same as default for singular)
    ```

4.  **Union with `None` (e.g., `str | None`)**: Using `T | None` (e.g., `str | None`) indicates that the attribute might not always be present. For schema generation, it still implies the attribute *exists* in the schema and defaults to `@card(1)` for singular types (or `@card(0..)` if it's `list[T] | None`) unless overridden by an explicit `Card` annotation.
    ```python
    from pydantic import BaseModel
    from typing import Annotated
    from tql_decorators import entity

    @entity
    class User(BaseModel):
        password_hash: str | None = None # Still @card(1) in the schema by default
        optional_tags: list[str] | None = None # Still @card(0..) in the schema by default
    ```
    This means `password_hash` is defined in the TypeDB schema as `owns password_hash @card(1);` and `optional_tags` as `owns optional_tags @card(0..);`.

## Entities

### Defining an entity
Entities are defined by Pydantic models decorated with `@entity`.

-   **Basic Definition**:
    ```python
    from pydantic import BaseModel
    from tql_decorators import entity

    @entity
    class User(BaseModel):
        # ... attributes
        pass
    ```
    If no name is provided to `@entity` (i.e., `@entity` or `@entity()`), the TypeDB entity name defaults to the lowercased class name (e.g., `user` for `class User`).

-   **Explicit Naming**:
    ```python
    from pydantic import BaseModel
    from tql_decorators import entity

    @entity("student_profile")
    class StudentData(BaseModel):
        # ... attributes
        pass
    ```
    This defines an entity named `student_profile` in TypeDB, despite the class being named `StudentData`.

-   **Abstract Entities**:
    The `@abstract` decorator marks an entity as abstract in TypeDB.
    ```python
    from pydantic import BaseModel
    from tql_decorators import entity, abstract

    @abstract
    @entity
    class User(BaseModel):
        # ... attributes
        pass
    ```
    This generates `entity user @abstract;`.

-   **Inheritance**:
    Python class inheritance is translated to TypeDB subtyping.
    ```python
    from pydantic import BaseModel
    from tql_decorators import entity

    @entity
    class Person(BaseModel):
        name: str

    @entity
    class Student(Person): # Student inherits from Person
        student_id: str
    ```
    This generates:
    ```typeql
    define

    entity person,
        owns name;

    entity student sub person,
        owns student_id;

    attribute name value string;
    attribute student_id value string;
    ```

### Annotations
Entity attributes can be annotated using `typing.Annotated` to provide TypeDB-specific details.

-   **`Key()`**: Marks an attribute as a key for the entity.
    ```python
    from pydantic import BaseModel
    from typing import Annotated
    from tql_decorators import entity, Key

    @entity
    class User(BaseModel):
        email: Annotated[str, Key()] # 'email' is a key attribute
    ```
    This translates to `owns email @key;` within the entity definition in TypeDB.

-   **`Card(cardinality: str)`**: Explicitly sets the cardinality of an attribute.
    ```python
    from pydantic import BaseModel
    from typing import Annotated
    from tql_decorators import entity, Card

    @entity
    class Post(BaseModel):
        tags: Annotated[list[str], Card("1..5")] # Between 1 and 5 tags
    ```
    This results in `owns tags @card(1..5);`.

-   **`Ignore()`**: Marks a Pydantic field to be excluded from the TypeDB schema generation. This is useful for fields that are only relevant in the Python model (e.g. temporary values only used in backend).
    ```python
    from pydantic import BaseModel
    from typing import Annotated
    from tql_decorators import entity, Ignore

    @entity
    class User(BaseModel):
        internal_id: int
        temp_notes: Annotated[str, Ignore()] # 'temp_notes' will not appear in the TypeDB schema
    ```

-   **`TypeQLRawAnnotation(annotation_string: str)`**: Allows specifying any raw TypeQL annotation string. This is a flexible way to add annotations that don't have dedicated Python classes yet.
    ```python
    from pydantic import BaseModel
    from typing import Annotated
    from tql_decorators import entity, TypeQLRawAnnotation

    @entity
    class Product(BaseModel):
        # Assuming default cardinality @card(1) for postal_code
        postal_code: Annotated[str, TypeQLRawAnnotation('@regex("^[0-9]{4}[A-Z]{2}$")')]
    ```
    This would generate `owns postal_code @card(1) @regex("^[0-9]{4}[A-Z]{2}$");`.

All attributes defined on an entity model (unless `Ignore()`-d) are considered "owned" by that entity in TypeDB.

## Relations

### Defining a relation
Relations are defined by Pydantic models decorated with `@relation`.

-   **Basic Definition**:
    ```python
    from pydantic import BaseModel
    from tql_decorators import relation

    @relation
    class Employment(BaseModel):
        # ... attributes of the relation itself, and roles
        start_date: datetime
    ```
    If no name is provided to `@relation` (i.e., `@relation` or `@relation()`), the TypeDB relation name defaults to the lowercased class name (e.g., `employment` for `class Employment`).

-   **Explicit Naming**:
    ```python
    from pydantic import BaseModel
    from tql_decorators import relation

    @relation("works_for")
    class EmploymentLink(BaseModel):
        # ... attributes and roles
        pass
    ```
    This defines a relation named `works_for` in TypeDB.

-   **Relation Attributes**:
    Attributes defined directly on the relation model (like `start_date: datetime` above) become attributes owned by the relation itself.
    ```typeql
    # Part of the 'employment' relation definition
    define

    relation employment,
      owns start_date @card(1);

    attribute start_date value datetime;
    ```

### Linked entities
Entities are linked to relations through roles. This is defined using `Plays` annotations on entity fields and `Relates` annotations on relation fields.

<!-- TODO: implement the string forward declaration (using `"className"` instead of `className`) -->

1.  **`Relates(target_entity_type: type | str | None = None)` (used within a Relation Model)**:
    This annotation specifies a role in the relation that connects to a particular entity type. The attribute name in the relation model becomes the default role name, unless overridden by `role_override`.
    ```python
    from pydantic import BaseModel
    from typing import Annotated
    from tql_decorators import relation, Relates, entity

    # Forward declare or import entity types
    class Person(BaseModel): pass
    class Company(BaseModel): pass

    @relation
    class Employment(BaseModel):
        employee: Annotated[Person, Relates(Person)] # Role 'employee' relates to Person
        employer: Annotated[Company, Relates(Company)] # Role 'employer' relates to Company
        start_date: datetime
    ```
    This generates TypeQL like:
    ```typeql
    relation employment,
        relates employee as employee,  # 'employee' is the role name
        relates employer as employer,  # 'employer' is the role name
        owns start_date;
    ```

2.  **`Plays(relation_type: type | str | None = None, role_name: str | None = None)` (used within an Entity Model)**:
    <!-- TODO: instead of repeating the entity in the `Plays` parameter, use inferred type from the field type -->
    This annotation on an entity's attribute indicates that the entity plays a role in a specified relation. The attribute itself usually holds instances of the relation model (or a list of them).
    The `role_name` in `Plays` should match a role defined in the target relation (via `Relates`). If `role_name` is `None`, the generator attempts to infer it based on the name of the class.
    ```python
    from pydantic import BaseModel
    from typing import Annotated
    from tql_decorators import entity, relation, Plays, Relates

    # Forward declare or import relation types
    class User(BaseModel): pass
    class Company(BaseModel): pass
    class Employment(BaseModel): pass

    # --- Entities (simplified) ---
    @entity
    class Employee(BaseModel):
        name: str
        # Employee plays the 'employee' role in the Employment relation
        employments: Annotated[list[Employment], Plays(Employment)] = []

    @entity
    class Company(BaseModel):
        name: str
        # Company plays the 'employer' role in the Employment relation
        employees_relations: Annotated[list[Employment], Plays(Employment, role_name="employer")] = []

    # --- Relation ---
    @relation
    class Employment(BaseModel):
        employee: Annotated[Employee, Relates(Employee)]        # Role is 'employee'
        employer: Annotated[Company, Relates(Company)]  # Role is 'employer'
        role_title: str

    ```
    This setup allows the generator to create `plays` statements in TypeDB:
    ```typeql
    define

    entity employee,
      owns name,
      plays employment:employee; # Employee plays 'employee' in 'employment' relation

    entity company,
      owns name,
      plays employment:employer; # Company plays 'employer' in 'employment' relation

    relation employment,
      owns role_title,
      relates employee as employee,
      relates employer as employer;

    attribute name value string;
    attribute role_title value string;
    ```

## The generator

The TypeDB Schema Generator is a Python tool designed to automate the creation of TypeQL schemas from Pydantic models. It works by:
1.  **Discovering Models**: It scans a specified Python file or package directory for Pydantic models decorated with `@entity` or `@relation`.
2.  **Parsing Metadata**: It extracts metadata from these models and their fields, including type hints and custom annotations (`Key`, `Card`, `Plays`, `Relates`, `Ignore`, `TypeQLRawAnnotation`).
3.  **Mapping Types**: Python types are mapped to corresponding TypeDB value types (e.g., `str` to `string`, `int` to `long`).
4.  **Determining Cardinality**: Cardinality for attributes and roles is inferred or taken from explicit `Card` annotations.
5.  **Generating TypeQL**: Based on the collected information, it constructs a TypeQL `define` schema string, including entity definitions, relation definitions, attribute ownership, role playing, and subtyping.

### Running the generator
The main way to use the generator is by calling the `generate_typeql_schema` function:

```python
from projojo_backend.db.schema_generator import generate_typeql_schema # Adjust import path as needed

# Path to your Python file or package directory containing Pydantic models
models_path = "path/to/your/models_directory_or_file.py"

try:
    typeql_schema_string = generate_typeql_schema(models_path)
    print(typeql_schema_string)

    # Optionally, save to a file
    with open("generated_schema.tql", "w") as f:
        f.write(typeql_schema_string)
    print("Schema generated successfully to generated_schema.tql")

except Exception as e:
    print(f"An error occurred during schema generation: {e}")

```

**Parameters for `generate_typeql_schema`**:
-   `module_or_package_path: str`: The file system path to a Python file (`.py`) or a package directory that contains your Pydantic model definitions. This path can be relative to the executing python file, or an absolute path.

The generator will dynamically import and inspect the models from this path.

### Adding features
To add support for new TypeDB features or custom annotations:

1.  **Define a new Annotation Class (in `tql_decorators.py`)**:
    Create a new class for your annotation, similar to `Key`, `Card`, etc. This class will primarily serve as a marker.
    ```python
    # In tql_decorators.py
    class MyNewAnnotation:
        def __init__(self, some_value: str):
            self.some_value = some_value
    ```

2.  **Update the Generator Logic (in `schema_generator.py`)**:
    *   Modify `TypeQLSchemaGenerator._process_entities()` or `TypeQLSchemaGenerator._process_relations()` to look for your new annotation within the `field_annotations`.
    *   Extract the necessary information from your annotation instance.
    *   Adjust the TypeQL string formatting to include the new feature. For example, if it's a new attribute annotation, you'd modify how `attr_annotations_str` is built in `_process_entities`.

    ```python
    # Example snippet in TypeQLSchemaGenerator._process_entities()
    # ...
    # for field_name, field_model in model_class.model_fields.items():
    #   ...
    #   field_annotations = get_args(field_model.annotation) if get_origin(field_model.annotation) is Annotated else []
    #   my_new_feature_str = ""
    #   for ann in field_annotations:
    #       if isinstance(ann, MyNewAnnotation):
    #           my_new_feature_str = f" @my_new_typedb_feature("{ann.some_value}")" # Format as needed
    #           break
    #   # Add my_new_feature_str to the TypeQL output for the attribute
    # ...
    ```

3.  **Update Type Mappings (if necessary)**:
    If your feature involves new data types, update `_get_typeql_value_type()`.

## Example

Here's a simplified example based on the `dummy_classes.py` and `generatedSchema.tql` files found in the `example` directory. This demonstrates entities, attributes, keys, relations, and inheritance.

**Pydantic Models (from `example/dummy_classes.py`):**
```python
from pydantic import BaseModel
from typing import Annotated
from datetime import datetime

from tql_decorators import entity, relation, abstract, Key, Card, Plays, Relates

# --- Forward declarations ---
class User(BaseModel): pass
class Student(User): pass
class Business(BaseModel): pass
class Manages(BaseModel): pass

# --- Entities ---
@abstract
@entity
class User(BaseModel):
    email: Annotated[str, Key()]
    imagePath: str
    fullName: str
    password_hash: str

@entity
class Student(User): # Inherits from User
    schoolAccountName: str
    skills_relations: Annotated[list[HasSkill] | None, Plays(HasSkill)] = None
    task_registrations: Annotated[list[RegistersForTask] | None, Plays(RegistersForTask)] = None

@entity
class Business(BaseModel):
    name: Annotated[str, Key()]
    description: str
    imagePath: str
    location: Annotated[list[str], Card("1..")]
    managed_by_relations: Annotated[list[Manages] | None, Plays(Manages), Card("1..")] = None
    projects_relation: Annotated[list[HasProjects] | None, Plays(HasProjects)] = None

# --- Relation ---
@relation
class Manages(BaseModel):
    supervisor: Annotated[Supervisor | None, Relates(Supervisor)]
    business: Annotated[Business | None, Relates(Business)]
    location: Annotated[list[str], Card("1..")]
```

**Generated TypeQL Schema (from `example/generatedSchema.tql`):**
```typeql
define

entity user @abstract,
    owns email @key,
    owns imagePath @card(1),
    owns fullName @card(1),
    owns password_hash @card(1);

entity student sub user,
    owns schoolAccountName @card(1),
    plays hasSkill:student @card(0..),
    plays registersForTask:student @card(0..);

entity business,
    owns name @key,
    owns description @card(1),
    owns imagePath @card(1),
    owns location @card(1..),
    plays manages:business @card(1..),
    plays hasProjects:business @card(0..);

relation manages,
    relates supervisor @card(1),
    relates business @card(1),
    owns location @card(1..);

attribute email value string;
attribute fullName value string;
attribute imagePath value string;
attribute location value string;
attribute name value string;
attribute password_hash value string;
attribute schoolAccountName value string;
```
This example showcases:
- Abstract entity `User` with key `email`.
- `Student` entity inheriting from `User` and playing roles in relations.
- `Business` entity with a key and multiple attributes, including a multi-cardinality `location`.
- `Manages` relation connecting `Supervisor` (another User subtype, not shown in Pydantic snippet for brevity) and `Business`, and owning its own `location` attribute.
- How Python type hints and decorators like `@entity`, `@relation`, `@abstract`, `@Key`, `Plays`, `Relates`, and `Card` are translated into their TypeQL counterparts.
