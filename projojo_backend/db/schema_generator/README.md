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
from datetime import datetime

class MyEntity(BaseModel):
    name: str  # Becomes attribute 'name' with value type 'string'
    is_active: bool # Becomes attribute 'is_active' with value type 'boolean'
    created_at: datetime # Becomes attribute 'created_at' with value type 'datetime'
```
The generator will create TypeDB attribute definitions like:
```typeql
attribute name value string;
attribute is_active value boolean;
attribute created_at value datetime;
```

### Multiplicity
Cardinality for attributes and relations is determined as follows:

1.  **Default for singular attributes**: Attributes with a singular type (e.g., `str`, `int`, `bool`) default to a cardinality of one (`@card(1)`).
    ```python
    class User(BaseModel):
        age: str  # Implicitly @card(1)
    ```

2.  **Default for `list` attributes**: Attributes typed with `list[T]` (e.g., `list[str]`) default to a cardinality of zero or more (`@card(0..)`).
    ```python
    class User(BaseModel):
        tags: list[str] # Implicitly @card(0..)
    ```

3.  **Explicit `Card` annotation**: Cardinality can be explicitly set using the `Annotated` type hint with a `Card` annotation.
    ```python
    from typing import Annotated

    class User(BaseModel):
        pets: Annotated[list[str], Card("1..")]  # Explicitly 1 or more, @card(1..)
        email: Annotated[str, Card("1")] # Explicitly 1, @card(1) (same as default for singular)
    ```

4.  **Union with `None` (e.g., `str | None`)**: Using `T | None` (e.g., `str | None`) indicates that the attribute might not always be present in Python model instances or fetched from the database. However, for schema generation, it still implies the attribute *exists* in the schema and defaults to `@card(1)` unless overridden by an explicit `Card` annotation. The `| None` primarily serves as a hint for data handling rather than schema cardinality for presence.
    ```python
    class User(BaseModel):
        password_hash: str | None = None  # Still @card(1) in the schema by default
    ```
    This means `password_hash` is defined in the TypeDB schema as `owns password_hash @card(1);`.

## Entities

### Defining an entity
Entities are defined by Pydantic models decorated with `@entity`.

-   **Basic Definition**:
    ```python
    @entity
    class User(BaseModel):
        # ... attributes
    ```
    If no name is provided to `@entity`, the TypeDB entity name defaults to the lowercased class name (e.g., `user` for `class User`).

-   **Explicit Naming**:
    ```python
    @entity("student")
    class StudentData(BaseModel):
        # ... attributes
    ```
    This defines an entity named `student` in TypeDB, despite the class name being `StudentData`.

-   **Abstract Entities**:
    The `@abstract` decorator marks an entity as abstract in TypeDB.
    ```python
    @abstract
    @entity
    class User(BaseModel):
        # ... attributes
    ```
    This generates `entity user @abstract;`.

-   **Inheritance**:
    Python class inheritance is translated to TypeDB subtyping.
    ```python
    @entity()
    class Student(User): # Assuming User is another @entity decorated class
        # ... student-specific attributes
    ```
    This generates `entity student sub user;`.

### Annotations
Entity attributes can be annotated using `typing.Annotated` to provide TypeDB-specific details. These annotations control how attributes are defined and behave within the TypeDB schema.

-   **`@key`**: Marks an attribute as a key for the entity.
    ```python
    from typing import Annotated

    class User(BaseModel):
        email: Annotated[str, Key()] # 'email' is a key attribute
    ```
    This translates to `owns email @key;` within the entity definition in TypeDB.

-   **`Card(cardinality: str)`**: Explicitly sets the cardinality of an attribute.
    ```python
    from typing import Annotated

    class User(BaseModel):
        pets: Annotated[list[str], Card("1..")] # At least one pet is required
    ```
    This results in `owns pets @card(1..);`.

-   **`Ignore()`**: Marks a Pydantic field to be excluded from the TypeDB schema generation. This is useful for fields that are only relevant in the Python model (e.g., temporary IDs).
    ```python
    from typing import Annotated

    class User(BaseModel):
        temp_id: Annotated[str, Ignore()] # 'temp_id' will not appear in the TypeDB schema
    ```

-   **`TypeQLAnnotation(annotation_string: str)`**: Allows specifying any raw TypeQL annotation string. This is a flexible way to add annotations that don't have dedicated Python classes yet.
    ```python
    from typing import Annotated

    class Student(User):
        postal_code: Annotated[str, TypeQLAnnotation('@regex("^[0-9]{4}[A-Z]{2}$")')]
    ```
    This would generate `owns postal_code @regex("^[0-9]{4}[A-Z]{2}$");` (assuming default cardinality `@card(1)`).

All attributes defined on an entity model (unless `Ignore()`-d) are considered "owned" by that entity in TypeDB. For example:
```python
@entity
class User(BaseModel):
    email: Annotated[str, Key()]
    age: str
```
Generates:
```typeql
define
entity user,
  owns email @key,
  owns age @card(1); # @card(1) is default for singular types

attribute email value string;
attribute age value string;
```

## Relations

### Defining a relation
Relations are defined by Pydantic models decorated with `@relation`.

-   **Basic Definition**:
    ```python
    @relation
    class Employment(BaseModel):
        # ... attributes of the relation and roles
    ```
    If no name is provided to `@relation`, the TypeDB relation name defaults to the lowercased class name (e.g., `employment` for `class Employment`).

-   **Explicit Naming**:
    ```python
    @relation("hasSkill")
    class HasSkill(BaseModel):
        description: str # Attribute owned by the relation
        # ... roles linking to entities
    ```
    This defines a relation named `hasSkill` in TypeDB.

-   **Relation Attributes**:
    Attributes defined directly on the relation model (like `description: str` above) become attributes owned by the relation itself.
    ```typeql
    define
    relation hasSkill,
      owns description @card(1); # Assuming str defaults to @card(1)
    ```

### Linked entities
Entities are linked to relations through roles. This is defined using `Plays` annotations on entity fields and `Relates` annotations on relation fields.

1.  **`Relates(target_entity_type: type)` (used within a Relation Model)**:
    This annotation specifies a role in the relation that connects to a particular entity type. The attribute name in the relation model becomes the role name.
    <!-- TODO: maybe change the `Relates()` parameter to a string of the relation for more flexibility, and fallback to the name of the inferred entity type-->
    ```python
    from typing import Annotated

    # Forward declaration or import of entity types
    # class Student(BaseModel): ...
    # class Skill(BaseModel): ...

    @relation("hasSkill")
    class HasSkill(BaseModel):
        # Role 'student' relating to the Student entity
        student: Annotated[Student | None, Relates(Student), Card("1")]
        # Role 'skill' relating to the Skill entity (target inferred from type if Relates() is empty)
        skill: Annotated[Skill | None, Relates(Skill)]
        description: str
    ```
    -   **Forward Declarations**: When type hinting a class that hasn't been defined yet (e.g., `Student` inside `HasSkill` if `Student` is defined later in the file, or if there are circular dependencies between files), Python typically requires using a string literal for the type hint (e.g., `Annotated["Student | None", ...]`). Pydantic, however, often handles forward references automatically if the types are defined within the same module or can be resolved at runtime. If direct type hints cause `NameError`, string literals are the standard Python solution. The examples here assume Pydantic's resolution or that types are defined/imported before use.

    -   `student: Annotated[Student | None, Relates(Student), Card("1")]`: Defines a role named `student` within the `hasSkill` relation. This role must be played by one `Student` entity (`@card(1)`).
    -   `skill: Annotated[Skill | None, Relates(Skill)]`: Defines a role named `skill`. If `Relates()` is empty, the target entity type (`Skill`) is inferred from the Python type hint `Skill | None`. Cardinality defaults based on the type (e.g., `@card(1)` for `Skill | None`).

    This generates TypeQL like:
    ```typeql
    define
    relation hasSkill,
      relates student @card(1),  # Role 'student'
      relates skill @card(1),  # Role 'skill' (assuming default card(1) for Skill | None)
      owns description @card(1);
    ```

2.  **`Plays(relation_type: type, role_name: str | None = None)` (used within an Entity Model)**:
    This annotation on an entity's attribute indicates that the entity plays a role in a specified relation. The attribute itself usually holds instances of the relation model.
    ```python
    from typing import Annotated

    # class HasSkill(BaseModel): ... # The relation model

    @entity("student")
    class Student(User):
        # Student plays a role in the HasSkill relation
        # The role name is inferred as 'student' (lowercase entity name) by default
        hasSkill_relations: Annotated[list[HasSkill] | None, Plays(HasSkill), Card("0..")] = None

    @entity("skill")
    class Skill(BaseModel):
        # Skill plays a role in the HasSkill relation
        # Role name inferred as 'skill'
        participates_in_hasSkill: Annotated[list[HasSkill] | None, Plays(HasSkill)] = None # Card("0..") inferred from list
    ```
    -   `Plays(HasSkill)`: Indicates that the `Student` (or `Skill`) entity plays a role in the `HasSkill` relation.
    -   The actual role name played by the entity within the relation (e.g., `hasSkill:student` or `hasSkill:skill`) is typically inferred by the generator. The TypeDB schema example shows `plays hasSkill:student` and `plays hasSkill:skill`. This implies the role name specified in the `plays` statement is the name of the entity itself (lowercase).
    -   The type hint `list[HasSkill] | None` along with `Card("0..")` indicates that a student can be involved in zero or more `HasSkill` instances.
    -   If `Plays()` is used (e.g. `Plays()`), the relation type is inferred from the attribute's type hint (e.g. `HasSkill` from `list[HasSkill] | None`).

    This contributes to the entity definitions in TypeQL:
    ```typeql
    define
    entity student sub user,
      # ... other attributes
      plays hasSkill:student @card(0..); # Student plays the 'student' role in hasSkill

    entity skill,
      # ... other attributes
      plays hasSkill:skill @card(0..); # Skill plays the 'skill' role in hasSkill (assuming default card(0..) for List)
    ```
    The attribute name in the Python entity model (e.g., `hasSkill_relations`, `participates_in_hasSkill`) is for Python-side access and does not directly translate to a TypeQL name in the `plays` statement, other than guiding which relation is being referred to. The crucial parts are the `Plays` annotation specifying the relation class, and the implicit or explicit role.

## The generator
<!-- TODO: make the generator -->
<!-- how the generator works, what it does, how to use it -->

### Running the generator
<!-- parameters of the (to be) function to generate -->

### Adding features
<!-- how to add features to the generator, eg. `@key`, `@card`, `@plays`, `@relates`, but specifically annotations that are currently not supported -->

<!-- ## Decisions -->
<!-- decisions made on logic/syntax during the development of the schema generator -->

## Example

### Decorators
```python
# TODO: when using the function like `@entity` without parentheses, it will probably not work...
# TODO: otherwise, these functions have not been tested, but are just a guess of what the decorator should look like
def entity(name: str = None):
    def decorator(cls):
        set_typeql_meta(cls, "type", "entity")
        set_typeql_meta(cls, "name", name or cls.__name__.lower())
        return cls
    return decorator

def relation(name: str = None):
    def decorator(cls):
        set_typeql_meta(cls, "type", "relation")
        set_typeql_meta(cls, "name", name or cls.__name__.lower())
        return cls
    return decorator

def abstract(cls):
    def decorator(cls):
        set_typeql_meta(cls, "abstract", True)
        return cls
    return decorator

def set_typeql_meta(cls, key: str, value: str):
    if not hasattr(cls, "_typeql_meta"):
        cls._typeql_meta = {}
    cls._typeql_meta[key] = value
    return cls
```

### Annotations
```python
# TODO: same as above, these are just a guess of what the annotations should look like
class TypeQLAnnotation:
    def __init__(self, annotation: str):
        self.annotation = annotation

    def __str__(self):
        return self.annotation


class Key(TypeQLAnnotation):
    def __init__(self):
        super().__init__("@key")


class Card(TypeQLAnnotation):
    def __init__(self, cardinality: str):
        super().__init__(f"@card({cardinality})")


class Relates(TypeQLAnnotation):
    def __init__(self, target: str):
        super().__init__(f"relates {target}")


# TODO: check if the {relation}:{role} is implemented correctly (Where to get the role name from?)
# class Plays(TypeQLAnnotation):
#     def __init__(self, relation: str):
#         super().__init__(f"plays {relation}")
# example: `plays hasSkill:student`


class Ignore:
    """Special annotation to mark fields to be ignored by schema generation."""
    pass
# --- Possible implementation of Ignore annotation ---
from typing import get_type_hints, get_args, Annotated

hints = get_type_hints(Student, include_extras=True)
for attr, type_hint in hints.items():
    annotations = get_args(type_hint)[1:]  # first element is the type itself
    if any(isinstance(a, Ignore) for a in annotations):
        continue  # skip these during schema generation
```

### Pydantic Models
<!-- from this point on, the code is the original code used to figure out how the syntax would look/work and if it is intuitive. -->
```python
from pydantic import BaseModel
from typing import Annotated
from datetime import datetime

# Test to see what the syntax should look like for the schema generator
# This is not the actual code, just a test to see what the syntax should look like, how the generator should behave, and what edge cases should be handled
# For this reason, the code, classes and attributes might differ from the actual current schema (partly depicted below)

@abstract # Mark User as an abstract entity in typeDB
@entity # name of entity in typeDB (empty means use class name with lowercase first letter, eg. `user`)
class User(BaseModel):
    email: Annotated[str, Key()] # @key
    temp_id: Annotated[str, Ignore()] # `ignore` means this attribute will not be included in the schema generation, eg. for temporary IDs used only in the backend, not in the database
    age: str # `str` is singular, so automatically add `@card(1)` to schema
    pets: Annotated[list[str], Card("1..")] # `list` is plural, so automatically add `@card(0..)` (0 or more) to schema, unless specified otherwise (in this case, `@card(1..)` means 1 or more pets required)
    password_hash: str | None = None # `| None` only means that this attribute is present in the schema but not required to fetch every time (eg. its a security risk to always fetch password_hash). It still has the default `@card(1)`.

@entity("student") # name of entity in typeDB
class Student(User):
    # --- fields ---
    school_account_name: str
    postal_code: Annotated[str, TypeQLAnnotation('@regex("\d{4}[ ]?[A-Z]{2}")')] # annotations for typeDB that have not been implemented yet, can be added via a string with the exact annotation as it would be in typeDB

    # --- relations (plays) ---
    # A relation is always an `| None` with default `None`, as it is not required to be fetched every time
    # `Plays` means this attribute is a relation to another entity, which can be manually provided, or can be derived from its type, in this case a `HasSkill` (relation) list (cardinality (which is also added manually for demonstration purposes)).
    # With an optional `Card` to specify the cardinality of the relation (default can be derived from the type, in this case `card(0..)`, which is the same as default, because of type `list`)
    hasSkill: Annotated[list[HasSkill] | None, Plays(HasSkill), Card("0..")] = None

@entity("skill") # name of entity in typeDB
class Skill(BaseModel):
    name: Annotated[str, Key()]
    is_pending: bool
    created_at: datetime

    has_skill: Annotated[list[HasSkill] | None, Plays()] = None

@relation("hasSkill") # name of relation in typeDB
class HasSkill(BaseModel):
    # relation attributes are `| None`, as they will probably not be fetched every time
    student: Annotated[Student | None, Relates(Student), Card("1")] # `relates` means this attribute is a relation to another entity, in this case, `Student` (can be left empty which defaults to type within `| None`). Optional `Card` (which can be derived from the type) to specify the cardinality of the relation (default is `card(1)`)
    skill: Annotated[Skill | None, Relates(Skill)] # `relates` means this attribute is a relation to another entity, in this case, `Skill`
    description: str
```

### TypeDB Schema
```typeQL
# Current typeDB schema (not generated, manually created)
# Only the relevant parts are shown for brevity

entity user @abstract,
    owns email @key,
    # owns imagePath @card(1),
    # owns fullName @card(1),
    owns password_hash @card(1);

entity student sub user,
    owns schoolAccountName @card(1),
    plays hasSkill:student @card(0..),
    # plays registersForTask:student @card(0..);

relation hasSkill,
    relates student @card(1),
    relates skill @card(1),
    owns description @card(1);

entity skill,
    owns name @key,
    owns isPending @card(1),
    owns createdAt @card(1),
    # plays requiresSkill:skill @card(0..),
    plays hasSkill:skill @card(0..);

attribute email value string; # will be generated by looking at the type notations in pydantic models
```

### Models without comments
```python
from pydantic import BaseModel
from typing import Annotated
from datetime import datetime

@abstract
@entity
class User(BaseModel):
    email: Annotated[str, Key()]
    temp_id: Annotated[str, Ignore()]
    age: str
    pets: Annotated[list[str], Card("1..")]
    password_hash: str | None = None

@entity("student")
class Student(User):
    school_account_name: str
    postal_code: Annotated[str, TypeQLAnnotation('@regex("\d{4}[ ]?[A-Z]{2}")')]

    hasSkill: Annotated[list[HasSkill] | None, Plays(HasSkill), Card("0..")] = None

@entity("skill")
class Skill(BaseModel):
    name: Annotated[str, Key()]
    is_pending: bool
    created_at: datetime

    has_skill: Annotated[list[HasSkill] | None, Plays()] = None

@relation("hasSkill")
class HasSkill(BaseModel):
    student: Annotated[Student | None, Relates(Student), Card("1")]
    skill: Annotated[Skill | None, Relates(Skill)]
    description: str
```
