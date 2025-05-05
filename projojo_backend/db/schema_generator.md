# TypeDB Schema Generator

## Syntax

<!-- TODO: extract syntax from example and document individually -->

## Example

### Decorators
```python
def entity(name: str = None):
    # TODO: find out what this means. 'cls'? '_typeql_entity'?   maybe metadata properties?
    def decorator(cls):
        # TODO: i think this `cls` is the class which is decorated with this decorator.
        # TODO: in that case, `cls._typeql_entity` is setting the `_typeql_entity` attribute of the class to the name provided in the decorator or the lowercase version of the class name.
        cls._typeql_entity = name or cls.__name__.lower()
        return cls
    return decorator


def relation(name: str = None):
    def decorator(cls):
        cls._typeql_relation = name or cls.__name__.lower()
        return cls
    return decorator


def abstract(cls):
    cls._typeql_abstract = True
    return cls
```

### Annotations
```python
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


# TODO: check if the {relation}:{role} is implemented correctly
# class Plays(TypeQLAnnotation):
#     def __init__(self, relation: str):
#         super().__init__(f"plays {relation}")


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
```python
from pydantic import BaseModel
from typing import Optional, List, Annotated
import datetime

# Test to see what the syntax should look like for the schema generator
# This is not the actual code, just a test to see what the syntax should look like, how the generator should behave, and what edge cases should be handled
# For this reason, the code, classes and attributes might differ from the actual current schema (partly depicted below)

@abstract # Mark User as an abstract entity in typeDB
@entity # name of entity in typeDB (empty means use class name with lowercase first letter, eg. `user`)
class User(BaseModel):
    email: Annotated[str, Key()] # @key
    temp_id: Annotated[str, Ignore()] # `ignore` means this attribute will not be included in the schema generation, eg. for temporary IDs used only in the backend, not in the database
    age: str # `str` is singular, so automatically add `@card(1)` to schema
    pets: Annotated[List[str], Card("1..")] # `List` is plural, so automatically add `@card(0..)` (0 or more) to schema, unless specified otherwise (in this case, `@card(1..)` means 1 or more pets required)
    password_hash: Optional[str] = None # `Optional` only means that this attribute is present in the schema but not required to fetch every time (eg. its a security risk to always fetch password_hash). It still has the default `@card(1)`.

@entity("student") # name of entity in typeDB
class Student(User):
    # --- fields ---
    school_account_name: str
    postal_code: Annotated[str, TypeQLAnnotation('@regex("regular expression")')] # annotations for typeDB that have not been implemented yet, can be added via a string with the exact annotation as it would be in typeDB

    # --- relations (plays) ---
    # A relation is always an Optional with default `None`, as it is not required to be fetched every time
    # `Plays` means this attribute is a relation to another entity, which can be manually provided, or can be derived from its type, in this case a `HasSkill` (relation) list (cardinality (which is also added manually for demonstration purposes)).
    # With an optional `Card` to specify the cardinality of the relation (default can be derived from the type, in this case `card(0..)`, which is the same as default, because of type `List`)
    hasSkill: Annotated[Optional[List[HasSkill]], Plays(HasSkill), Card("0..")] = None

@entity("skill") # name of entity in typeDB
class Skill(BaseModel):
    name: Annotated[str, Key()]
    is_pending: bool
    created_at: datetime

    has_skill: Annotated[Optional[List[HasSkill]], Plays()] = None

@relation("hasSkill") # name of relation in typeDB
class HasSkill(BaseModel):
    # relation attributes are optional, as they will probably not be fetched every time
    student: Annotated[Optional[Student], Relates(Student), Card("1")] # `relates` means this attribute is a relation to another entity, in this case, `Student` (can be left empty which defaults to type within Optional). Optional `Card` (which can be derived from the type) to specify the cardinality of the relation (default is `card(1)`)
    skill: Annotated[Optional[Skill], Relates(Skill)] # `relates` means this attribute is a relation to another entity, in this case, `Skill`
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
from typing import Optional, List, Annotated
import datetime

@abstract
@entity
class User(BaseModel):
    email: Annotated[str, Key()]
    temp_id: Annotated[str, Ignore()]
    age: str
    pets: Annotated[List[str], Card("1..")]
    password_hash: Optional[str] = None

@entity("student")
class Student(User):
    school_account_name: str
    postal_code: Annotated[str, TypeQLAnnotation('@regex("regular expression")')]

    hasSkill: Annotated[Optional[List[HasSkill]], Plays(HasSkill), Card("0..")] = None

@entity("skill")
class Skill(BaseModel):
    name: Annotated[str, Key()]
    is_pending: bool
    created_at: datetime

    has_skill: Annotated[Optional[List[HasSkill]], Plays()] = None

@relation("hasSkill")
class HasSkill(BaseModel):
    student: Annotated[Optional[Student], Relates(Student), Card("1")]
    skill: Annotated[Optional[Skill], Relates(Skill)]
    description: str
```