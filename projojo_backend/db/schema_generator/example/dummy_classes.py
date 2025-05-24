from pydantic import BaseModel
from typing import Annotated
from datetime import datetime

from tql_decorators import entity, relation, abstract, Key, Card, Plays, Relates

# --- Forward declarations ---
# These help type hints refer to classes defined later in the file.
# Pydantic's model_rebuild() or update_forward_refs() resolves these.
class User(BaseModel): pass
class Supervisor(User): pass
class Student(User): pass
class Teacher(User): pass
class IdentityProvider(BaseModel): pass
class Business(BaseModel): pass
class Project(BaseModel): pass
class Task(BaseModel): pass
class Skill(BaseModel): pass

class Authenticates(BaseModel): pass
class Creates(BaseModel): pass
class Manages(BaseModel): pass
class HasProjects(BaseModel): pass
class ContainsTask(BaseModel): pass
class RequiresSkill(BaseModel): pass
class HasSkill(BaseModel): pass
class RegistersForTask(BaseModel): pass


# --- Entities ---

@abstract
@entity
class User(BaseModel):
    email: Annotated[str, Key()]
    imagePath: str
    fullName: str
    password_hash: str

@entity
class Supervisor(User):
    # Inherits attributes from User
    # plays authenticates:authenticated @card(1..10) -> This implies a list of Authenticates relations
    authentications: Annotated[list[Authenticates] | None, Plays(Authenticates, role_name="authenticated"), Card("1..10")] = None
    # plays manages:supervisor @card(1)
    management_relations: Annotated[Manages | None, Plays(Manages)] = None
    # plays creates:supervisor @card(0..)
    created_projects_relations: Annotated[list[Creates] | None, Plays(Creates)] = None

@entity
class Student(User):
    # Inherits attributes from User
    schoolAccountName: str
    # plays hasSkill:student @card(0..)
    skills_relations: Annotated[list[HasSkill] | None, Plays(HasSkill)] = None
    # plays registersForTask:student @card(0..)
    task_registrations: Annotated[list[RegistersForTask] | None, Plays(RegistersForTask)] = None

@entity
class Teacher(User):
    # Inherits attributes from User
    schoolAccountName: str

@entity
class IdentityProvider(BaseModel):
    name: Annotated[str | None, Card("0..1")]
    # plays authenticates:authenticator @card(0..)
    authentication_provider_relations: Annotated[list[Authenticates] | None, Plays(Authenticates, role_name="authenticator")] = None

@entity
class Business(BaseModel):
    name: Annotated[str, Key()]
    description: str
    imagePath: str
    location: Annotated[list[str], Card("1..")]
    # plays manages:business @card(1..)
    managed_by_relations: Annotated[list[Manages] | None, Plays(Manages), Card("1..")] = None
    # plays hasProjects:business @card(0..)
    projects_relation: Annotated[HasProjects | None, Plays(HasProjects)] = None

@entity
class Project(BaseModel):
    name: str
    description: str
    imagePath: str
    createdAt: datetime
    # plays hasProjects:project @card(1)
    part_of_business_relation: Annotated[HasProjects | None, Plays(HasProjects)] = None
    # plays containsTask:project @card(0..)
    tasks_relations: Annotated[list[ContainsTask] | None, Plays(ContainsTask)] = None
    # plays creates:project @card(0..)
    creation_relation: Annotated[Creates | None, Plays(Creates)] = None

@entity
class Task(BaseModel):
    name: str
    description: str
    totalNeeded: int
    createdAt: datetime
    # plays containsTask:task @card(1)
    part_of_project_relation: Annotated[ContainsTask | None, Plays(ContainsTask)] = None
    # plays requiresSkill:task @card(0..)
    required_skills_relations: Annotated[list[RequiresSkill] | None, Plays(RequiresSkill)] = None
    # plays registersForTask:task @card(0..)
    student_registrations_relations: Annotated[list[RegistersForTask] | None, Plays(RegistersForTask)] = None

@entity
class Skill(BaseModel):
    name: Annotated[str, Key()]
    isPending: bool
    createdAt: datetime
    # plays requiresSkill:skill @card(0..)
    task_requirements_relations: Annotated[list[RequiresSkill] | None, Plays(RequiresSkill)] = None
    # plays hasSkill:skill @card(0..)
    student_has_skill_relations: Annotated[list[HasSkill] | None, Plays(HasSkill)] = None


# --- Relations ---

@relation
class Authenticates(BaseModel):
    # relates authenticator @card(1)
    authenticator: Annotated[IdentityProvider | None, Relates(IdentityProvider)]
    # relates authenticated @card(1)
    authenticated: Annotated[Supervisor | None, Relates(Supervisor)]
    username: str
    id: Annotated[str, Key()]

@relation
class Creates(BaseModel):
    # relates supervisor @card(1)
    supervisor: Annotated[Supervisor | None, Relates(Supervisor)]
    # relates project @card(0..)
    project: Annotated[Project | None, Relates(Project)]
    createdAt: datetime

@relation
class Manages(BaseModel):
    # relates supervisor @card(1)
    supervisor: Annotated[Supervisor | None, Relates(Supervisor)]
    # relates business @card(1)
    business: Annotated[Business | None, Relates(Business)]
    location: Annotated[list[str], Card("1..")]

@relation
class HasProjects(BaseModel):
    # relates business @card(1)
    business: Annotated[Business | None, Relates(Business)]
    # relates project @card(1..)
    project: Annotated[Project | None, Relates(Project)]

@relation
class ContainsTask(BaseModel):
    # relates project @card(1)
    project: Annotated[Project | None, Relates(Project)]
    # relates task @card(1)
    task: Annotated[Task | None, Relates(Task)]

@relation
class RequiresSkill(BaseModel):
    # relates task @card(1)
    task: Annotated[Task | None, Relates(Task)]
    # relates skill @card(1)
    skill: Annotated[Skill | None, Relates(Skill)]

@relation
class HasSkill(BaseModel):
    # relates student @card(1)
    student: Annotated[Student | None, Relates(Student)]
    # relates skill @card(1)
    skill: Annotated[Skill | None, Relates(Skill)]
    description: str

@relation
class RegistersForTask(BaseModel):
    # relates student @card(1)
    student: Annotated[Student | None, Relates(Student)]
    # relates task @card(1)
    task: Annotated[Task | None, Relates(Task)]
    description: str
    isAccepted: Annotated[bool | None, Card("0..1")]
    response: Annotated[str | None, Card("0..1")]
    createdAt: datetime
