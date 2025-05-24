# from pydantic import BaseModel
# from typing import Annotated
# from datetime import datetime
# from tql_decorators import abstract, entity, relation, Key, Card, Plays, Relates, TypeQLAnnotation

# # --- Entities ---

# @abstract
# @entity
# class Abstract_entity(BaseModel):
#     base_variable: str

#     # entity abstract_entity @abstract,
#     #   owns name @card(1);

# @entity
# class Abstract_inheritance(Abstract_entity):
#     extra_variable: str

#     # entity f_inheritance sub abstract_entity,
#     #   owns name @card(1);
#     #   owns extra @card(1);

# # @abstract
# # @entity
# # class User(BaseModel):
# #     email: str

# # @entity
# # class Supervisor(User):
# #     name: str

# @entity
# class Cardinality(BaseModel):
#     single_default: str
#     single_explicit: Annotated[str, Card("1")]
#     single_optional_default: str | None
#     single_optional_explicit: Annotated[str | None, Card("0..1")]

#     multiple_default: list[str] # TODO: not working: `owns multiple_default @card(1),`
#     multiple_explicit: Annotated[list[str], Card("0..")]
#     multiple_minimum: Annotated[list[str], Card("1..")]
#     multiple_maximum_fifty: Annotated[list[str], Card("0..50")]

#     # entity cardinality,
#     #   owns single_default @card(1),
#     #   owns single_explicit @card(1),
#     #   owns single_optional_default @card(1),
#     #   owns single_optional_explicit @card(0..1),
#     #   owns multiple_default @card(0..),
#     #   owns multiple_explicit @card(0..),
#     #   owns multiple_minimum @card(1..);
#     #   owns multiple_maximum_fifty @card(0..50);

# @entity(name_or_class="overridden_entity")
# class Original_name(BaseModel):
#     name: str

#     # entity original_name,
#     #   owns name @card(1);

# @entity
# class Types(BaseModel):
#     type_string: str
#     type_integer: int
#     type_float: float
#     type_boolean: bool
#     type_datetime: datetime

#     # entity Types,
#     #   owns type_string @card(1),
#     #   owns type_integer @card(1),
#     #   owns type_float @card(1),
#     #   owns type_boolean @card(1),
#     #   owns type_datetime @card(1);



# # --- Relations ---

# @relation(name_or_class="overridden_relation")
# class Original_relation(BaseModel):
#     ...

# #     # relation original_relation;
