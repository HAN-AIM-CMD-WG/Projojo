from pydantic import BaseModel
from typing import Annotated
from datetime import datetime

# Import the decorators and annotations from tql_generator
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from tql_generator import (
    entity, relation, abstract,
    Key, Card, Plays, Relates, Ignore, TypeQLRawAnnotation
)

# Abstract base entity - tests @abstract decorator
@abstract
@entity
class User(BaseModel):
    email: Annotated[str, Key()]  # Tests @key annotation
    imagePath: str  # Tests default cardinality (@card(1))
    fullName: str
    password_hash: str | None = None  # Tests Union with None
    temp_id: Annotated[str, Ignore()]  # Tests Ignore annotation

# Entity inheritance - tests sub entity
@entity
class Student(User):
    schoolAccountName: str
    # Tests Plays annotation with default role name and cardinality
    hasSkill_relations: Annotated[list["HasSkill"] | None, Plays("HasSkill")] = None
    # Tests Plays annotation with explicit cardinality
    registersForTask_relations: Annotated[list["RegistersForTask"] | None, Plays("RegistersForTask"), Card("0..")] = None

# Another entity inheritance example
@entity
class Supervisor(User):
    # Tests Plays annotation with explicit role name
    manages_relations: Annotated[list["Manages"] | None, Plays("Manages", role_name="supervisor")] = None
    # Tests Plays annotation with ForwardRef
    creates_relations: Annotated[list["Creates"] | None, Plays("Creates")] = None

# Regular entity - tests entity with key
@entity
class Skill(BaseModel):
    name: Annotated[str, Key()]  # Tests @key annotation
    isPending: bool  # Tests boolean type
    createdAt: datetime  # Tests datetime type
    # Tests Plays annotation
    hasSkill_relations: Annotated[list["HasSkill"] | None, Plays("HasSkill")] = None

# Entity with multiple attributes
@entity
class Business(BaseModel):
    name: Annotated[str, Key()]
    description: str
    imagePath: str
    # Tests Card annotation for multiple values
    location: Annotated[list[str], Card("1..")]
    # Tests Plays annotation
    manages_relations: Annotated[list["Manages"] | None, Plays("Manages")] = None

# Entity with various attribute types
@entity
class Task(BaseModel):
    name: str
    description: str
    # Tests integer type
    totalNeeded: int
    createdAt: datetime
    # Tests Plays annotation
    registersForTask_relations: Annotated[list["RegistersForTask"] | None, Plays("RegistersForTask")] = None

# Relation - tests @relation decorator
@relation("hasSkill")
class HasSkill(BaseModel):
    # Tests Relates annotation with explicit entity type
    student: Annotated[Student, Relates(Student), Card("1")]
    # Tests Relates annotation with inferred entity type
    skill: Annotated[Skill, Relates()]
    description: str

# Relation with attributes - tests relation attributes
@relation
class RegistersForTask(BaseModel):
    student: Annotated[Student, Relates(Student)]
    task: Annotated[Task, Relates(Task)]
    description: str
    # Tests optional attribute with Card annotation
    isAccepted: Annotated[bool | None, Card("0..1")] = None
    response: str | None = None
    createdAt: datetime

# Relation with explicit role names
@relation
class Manages(BaseModel):
    supervisor: Annotated[Supervisor, Relates(Supervisor)]
    business: Annotated[Business, Relates(Business)]
    # Tests list attribute with Card annotation
    location: Annotated[list[str], Card("1..")]

# Relation with TypeQLRawAnnotation
@relation("creates")
class Creates(BaseModel):
    supervisor: Annotated[Supervisor, Relates(Supervisor)]
    project: Annotated["Project", Relates("Project")]  # Tests string literal for forward reference
    # Tests TypeQLRawAnnotation
    createdAt: Annotated[datetime, TypeQLRawAnnotation("@index")]

# Entity referenced by string literal above
@entity
class Project(BaseModel):
    name: str
    description: str
    imagePath: str
    createdAt: datetime
    # Tests Plays annotation with ForwardRef
    creates_relations: Annotated[list[Creates] | None, Plays(Creates)] = None
