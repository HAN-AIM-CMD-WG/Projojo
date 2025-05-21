# this is the file for imports like:
# - annotations like @entity, @relation, @abstract
# - things like @card("1..0"), @key
# the functions/classes from this file will be imported by developers for defining the models

from typing import TypeVar, Type, Callable, Any # Imported Any

# Global registry for TypeQL metadata
_MODEL_METADATA_REGISTRY: dict[Type, dict[str, Any]] = {}

# Helper function to store metadata on classes
def set_typeql_meta(cls: Type, key: str, value: Any):
    if cls not in _MODEL_METADATA_REGISTRY:
        _MODEL_METADATA_REGISTRY[cls] = {}
    _MODEL_METADATA_REGISTRY[cls][key] = value
    # No need to return cls, as we are modifying a global registry

def get_typeql_meta(cls: Type, key: str, default: Any = None) -> Any:
    return _MODEL_METADATA_REGISTRY.get(cls, {}).get(key, default)

def has_typeql_meta(cls: Type) -> bool:
    return cls in _MODEL_METADATA_REGISTRY

# Decorators
T = TypeVar('T')

def entity(name_or_class: str | Type[T] | None = None) -> Callable[[Type[T]], Type[T]] | Type[T]:
    """
    Decorator to mark a Pydantic model as a TypeDB entity.
    Can be used as @entity or @entity("custom_name").
    """
    def decorator(cls: Type[T]) -> Type[T]:
        set_typeql_meta(cls, "type", "entity")
        class_name = cls.__name__
        default_name = class_name[0].lower() + class_name[1:] if class_name else ""
        actual_name = name_or_class if isinstance(name_or_class, str) else default_name
        set_typeql_meta(cls, "name", actual_name)
        return cls

    if callable(name_or_class) and not isinstance(name_or_class, str): # Used as @entity
        cls = name_or_class
        name_or_class = None
        return decorator(cls)
    return decorator # Used as @entity("custom_name") or @entity()

def relation(name_or_class: str | Type[T] | None = None) -> Callable[[Type[T]], Type[T]] | Type[T]:
    """
    Decorator to mark a Pydantic model as a TypeDB relation.
    Can be used as @relation or @relation("custom_name").
    """
    def decorator(cls: Type[T]) -> Type[T]:
        set_typeql_meta(cls, "type", "relation")
        class_name = cls.__name__
        default_name = class_name[0].lower() + class_name[1:] if class_name else ""
        actual_name = name_or_class if isinstance(name_or_class, str) else default_name
        set_typeql_meta(cls, "name", actual_name)
        return cls

    if callable(name_or_class) and not isinstance(name_or_class, str): # Used as @relation
        cls = name_or_class
        name_or_class = None
        return decorator(cls)
    return decorator # Used as @relation("custom_name") or @relation()


def abstract(cls: Type[T]) -> Type[T]:
    """
    Decorator to mark a TypeDB entity as abstract.
    Example:
        @abstract
        @entity
        class User(BaseModel): ...
    """
    set_typeql_meta(cls, "abstract", True)
    return cls


# Annotations
class TypeQLAnnotation:
    """Base class for TypeQL annotations."""
    def __init__(self, annotation_string: str):
        self.annotation_string = annotation_string

    def __str__(self) -> str:
        return self.annotation_string

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}('{self.annotation_string}')"


class Key(TypeQLAnnotation):
    """Marks an attribute as a key for an entity. Translates to @key."""
    def __init__(self):
        super().__init__("@key")


class Card(TypeQLAnnotation):
    """
    Specifies the cardinality of an attribute or role.
    Example: Card("1"), Card("0..1"), Card("1..*"), Card("0..*")
    Translates to @card(value).
    """
    def __init__(self, cardinality: str):
        super().__init__(f"@card({cardinality})")


class Relates(TypeQLAnnotation):
    """
    Specifies a role in a relation that connects to a target entity type.
    Used within a @relation decorated model.
    The role name is taken from the attribute name in the Pydantic model.
    The target entity type can be provided or inferred from the type hint.
    """
    def __init__(self, target_entity_type: Type | str | None = None):
        # The actual "relates <role_name>" part will be constructed by the generator
        # This annotation primarily serves as a marker and to hold the target type.
        super().__init__("") # Placeholder, actual string is built by generator
        self.target_entity_type = target_entity_type


class Plays(TypeQLAnnotation):
    """
    Indicates that an entity plays a role in a specified relation.
    Used within an @entity decorated model.
    The relation type can be provided or inferred from the type hint.
    The role name played by the entity is typically inferred by the generator
    to be the lowercase name of the entity itself, or can be specified.
    """
    def __init__(self, relation_type: Type | str | None = None, role_name: str | None = None):
        # The actual "plays <relation_name>:<role_name>" part will be constructed by the generator.
        # This annotation serves as a marker and to hold the relation type and optional explicit role name.
        super().__init__("") # Placeholder, actual string is built by generator
        self.relation_type = relation_type
        self.role_name = role_name


class Ignore:
    """
    Special annotation to mark Pydantic fields to be excluded from TypeDB schema generation.
    Example: Annotated[str, Ignore()]
    """
    def __repr__(self) -> str:
        return "Ignore()"

class TypeQLRawAnnotation(TypeQLAnnotation):
    """
    Allows specifying any raw TypeQL annotation string.
    Example: TypeQLRawAnnotation('@regex("^[0-9]{4}[A-Z]{2}$")')
    This was named TypeQLAnnotation in the README, but renamed to avoid conflict with base class.
    """
    def __init__(self, annotation_string: str):
        super().__init__(annotation_string)
