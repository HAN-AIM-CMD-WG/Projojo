# from __future__ import annotations # For forward references in type hints
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
    location: Annotated[list[str], Card("1..")]
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
    # plays creates:project @card(0..1) - Interpreted as a project is created via one 'Creates' relation instance.
    # The TQL schema for 'creates' relation has 'relates project @card(0..)' for a supervisor.
    # This implies a supervisor's "act of creation" (a single 'Creates' instance) can link to multiple projects.
    # For Pydantic representation on the Project side, it means a Project is involved in one such 'Creates' event.
    creation_relation: Annotated[Creates | None, Plays(Creates, role_name="project"), Card("0..1")] = None

@entity
class Task(BaseModel):
    name: Annotated[str, Card("1")]
    description: Annotated[str, Card("1")]
    totalNeeded: Annotated[int, Card("1")]
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
    # relates project @card(0..)
    # This Pydantic model represents one instance of the 'creates' relation.
    # If a single 'creates' event links one supervisor to multiple projects,
    # that logic is on the 'supervisor' role in TQL. Here, one 'creates' links to one project.
    project: Annotated[Project | None, Relates(Project)] # Default card(1)
    createdAt: Annotated[datetime, Card("1")] # Schema shows @index for this attribute on the relation.
    # If @index is a custom TypeQL feature, it could be:
    # createdAt: Annotated[datetime, Card("1"), TypeQLRawAnnotation("@index")]

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
    # relates project @card(1..) in TQL.
    # This Pydantic model represents one link (one project per HasProjects instance).
    # The 'Business' entity would have a list of these if it 'plays' in multiple 'HasProjects' relations.
    project: Annotated[Project | None, Relates(Project), Card("1")]

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
