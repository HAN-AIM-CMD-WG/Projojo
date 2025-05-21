from __future__ import annotations # For forward references in type hints
from pydantic import BaseModel
from typing import Annotated
from datetime import datetime

# Assuming tql_decorators.py is in the parent directory or accessible via PYTHONPATH
# For direct execution of schema_generator.py from its own directory,
# this import should work due to sys.path modifications in schema_generator.
from tql_decorators import entity, relation, abstract, Key, Card, Plays, Relates, Ignore, TypeQLRawAnnotation

# Forward declarations for type hints where classes are defined later or circularly
# Pydantic usually handles string forward refs, but explicit ones can be clearer.
# However, for this generator, direct class references are preferred in Plays/Relates if possible.
# Let's define them as needed or rely on Pydantic's string resolution.

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
    imagePath: Annotated[str, Card("1")] # Explicitly @card(1) as per schema, though it's default for str
    fullName: Annotated[str, Card("1")]
    password_hash: Annotated[str, Card("1")] # In schema, implies it's always there

@entity
class Supervisor(User):
    # Inherits attributes from User
    # plays authenticates:authenticated @card(1..10) -> This implies a list of Authenticates relations
    authentications: Annotated[list[Authenticates] | None, Plays(Authenticates, role_name="authenticated"), Card("1..10")] = None
    # plays manages:supervisor @card(1)
    management_relations: Annotated[Manages | None, Plays(Manages, role_name="supervisor"), Card("1")] = None # Assuming one Manages relation instance
    # plays creates:supervisor @card(0..)
    created_projects_relations: Annotated[list[Creates] | None, Plays(Creates, role_name="supervisor"), Card("0..")] = None

@entity
class Student(User):
    # Inherits attributes from User
    schoolAccountName: Annotated[str, Card("1")]
    # plays hasSkill:student @card(0..)
    skills_relations: Annotated[list[HasSkill] | None, Plays(HasSkill, role_name="student"), Card("0..")] = None
    # plays registersForTask:student @card(0..)
    task_registrations: Annotated[list[RegistersForTask] | None, Plays(RegistersForTask, role_name="student"), Card("0..")] = None

@entity
class Teacher(User):
    # Inherits attributes from User
    schoolAccountName: Annotated[str, Card("1")]

@entity
class IdentityProvider(BaseModel):
    name: Annotated[str | None, Card("0..1")] # Optional attribute
    # plays authenticates:authenticator
    authentication_provider_relations: Annotated[list[Authenticates] | None, Plays(Authenticates, role_name="authenticator")] = None # Default card(0..*) for list

@entity
class Business(BaseModel):
    name: Annotated[str, Key()]
    description: Annotated[str, Card("1")]
    imagePath: Annotated[str, Card("1")]
    location: Annotated[list[str], Card("1..")] # At least one location
    # plays manages:business @card(1..)
    managed_by_relations: Annotated[list[Manages] | None, Plays(Manages, role_name="business"), Card("1..")] = None
    # plays hasProjects:business @card(0..1)
    projects_relation: Annotated[HasProjects | None, Plays(HasProjects, role_name="business"), Card("0..1")] = None

@entity
class Project(BaseModel):
    name: Annotated[str, Card("1")]
    description: Annotated[str, Card("1")]
    imagePath: Annotated[str, Card("1")]
    createdAt: Annotated[datetime, Card("1")]
    # plays hasProjects:project @card(1)
    part_of_business_relation: Annotated[HasProjects | None, Plays(HasProjects, role_name="project"), Card("1")] = None
    # plays containsTask:project @card(0..)
    tasks_relations: Annotated[list[ContainsTask] | None, Plays(ContainsTask, role_name="project"), Card("0..")] = None
    # plays creates:project @card(0..) -> This seems to imply a project can be part of multiple "creates" relations if a supervisor creates multiple.
    # However, the 'creates' relation in schema has 'relates project @card(0..)' for a supervisor.
    # This means a 'creates' relation instance links one supervisor to potentially many projects.
    # So, a Project would be linked via one 'creates' relation instance.
    creation_relation: Annotated[Creates | None, Plays(Creates, role_name="project"), Card("0..1")] = None # Assuming a project is created once.

@entity
class Task(BaseModel):
    name: Annotated[str, Card("1")]
    description: Annotated[str, Card("1")]
    totalNeeded: Annotated[int, Card("1")] # Mapped to long (int)
    createdAt: Annotated[datetime, Card("1")]
    # plays containsTask:task @card(1)
    part_of_project_relation: Annotated[ContainsTask | None, Plays(ContainsTask, role_name="task"), Card("1")] = None
    # plays requiresSkill:task @card(0..)
    required_skills_relations: Annotated[list[RequiresSkill] | None, Plays(RequiresSkill, role_name="task"), Card("0..")] = None
    # plays registersForTask:task @card(0..)
    student_registrations_relations: Annotated[list[RegistersForTask] | None, Plays(RegistersForTask, role_name="task"), Card("0..")] = None

@entity
class Skill(BaseModel):
    name: Annotated[str, Key()]
    isPending: Annotated[bool, Card("1")]
    createdAt: Annotated[datetime, Card("1")]
    # plays requiresSkill:skill @card(0..)
    task_requirements_relations: Annotated[list[RequiresSkill] | None, Plays(RequiresSkill, role_name="skill"), Card("0..")] = None
    # plays hasSkill:skill @card(0..)
    student_has_skill_relations: Annotated[list[HasSkill] | None, Plays(HasSkill, role_name="skill"), Card("0..")] = None


# --- Relations ---

@relation
class Authenticates(BaseModel):
    # relates authenticator
    authenticator: Annotated[IdentityProvider | None, Relates(IdentityProvider)] # Default card(1)
    # relates authenticated
    authenticated: Annotated[Supervisor | None, Relates(Supervisor)] # Default card(1) - Supervisor is specified in schema for this role
    username: Annotated[str, Card("1")]
    id: Annotated[str, Key()] # Relation key

@relation
class Creates(BaseModel):
    # relates supervisor @card(1)
    supervisor: Annotated[Supervisor | None, Relates(Supervisor), Card("1")]
    # relates project @card(0..) -> This means one 'Creates' instance can link to multiple projects.
    # This is unusual for a direct Pydantic field. Typically, a relation instance links one set of role-players.
    # If a supervisor creates multiple projects, it would be multiple instances of 'Creates' relation,
    # each linking to one project, or the 'project' role here should be singular.
    # Assuming the TQL means a supervisor's "act of creation" can be one event that spawns multiple projects.
    # For Pydantic, this might be better modeled as `project: Annotated[Project | None, Relates(Project)]` if one relation instance = one project created.
    # Or, if a single 'Creates' event links to many projects, the Pydantic model might not directly hold a list of projects.
    # Let's assume one 'Creates' instance for one project for simplicity in Pydantic.
    project: Annotated[Project | None, Relates(Project)] # Default card(1)
    createdAt: Annotated[datetime, Card("1")] # Schema shows @index, using TypeQLRawAnnotation if needed, or just Card(1)
    # createdAt: Annotated[datetime, TypeQLRawAnnotation("@index"), Card("1")] # If @index is critical

@relation
class Manages(BaseModel):
    # relates supervisor @card(1)
    supervisor: Annotated[Supervisor | None, Relates(Supervisor), Card("1")]
    # relates business @card(1)
    business: Annotated[Business | None, Relates(Business), Card("1")]
    location: Annotated[list[str], Card("1..")] # Attribute of the relation

@relation
class HasProjects(BaseModel):
    # relates business @card(1)
    business: Annotated[Business | None, Relates(Business), Card("1")]
    # relates project @card(1..)
    project: Annotated[Project | None, Relates(Project), Card("1")] # A single HasProjects links one business to one project. List is on Business.

@relation
class ContainsTask(BaseModel):
    # relates project @card(1)
    project: Annotated[Project | None, Relates(Project), Card("1")]
    # relates task @card(1)
    task: Annotated[Task | None, Relates(Task), Card("1")]

@relation
class RequiresSkill(BaseModel):
    # relates task @card(1)
    task: Annotated[Task | None, Relates(Task), Card("1")]
    # relates skill @card(1)
    skill: Annotated[Skill | None, Relates(Skill), Card("1")]

@relation
class HasSkill(BaseModel):
    # relates student @card(1)
    student: Annotated[Student | None, Relates(Student), Card("1")]
    # relates skill @card(1)
    skill: Annotated[Skill | None, Relates(Skill), Card("1")]
    description: Annotated[str, Card("1")]

@relation
class RegistersForTask(BaseModel):
    # relates student @card(1)
    student: Annotated[Student | None, Relates(Student), Card("1")]
    # relates task @card(1)
    task: Annotated[Task | None, Relates(Task), Card("1")]
    description: Annotated[str, Card("1")]
    isAccepted: Annotated[bool | None, Card("0..1")] # Optional boolean
    response: Annotated[str | None, Card("0..1")] # Optional string
    createdAt: Annotated[datetime, Card("1")]
