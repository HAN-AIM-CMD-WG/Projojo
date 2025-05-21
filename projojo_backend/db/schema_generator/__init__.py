# Export the main functions and classes for easy importing
from .schema_generator import generate_typeql_schema, TypeQLSchemaGenerator
from .tql_decorators import (
    entity, relation, abstract,
    Key, Card, Plays, Relates, Ignore, TypeQLRawAnnotation,
    get_typeql_meta, set_typeql_meta
)

__all__ = [
    # Main generator function
    'generate_typeql_schema',
    'TypeQLSchemaGenerator',

    # Decorators
    'entity',
    'relation',
    'abstract',

    # Annotations
    'Key',
    'Card',
    'Plays',
    'Relates',
    'Ignore',
    'TypeQLRawAnnotation',

    # Helper functions
    'get_typeql_meta',
    'set_typeql_meta'
]
