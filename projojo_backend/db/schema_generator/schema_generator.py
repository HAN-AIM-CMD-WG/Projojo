import inspect
from pydantic import BaseModel
from typing import get_type_hints, get_args, get_origin, Union, List, Type, ForwardRef
from datetime import datetime
import logging
import sys

from tql_generator import get_typeql_meta, Key, Card, Relates, Plays, Ignore, TypeQLRawAnnotation

# Configure basic logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

# --- Type Mapping ---
PYTHON_TO_TQL_TYPE_MAP = {
    str: "string",
    int: "long",
    float: "double",
    bool: "boolean",
    datetime: "datetime",
}

def get_tql_value_type(py_type: Type) -> str | None:
    """Converts a Python type to its TypeQL value type string."""
    origin_type = get_origin(py_type)

    # Handle Union types (Optional[T] is Union[T, None])
    if origin_type is Union:
        args = get_args(py_type)
        # Filter out NoneType and take the first remaining type
        non_none_args = [arg for arg in args if arg is not type(None)]
        if non_none_args:
            # Recursively call for the actual type, e.g., str in Optional[str]
            return get_tql_value_type(non_none_args[0])
        return None

    # Handle list types
    elif origin_type is list or origin_type is List:
        list_item_type = get_args(py_type)[0]
        return get_tql_value_type(list_item_type)

    # Handle direct type mapping
    return PYTHON_TO_TQL_TYPE_MAP.get(py_type)

class TypeQLSchemaGenerator:
    def __init__(self, models: List[Type[BaseModel]]):
        self.models = models
        self.schema_parts = {
            "attributes": set(),
            "entities": [],
            "relations": []
        }
        self.processed_models = set()  # To avoid processing a model multiple times
        self.model_name_to_class = {}  # Map model names to their classes for forward ref resolution

        # Build the model name to class mapping for all models
        for model in models:
            self.model_name_to_class[model.__name__] = model
            # Also map lowercase name for case-insensitive lookup
            self.model_name_to_class[model.__name__.lower()] = model

    def _resolve_forward_ref(self, ref: ForwardRef | str, global_ns: dict) -> Type | None:
        """
        Resolves a forward reference to its actual class.
        Handles both ForwardRef objects and string references.
        """
        if isinstance(ref, str):
            # Handle string literal forward references
            ref_name = ref
        else:
            # Handle ForwardRef objects
            ref_name = ref.__forward_arg__

        # First try to find in the global namespace
        if ref_name in global_ns:
            return global_ns[ref_name]

        # Then try our model mapping
        if ref_name in self.model_name_to_class:
            return self.model_name_to_class[ref_name]

        # Try case-insensitive lookup
        if ref_name.lower() in self.model_name_to_class:
            return self.model_name_to_class[ref_name.lower()]

        logging.warning(f"Could not resolve forward reference: {ref_name}")
        return None

    def _get_actual_type(self, type_hint, model_module_globals):
        """Handles basic types, Union, List, and ForwardRef."""
        origin = get_origin(type_hint)
        args = get_args(type_hint)

        # Handle ForwardRef
        if isinstance(type_hint, ForwardRef) or isinstance(type_hint, str):
            return self._resolve_forward_ref(type_hint, model_module_globals)

        # Handle Union (Optional[T] or T | None)
        if origin is Union:
            # Get the first non-None type from Union arguments
            actual_types = [
                self._get_actual_type(arg, model_module_globals)
                for arg in args if arg is not type(None)
            ]
            return actual_types[0] if actual_types else None

        # Handle List types
        elif origin is list or origin is List:
            if args and (isinstance(args[0], ForwardRef) or isinstance(args[0], str)):
                list_item_type = self._resolve_forward_ref(args[0], model_module_globals)
                return list[list_item_type] if list_item_type else None
            elif args:
                return list[self._get_actual_type(args[0], model_module_globals)]
            return None

        return type_hint

    def _process_field_annotations(self, py_type_hint, pydantic_annotations) -> list[str]:
        """
        Processes Pydantic annotations for a field to extract TypeQL annotations.
        Returns a list of TypeQL annotation strings.
        """
        tql_annotations = []
        has_explicit_card = False

        for ann in pydantic_annotations:
            if isinstance(ann, Key):
                tql_annotations.append(str(ann))
            elif isinstance(ann, Card):
                tql_annotations.append(str(ann))
                has_explicit_card = True
            elif isinstance(ann, TypeQLRawAnnotation):
                tql_annotations.append(str(ann))
            # Relates and Plays are handled at entity/relation level

        # Determine default cardinality if not explicitly set
        if not has_explicit_card:
            origin = get_origin(py_type_hint)
            if origin is list or origin is List:
                tql_annotations.append("@card(0..)")  # Default for lists
            else:
                tql_annotations.append("@card(1)")   # Default for singular types

        return tql_annotations

    def _generate_for_model(self, model_cls: Type[BaseModel]):
        """Generate TypeQL schema for a single model class."""
        if model_cls in self.processed_models:
            return
        self.processed_models.add(model_cls)

        model_type = get_typeql_meta(model_cls, "type")
        if not model_type:  # Not an @entity or @relation
            return

        typeql_name = get_typeql_meta(model_cls, "name", model_cls.__name__.lower())

        # Get global namespace from the module where model_cls is defined
        model_module = inspect.getmodule(model_cls)
        model_module_globals = model_module.__dict__ if model_module else {}

        # Add our model mapping to the globals to help with resolution
        for name, cls in self.model_name_to_class.items():
            if name not in model_module_globals:
                model_module_globals[name] = cls

        # Handle inheritance (subtyping)
        sub_type_clause = ""
        if model_type == "entity":
            for base in model_cls.__bases__:
                if base is not BaseModel and get_typeql_meta(base, "type") == "entity":
                    base_tql_name = get_typeql_meta(base, "name", base.__name__.lower())
                    sub_type_clause = f"sub {base_tql_name}"
                    # Recursively process base model if not already done
                    self._generate_for_model(base)
                    break  # Assuming single inheritance for TypeQL 'sub'

        # Abstract
        abstract_clause = "@abstract" if get_typeql_meta(model_cls, "abstract") else ""

        definition_parts = [model_type, typeql_name]
        if abstract_clause:
            definition_parts.append(abstract_clause)
        if sub_type_clause:
            definition_parts.append(sub_type_clause)

        current_schema_def = [" ".join(definition_parts) + ","]

        # Process fields for 'owns' attributes, 'plays' roles, or 'relates' roles
        try:
            # Pydantic v2 uses model_fields, v1 uses __fields__
            fields = model_cls.model_fields if hasattr(model_cls, 'model_fields') else model_cls.__fields__
            # include_extras=True for Annotated fields
            type_hints = get_type_hints(model_cls, globalns=model_module_globals, localns=None, include_extras=True)
        except Exception as e:
            logging.error(f"Could not get type hints for {model_cls.__name__}: {e}. Skipping field processing.")
            fields = {}
            type_hints = {}

        for field_name, field_obj in fields.items():
            raw_type_hint = type_hints.get(field_name)
            if raw_type_hint is None:
                logging.warning(f"No type hint found for field '{field_name}' in '{model_cls.__name__}'. Skipping.")
                continue

            # Get Pydantic annotations if using Annotated
            pydantic_field_annotations = get_args(raw_type_hint)[1:] if get_origin(raw_type_hint) is Annotated else []

            # Skip ignored fields
            if any(isinstance(ann, Ignore) for ann in pydantic_field_annotations):
                continue

            # Get the actual type hint (first arg of Annotated or the raw hint)
            actual_py_type_hint = get_args(raw_type_hint)[0] if get_origin(raw_type_hint) is Annotated else raw_type_hint

            # Handle Union types (Optional fields)
            is_optional = False
            if get_origin(actual_py_type_hint) is Union:
                args = get_args(actual_py_type_hint)
                if type(None) in args:
                    is_optional = True
                    # Get the non-None type
                    actual_py_type_hint = next(arg for arg in args if arg is not type(None))

            # Resolve the actual Python type
            resolved_py_type = self._get_actual_type(actual_py_type_hint, model_module_globals)

            if resolved_py_type is None:
                logging.warning(f"Could not resolve Python type for field '{field_name}' in '{model_cls.__name__}'. Skipping.")
                continue

            # Handle 'plays' for entities
            plays_annotation = next((ann for ann in pydantic_field_annotations if isinstance(ann, Plays)), None)
            if model_type == "entity" and plays_annotation:
                relation_type_hint = plays_annotation.relation_type or resolved_py_type

                # If it's a list, get the item type
                if get_origin(relation_type_hint) in [list, List]:
                    relation_type_hint = get_args(relation_type_hint)[0]

                # Resolve the relation type
                relation_actual_type = self._get_actual_type(relation_type_hint, model_module_globals)

                if relation_actual_type and get_typeql_meta(relation_actual_type, "type") == "relation":
                    relation_tql_name = get_typeql_meta(relation_actual_type, "name", relation_actual_type.__name__.lower())
                    role_name = plays_annotation.role_name or typeql_name  # Default role name is the entity's own name

                    # Determine cardinality
                    card_annotations = [str(ann) for ann in pydantic_field_annotations if isinstance(ann, Card)]
                    card_str = card_annotations[0] if card_annotations else \
                              ("@card(0..)" if get_origin(actual_py_type_hint) in [list, List] else "@card(1)")

                    current_schema_def.append(f"  plays {relation_tql_name}:{role_name} {card_str},")

                    # Ensure relation is processed
                    self._generate_for_model(relation_actual_type)
                else:
                    logging.warning(f"Field '{field_name}' in '{model_cls.__name__}' has Plays annotation but target type '{relation_actual_type}' is not a @relation. Skipping.")
                continue

            # Handle 'relates' for relations
            relates_annotation = next((ann for ann in pydantic_field_annotations if isinstance(ann, Relates)), None)
            if model_type == "relation" and relates_annotation:
                target_entity_type_hint = relates_annotation.target_entity_type or resolved_py_type
                target_entity_actual_type = self._get_actual_type(target_entity_type_hint, model_module_globals)

                if target_entity_actual_type and get_typeql_meta(target_entity_actual_type, "type") == "entity":
                    # Role name is the field name itself
                    role_name = field_name

                    # Determine cardinality
                    card_annotations = [str(ann) for ann in pydantic_field_annotations if isinstance(ann, Card)]
                    card_str = card_annotations[0] if card_annotations else "@card(1)"  # Default for relates

                    current_schema_def.append(f"  relates {role_name} {card_str},")

                    # Ensure entity is processed
                    self._generate_for_model(target_entity_actual_type)
                else:
                    logging.warning(f"Field '{field_name}' in '{model_cls.__name__}' has Relates annotation but target type '{target_entity_actual_type}' is not an @entity. Skipping.")
                continue

            # Otherwise, it's an 'owns' attribute
            tql_value_type = get_tql_value_type(resolved_py_type)
            if tql_value_type:
                # Add attribute definition
                self.schema_parts["attributes"].add(f"attribute {field_name} value {tql_value_type};")

                # Process annotations
                attr_tql_annotations = self._process_field_annotations(actual_py_type_hint, pydantic_field_annotations)

                # If it's optional, adjust cardinality
                if is_optional:
                    # Replace @card(1) with @card(0..1) for optional fields
                    attr_tql_annotations = [ann.replace("@card(1)", "@card(0..1)") for ann in attr_tql_annotations]

                current_schema_def.append(f"  owns {field_name} {' '.join(attr_tql_annotations)},")
            else:
                # This might be a complex type not meant to be an attribute
                is_relation_field = get_origin(resolved_py_type) in [list, List] and \
                                   get_args(resolved_py_type) and \
                                   get_typeql_meta(get_args(resolved_py_type)[0], "type")
                is_entity_field = get_typeql_meta(resolved_py_type, "type")

                if not (is_relation_field or is_entity_field):
                    logging.warning(f"Field '{field_name}' in '{model_cls.__name__}' has unmappable TypeQL type: {resolved_py_type}. It's not an attribute, plays, or relates. Skipping.")

        # Finalize definition
        if current_schema_def[-1].endswith(","):
            current_schema_def[-1] = current_schema_def[-1][:-1]  # Remove last comma
        current_schema_def[-1] += ";"

        if model_type == "entity":
            self.schema_parts["entities"].append("\n".join(current_schema_def))
        elif model_type == "relation":
            self.schema_parts["relations"].append("\n".join(current_schema_def))

    def generate_schema_str(self) -> str:
        """Generates the full TypeQL schema string."""
        self.schema_parts = {"attributes": set(), "entities": [], "relations": []}  # Reset
        self.processed_models = set()

        for model_cls in self.models:
            self._generate_for_model(model_cls)

        # Assemble the final schema string
        output = ["define"]

        # Attributes (sorted for consistent output)
        for attr_def in sorted(list(self.schema_parts["attributes"])):
            output.append(attr_def)
        if self.schema_parts["attributes"]:
            output.append("")  # Add a newline after attributes

        # Entities
        for entity_def in self.schema_parts["entities"]:
            output.append(entity_def)
            output.append("")  # Add a newline after each entity definition block

        # Relations
        for relation_def in self.schema_parts["relations"]:
            output.append(relation_def)
            output.append("")  # Add a newline after each relation definition block

        # Remove last empty line if present
        if output[-1] == "":
            output.pop()

        return "\n".join(output)


def discover_models_in_directory(directory_path: str) -> List[Type[BaseModel]]:
    """
    Discovers all Pydantic models in a directory that are decorated with @entity or @relation.

    Args:
        directory_path: Path to the directory to scan for models

    Returns:
        List of discovered model classes
    """
    import importlib.util
    import pkgutil
    import inspect
    import os
    import sys

    discovered_models = []

    # Ensure the directory exists
    if not os.path.isdir(directory_path):
        logging.error(f"Directory '{directory_path}' does not exist.")
        return []

    # Add the parent directory to sys.path to allow imports
    parent_dir = os.path.abspath(os.path.join(directory_path, '..'))
    if parent_dir not in sys.path:
        sys.path.insert(0, parent_dir)

    # Get the package name from the directory path
    package_name = os.path.basename(directory_path)

    # Scan all Python files in the directory and its subdirectories
    for root, _, files in os.walk(directory_path):
        for file in files:
            if file.endswith('.py') and not file.startswith('__'):
                # Construct the module path
                file_path = os.path.join(root, file)
                module_path = os.path.relpath(file_path, parent_dir).replace(os.path.sep, '.')
                module_name = os.path.splitext(module_path)[0]

                try:
                    # Import the module
                    spec = importlib.util.spec_from_file_location(module_name, file_path)
                    if spec is None or spec.loader is None:
                        continue

                    module = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(module)

                    # Find all classes in the module that are decorated with @entity or @relation
                    for name, obj in inspect.getmembers(module):
                        if inspect.isclass(obj) and issubclass(obj, BaseModel) and obj is not BaseModel:
                            # Check if the class has _typeql_meta attribute with type "entity" or "relation"
                            typeql_type = get_typeql_meta(obj, "type")
                            if typeql_type in ["entity", "relation"]:
                                discovered_models.append(obj)
                                logging.info(f"Discovered {typeql_type} model: {obj.__name__}")

                except (ImportError, AttributeError, TypeError) as e:
                    logging.warning(f"Error importing module {module_name}: {e}")

    return discovered_models

def generate_typeql_schema(directory_path: str) -> str:
    """
    Main function to generate TypeQL schema from models in a directory.

    Args:
        directory_path: Path to the directory containing Pydantic models

    Returns:
        Generated TypeQL schema as a string
    """
    # Discover models in the directory
    model_classes = discover_models_in_directory(directory_path)

    if not model_classes:
        logging.warning(f"No model classes found in directory '{directory_path}'.")
        return "define\n"

    generator = TypeQLSchemaGenerator(model_classes)
    return generator.generate_schema_str()

# Example Usage (for testing purposes, typically you'd import and call generate_typeql_schema)
if __name__ == '__main__':
    import os

    # Get the path to the example directory
    example_dir = os.path.join(os.path.dirname(__file__), 'example')

    # Generate the schema from models in the example directory
    schema = generate_typeql_schema(example_dir)

    # Write the schema to a file
    schema_file_path = os.path.join(example_dir, 'schema.tql')
    with open(schema_file_path, 'w') as f:
        f.write(schema)

    print(f"Schema generated and saved to {schema_file_path}")

    # Also print to console for debugging
    print("Generated TypeQL Schema:")
    print(schema)
    print("\n--- End of Schema ---")
