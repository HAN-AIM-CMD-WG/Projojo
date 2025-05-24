import os
import importlib.util
import inspect
import types # Import types for types.UnionType
from typing import Type, Any, get_type_hints, get_args, Union
from pydantic import BaseModel
import sys # For path manipulation if needed

# Import decorators and annotations from tql_decorators.py
# Assuming tql_decorators.py is in the same directory or accessible via Python path
from tql_decorators import get_typeql_meta, has_typeql_meta, Key, Card, Relates, Plays, Ignore, TypeQLRawAnnotation, _MODEL_METADATA_REGISTRY

class TypeQLSchemaGenerator:
    models_path: str
    entities: list[tuple[Type[BaseModel], dict[str, Any], dict[str, Any]]]
    relations: list[tuple[Type[BaseModel], dict[str, Any], dict[str, Any]]]
    all_attributes: set[tuple[str, str]]

    def __init__(self, models_path: str):
        """
        Initializes the schema generator.

        Args:
            models_path: Path to a Python file or a package directory containing the Pydantic model definitions. This path should be relative to the project root or an absolute path.
        """
        self.models_path = os.path.abspath(models_path) # Ensure absolute path
        self.entities: list[tuple[Type[BaseModel], dict[str, Any], dict[str, Any]]] = [] # class, meta, module_dict
        self.relations: list[tuple[Type[BaseModel], dict[str, Any], dict[str, Any]]] = [] # class, meta, module_dict
        self.all_attributes: set[tuple[str, str]] = set() # (attr_name, typeql_value_type_str)

    def _find_python_files(self) -> list[str]:
        """Scans the models_path for .py files."""
        py_files = []
        if os.path.isfile(self.models_path) and self.models_path.endswith(".py"):
            py_files.append(self.models_path)
        elif os.path.isdir(self.models_path):
            for root, _, files in os.walk(self.models_path):
                for file in files:
                    if file.endswith(".py"):
                        py_files.append(os.path.join(root, file))
        else:
            raise ValueError(f"Invalid models_path: {self.models_path}. Must be a .py file or directory.")
        return py_files

    def _import_module_from_path(self, file_path: str) -> Any:
        """Dynamically imports a Python module from its file path."""
        module_name = os.path.splitext(os.path.basename(file_path))[0]
        # Add parent directory to sys.path to handle relative imports within the loaded module
        # This is a common strategy but can have side effects if module names clash.
        # A more robust solution might involve creating a temporary package structure or using runpy.

        # Ensure the directory containing schema_generator.py (and thus tql_decorators.py) is on the path
        # to allow dummy_classes.py to do `from tql_decorators import ...`
        script_dir = os.path.dirname(os.path.abspath(__file__))

        original_sys_path = list(sys.path)
        paths_to_add = []

        # Add script's directory (contains tql_decorators)
        if script_dir not in sys.path:
            paths_to_add.append(script_dir)

        # Add parent directory of the file being imported (helps with its own relative imports if any)
        module_parent_dir = os.path.dirname(file_path)
        if module_parent_dir not in sys.path and module_parent_dir not in paths_to_add:
            paths_to_add.append(module_parent_dir)

        for p in reversed(paths_to_add): # Add specific paths to the front
            sys.path.insert(0, p)

        spec = importlib.util.spec_from_file_location(module_name, file_path)
        if spec is None or spec.loader is None:
            # Restore sys.path before raising
            sys.path = original_sys_path
            raise ImportError(f"Could not create module spec for {file_path}")

        module = importlib.util.module_from_spec(spec)
        try:
            spec.loader.exec_module(module)
        finally:
            # Restore sys.path
            sys.path = original_sys_path
        return module

    def discover_models(self) -> None:
        """
        Discovers Pydantic models decorated with @entity or @relation from the specified path and populates self.entities and self.relations.
        """
        self.entities = []
        self.relations = []
        py_files = self._find_python_files()

        discovered_model_classes = [] # Store all model classes first

        for file_path in py_files:
            try:
                module = self._import_module_from_path(file_path)
                for _, member in inspect.getmembers(module, inspect.isclass):
                    if issubclass(member, BaseModel) and has_typeql_meta(member): # Use has_typeql_meta
                        discovered_model_classes.append(member) # Collect class

                        # Store metadata and module dict for later association
                        # We'll associate after attempting to rebuild all models
                        if not hasattr(member, "_temp_processing_info"):
                            member._temp_processing_info = {}
                        # Get the full metadata dict from the registry for this class
                        member._temp_processing_info['meta'] = _MODEL_METADATA_REGISTRY.get(member, {})
                        member._temp_processing_info['module_dict'] = module.__dict__

            except Exception:
                import traceback
                print(f"Warning: Could not process file during initial discovery {file_path}. Full traceback:")
                traceback.print_exc() # Print full traceback for this specific file processing

        # Combine all module dictionaries into a single namespace for forward ref resolution
        combined_globals = {}
        for mc in discovered_model_classes: # Iterate through classes that had _temp_processing_info
            if hasattr(mc, "_temp_processing_info"):
                combined_globals.update(mc._temp_processing_info['module_dict'])

        # Add builtins to combined_globals as Pydantic might need them
        combined_globals.update(sys.modules['builtins'].__dict__)


        # After all modules are loaded, try to update forward refs for all discovered Pydantic models
        for model_class in discovered_model_classes:
            try:
                # Ensure the class itself is in the globals for self-references if stringified
                combined_globals[model_class.__name__] = model_class

                if hasattr(model_class, 'model_rebuild'): # Pydantic v2
                    # Pydantic V2's model_rebuild uses the class's own module's globals by default.
                    # Providing _types_namespace can extend this.
                    model_class.model_rebuild(force=True, _types_namespace=combined_globals)
                elif hasattr(model_class, 'update_forward_refs'): # Pydantic v1
                    # update_forward_refs can take kwargs for globals and locals
                    model_class.update_forward_refs(**combined_globals)
                # print(f"Successfully rebuilt/updated forward refs for {model_class.__name__}")
            except Exception as e:
                print(f"Warning: Could not update forward refs for {model_class.__name__}: {e}")

        # Now populate self.entities and self.relations
        for model_class in discovered_model_classes:
            if hasattr(model_class, "_temp_processing_info"):
                info = model_class._temp_processing_info
                meta = info['meta']
                module_dict = info['module_dict']
                model_type = meta.get("type")

                if model_type == "entity":
                    self.entities.append((model_class, meta, module_dict))
                elif model_type == "relation":
                    self.relations.append((model_class, meta, module_dict))

                delattr(model_class, "_temp_processing_info") # Clean up temporary attribute
            else:
                # This case should ideally not happen if logic is correct
                print(f"Warning: Missing _temp_processing_info for {model_class.__name__}")

    def _get_typeql_value_type(self, py_type: Type, field_annotations: list[Any]) -> str:
        """Maps Python type to TypeDB value type string."""
        # Simplified mapping, needs to be more robust (handle Optional, List, datetime etc.)
        origin_type = getattr(py_type, "__origin__", None)
        type_args = getattr(py_type, "__args__", tuple())

        # Handle Optional[T] (i.e., T | None)
        # py_type is the initial type hint for the field

        current_type_to_check = py_type

        # Loop to unwrap Optionals, potentially multiple times (e.g., Optional[Optional[str]])
        # or List[Optional[str]] after list unwrapping.
        while True:
            origin_check = getattr(current_type_to_check, "__origin__", None)
            args_check = getattr(current_type_to_check, "__args__", tuple())

            is_typing_union_optional = origin_check is Union and len(args_check) == 2 and args_check[1] is type(None)
            is_types_uniontype_optional = isinstance(current_type_to_check, types.UnionType) and len(get_args(current_type_to_check)) == 2 and type(None) in get_args(current_type_to_check)

            if is_typing_union_optional:
                current_type_to_check = args_check[0] # Unwrap typing.Union[T, None] to T
            elif is_types_uniontype_optional:
                current_type_to_check = next(t for t in get_args(current_type_to_check) if t is not type(None)) # Unwrap T | None to T
            else:
                break # Not an Optional type, or no more Optionals to unwrap

        actual_type = current_type_to_check

        # actual_type is now potentially unwrapped from Optional.
        # Now, handle List[T] if actual_type is a list.
        origin_actual = getattr(actual_type, "__origin__", None)
        args_actual = getattr(actual_type, "__args__", tuple())

        if origin_actual is list or actual_type is list: # Check if it's a list type
            if args_actual: # e.g. list[str] or list[str | None]
                list_inner_type = args_actual[0]

                # The inner type of the list could itself be Optional, so unwrap it.
                origin_list_inner = getattr(list_inner_type, "__origin__", None)
                args_list_inner = getattr(list_inner_type, "__args__", tuple())

                is_typing_union_optional_list_inner = origin_list_inner is Union and len(args_list_inner) == 2 and args_list_inner[1] is type(None)
                is_types_uniontype_optional_list_inner = isinstance(list_inner_type, types.UnionType) and len(get_args(list_inner_type)) == 2 and type(None) in get_args(list_inner_type)

                if is_typing_union_optional_list_inner:
                    actual_type = args_list_inner[0]
                elif is_types_uniontype_optional_list_inner:
                    actual_type = next(t for t in get_args(list_inner_type) if t is not type(None))
                else:
                    actual_type = list_inner_type # Not an optional inner type
            else: # Case: `field: list` (raw list without inner type)
                print(f"Warning: List type hint for field does not specify inner type. Assuming 'string'. Field: {py_type}")
                return "string"
        # If it wasn't a list, actual_type remains as it was after initial Optional unwrap.


        if actual_type is str: return "string"
        if actual_type is int: return "integer"
        if actual_type is float: return "double"
        if actual_type is bool: return "boolean"

        # Check for datetime by name
        if hasattr(actual_type, '__name__') and actual_type.__name__ == 'datetime': return "datetime"

        # Fallback or error for unmapped types
        print(f"Warning: Unmapped Python type {actual_type} (original: {py_type}). Defaulting to 'string'. Consider adding a mapping.") # Added original py_type for context
        return "string"


    def _get_default_cardinality(self, py_type: Type, is_relation_role: bool = False) -> str:
        """Determines default cardinality based on Python type."""
        origin_type = getattr(py_type, "__origin__", None)
        type_args = getattr(py_type, "__args__", tuple())

        if origin_type is list:
            return "0..*" # list[T] defaults to 0 or more
        if origin_type is Union and len(type_args) == 2 and type_args[1] is type(None):
            # T | None (Optional[T]) defaults to 1 for attributes,
            # but for relation roles, it often implies 0..1 or 1 if not a list.
            # The README implies `T | None` defaults to `@card(1)` for attributes.
            # For roles like `student: Annotated[Student | None, Relates(Student)]` it's also `card(1)`.
            return "1"
        return "1" # Singular types default to 1

    def _format_typeql_annotations(self, annotations: list[Any]) -> str:
        """Formats a list of TypeQLAnnotation instances into a space-separated string."""
        return " ".join(str(ann) for ann in annotations if isinstance(ann, (Key, Card, TypeQLRawAnnotation))).strip()

    def _process_entities(self) -> list[str]:
        entity_definitions = []
        # self.all_attributes is updated directly by _get_typeql_value_type and attribute processing

        for cls, meta_dict, module_globals in self.entities: # meta_dict is from registry
            class_name_str = cls.__name__
            default_tql_name = class_name_str[0].lower() + class_name_str[1:] if class_name_str else ""

            entity_name = meta_dict.get("name", default_tql_name)
            is_abstract = meta_dict.get("abstract", False)

            supertype_name = None
            parent_entity_fields = set()
            typeql_parent_class = None

            for base in cls.__bases__:
                if has_typeql_meta(base) and get_typeql_meta(base, "type") == "entity":
                    base_class_name_str = base.__name__
                    default_base_tql_name = base_class_name_str[0].lower() + base_class_name_str[1:] if base_class_name_str else ""
                    supertype_name = get_typeql_meta(base, "name", default_base_tql_name)
                    typeql_parent_class = base
                    # Get fields from the direct TypeDB parent model
                    parent_fields_dict = typeql_parent_class.model_fields if hasattr(typeql_parent_class, 'model_fields') else typeql_parent_class.__fields__
                    parent_entity_fields.update(parent_fields_dict.keys())
                    break # Assuming single TypeDB inheritance for now

            owns_clauses = []
            plays_clauses = []

            try:
                # Pydantic v2 uses model_fields, v1 uses __fields__
                fields = cls.model_fields if hasattr(cls, 'model_fields') else cls.__fields__
                # Get type hints including Annotated metadata, using module_globals as localns
                type_hints_with_extras = get_type_hints(cls, globalns=None, localns=module_globals, include_extras=True)
            except Exception as e:
                print(f"Error introspecting fields for entity {entity_name} (module {module_globals.get('__name__')}): {e}")
                continue


            for field_name, field_obj in fields.items():
                if field_name in parent_entity_fields: # Skip inherited fields
                    continue

                py_type_hint_full = type_hints_with_extras.get(field_name)
                if py_type_hint_full is None:
                    print(f"Warning: Could not get type hint for {entity_name}.{field_name}")
                    continue

                args = get_args(py_type_hint_full)
                py_actual_type = args[0] if args else py_type_hint_full # The actual Python type
                field_tql_annotations = [a for a in args[1:] if hasattr(a, 'annotation_string') or isinstance(a, Ignore)] if args else []

                if any(isinstance(ann, Ignore) for ann in field_tql_annotations):
                    continue

                # Check for Plays annotation
                plays_ann = next((ann for ann in field_tql_annotations if isinstance(ann, Plays)), None)
                card_ann = next((ann for ann in field_tql_annotations if isinstance(ann, Card)), None)

                if plays_ann:
                    # Infer relation name from Plays annotation or field type
                    relation_type_in_plays = plays_ann.relation_type
                    relation_name = ""
                    # Determine the class representing the relation
                    relation_cls_for_name = None
                    if relation_type_in_plays:
                        if not isinstance(relation_type_in_plays, str): # If it's a type object
                            relation_cls_for_name = relation_type_in_plays
                    else: # Infer from field's Python type
                        type_to_infer_from = py_actual_type
                        origin_infer = getattr(py_actual_type, "__origin__", None)
                        args_infer = getattr(py_actual_type, "__args__", tuple())
                        if origin_infer is list and args_infer:
                            type_to_infer_from = args_infer[0]
                        # Unwrap if Optional, e.g. list[Optional[RelationType]]
                        origin_inner = getattr(type_to_infer_from, "__origin__", None)
                        args_inner = getattr(type_to_infer_from, "__args__", tuple())
                        if (origin_inner is Union and len(args_inner) == 2 and args_inner[1] is type(None)) or \
                            (isinstance(type_to_infer_from, type(Union[int,str])) and len(get_args(type_to_infer_from)) == 2 and type(None) in get_args(type_to_infer_from)):
                            type_to_infer_from = next(t for t in get_args(type_to_infer_from) if t is not type(None))
                        relation_cls_for_name = type_to_infer_from

                    # Get relation name from its metadata or class name (first letter lowercased)
                    if isinstance(relation_type_in_plays, str): # If name was given as string
                        relation_name = relation_type_in_plays # Use as is, assuming user provided correct case
                    elif relation_cls_for_name and has_typeql_meta(relation_cls_for_name):
                        rel_cls_name_str = relation_cls_for_name.__name__
                        default_rel_tql_name = rel_cls_name_str[0].lower() + rel_cls_name_str[1:] if rel_cls_name_str else ""
                        relation_name = get_typeql_meta(relation_cls_for_name, "name", default_rel_tql_name)
                    elif relation_cls_for_name: # Fallback if no meta, but type object exists
                        rel_cls_name_str = relation_cls_for_name.__name__
                        relation_name = rel_cls_name_str[0].lower() + rel_cls_name_str[1:] if rel_cls_name_str else ""
                    else:
                        # This case should be rare if type hints are proper
                        print(f"Warning: Could not determine relation name for Plays annotation in {entity_name}.{field_name}. Defaulting to empty string.")


                    role_name = plays_ann.role_name if plays_ann.role_name else entity_name # Default role is entity name

                    final_cardinality_str = ""
                    if card_ann:
                        final_cardinality_str = str(card_ann)
                    else:
                        default_card_val = self._get_default_cardinality(py_actual_type)
                        if default_card_val: # Ensure it's not empty if we decide some types have no default card
                            final_cardinality_str = f"@card({default_card_val})"

                    plays_clauses.append(f"plays {relation_name}:{role_name} {final_cardinality_str}".strip())
                else: # Owned attribute
                    attr_name_tql = field_name # Or field_obj.alias if using Pydantic alias
                    typeql_value_type = self._get_typeql_value_type(py_actual_type, field_tql_annotations)
                    self.all_attributes.add((attr_name_tql, typeql_value_type))

                    # Check if the attribute is a key
                    is_key_attribute = any(isinstance(ann, Key) for ann in field_tql_annotations)

                    # Format other annotations (like @key, or custom ones)
                    # Exclude Card annotation here as it's handled separately or skipped for @key
                    other_anns_str = self._format_typeql_annotations(
                        [ann for ann in field_tql_annotations if not isinstance(ann, Card)]
                    )

                    owns_clause = f"owns {attr_name_tql}"
                    if other_anns_str: # This will add @key if present
                        owns_clause += f" {other_anns_str}"

                    if not is_key_attribute: # Only add cardinality if not a key
                        final_cardinality_str = ""
                        if card_ann: # Explicit Card annotation
                            final_cardinality_str = str(card_ann)
                        else: # Default cardinality
                            default_card_val = self._get_default_cardinality(py_actual_type)
                            if default_card_val:
                                final_cardinality_str = f"@card({default_card_val})"

                        if final_cardinality_str:
                            owns_clause += f" {final_cardinality_str}"

                    owns_clauses.append(owns_clause.strip())

            # Assemble entity definition
            definition_parts = [f"entity {entity_name}"]
            if supertype_name: definition_parts.append(f"sub {supertype_name}")
            if is_abstract: definition_parts.append("@abstract")

            all_clauses = owns_clauses + plays_clauses
            if all_clauses:
                definition_parts[-1] += "," # Add comma to the last part of header (name, sub, or abstract)
                entity_def_str = " ".join(definition_parts) + "\n    " + ",\n    ".join(all_clauses) + ";\n"
            else:
                entity_def_str = " ".join(definition_parts) + ";\n"
            entity_definitions.append(entity_def_str)

        return entity_definitions

    def _process_relations(self) -> list[str]:
        relation_definitions = []
        # self.all_attributes is assumed to be populated/updated during entity processing or here if needed

        for cls, meta_dict, module_globals in self.relations: # meta_dict is from registry
            class_name_str = cls.__name__
            default_tql_name = class_name_str[0].lower() + class_name_str[1:] if class_name_str else ""
            relation_name = meta_dict.get("name", default_tql_name)

            owns_clauses = []
            relates_clauses = []

            try:
                fields = cls.model_fields if hasattr(cls, 'model_fields') else cls.__fields__
                # Get type hints including Annotated metadata, using module_globals as localns
                type_hints_with_extras = get_type_hints(cls, globalns=None, localns=module_globals, include_extras=True)
            except Exception as e:
                print(f"Error introspecting fields for relation {relation_name} (module {module_globals.get('__name__')}): {e}")
                continue

            for field_name, field_obj in fields.items():
                py_type_hint_full = type_hints_with_extras.get(field_name)
                if py_type_hint_full is None:
                    print(f"Warning: Could not get type hint for {relation_name}.{field_name}")
                    continue

                args = get_args(py_type_hint_full)
                py_actual_type = args[0] if args else py_type_hint_full
                field_tql_annotations = [a for a in args[1:] if hasattr(a, 'annotation_string') or isinstance(a, Ignore)] if args else []

                if any(isinstance(ann, Ignore) for ann in field_tql_annotations):
                    continue

                relates_ann = next((ann for ann in field_tql_annotations if isinstance(ann, Relates)), None)
                card_ann = next((ann for ann in field_tql_annotations if isinstance(ann, Card)), None)

                if relates_ann:
                    role_name = field_name # Role name is the Pydantic field name
                    # Target entity type from Relates.target_entity_type or infer. Not fully implemented here.
                    # For now, we assume the generator needs to resolve this.
                    # The Relates annotation itself doesn't carry the role name string in its __str__.
                    final_cardinality_str = ""
                    if card_ann:
                        final_cardinality_str = str(card_ann)
                    else:
                        default_card_val = self._get_default_cardinality(py_actual_type, is_relation_role=True)
                        if default_card_val:
                            final_cardinality_str = f"@card({default_card_val})"
                    relates_clauses.append(f"relates {role_name} {final_cardinality_str}".strip())
                else: # Owned attribute by the relation
                    attr_name_tql = field_name
                    typeql_value_type = self._get_typeql_value_type(py_actual_type, field_tql_annotations)
                    self.all_attributes.add((attr_name_tql, typeql_value_type))

                    # Relation attributes cannot be @key in TypeDB, but we apply same logic for consistency
                    # though TypeDB would likely error if @key is on a relation attribute.
                    # For now, let's assume @key is only for entity attributes.
                    # If a relation attribute could be a key in some TypeQL extension, this logic would apply.
                    is_key_attribute = any(isinstance(ann, Key) for ann in field_tql_annotations)

                    other_anns_str = self._format_typeql_annotations(
                        [ann for ann in field_tql_annotations if not isinstance(ann, Card)]
                    )

                    owns_clause = f"owns {attr_name_tql}"
                    if other_anns_str: # This would include @key if it were allowed and present
                        owns_clause += f" {other_anns_str}"

                    if not is_key_attribute: # Only add cardinality if not a key (or if keys on relations could have explicit cards)
                        final_cardinality_str = ""
                        if card_ann:
                            final_cardinality_str = str(card_ann)
                        else:
                            default_card_val = self._get_default_cardinality(py_actual_type)
                            if default_card_val:
                                final_cardinality_str = f"@card({default_card_val})"

                        if final_cardinality_str:
                            owns_clause += f" {final_cardinality_str}"

                    owns_clauses.append(owns_clause.strip())

            definition_parts = [f"relation {relation_name}"]
            all_clauses = relates_clauses + owns_clauses # TypeDB typically lists relates first for relations
            if all_clauses:
                definition_parts[-1] += ","
                relation_def_str = " ".join(definition_parts) + "\n    " + ",\n    ".join(all_clauses) + ";\n"
            else:
                relation_def_str = " ".join(definition_parts) + ";\n"
            relation_definitions.append(relation_def_str)

        return relation_definitions

    def _generate_attribute_definitions(self) -> list[str]:
        attr_defs = []
        for attr_name, typeql_value_type in sorted(list(self.all_attributes)): # Sort for consistent output
            attr_defs.append(f"attribute {attr_name} value {typeql_value_type};\n")
        return attr_defs

    def generate(self) -> str:
        """
        Orchestrates the schema generation process.
        1. Discovers models.
        2. Processes entities.
        3. Processes relations.
        4. Assembles the final TypeQL schema string.
        """
        self.discover_models() # Populates self.entities

        # Sort entities to ensure supertypes are defined before subtypes
        # self.entities is a list of (class_obj, meta_dict, module_globals)
        # We need to sort based on class_obj's inheritance

        # Create a map of class to its TypeDB parent class object
        parent_map: dict[Type[BaseModel], Type[BaseModel] | None] = {}
        class_to_entry_map: dict[Type[BaseModel], tuple[Type[BaseModel], dict[str, Any], dict[str, Any]]] = {
            entry[0]: entry for entry in self.entities
        }

        for cls, _, _ in self.entities:
            parent_map[cls] = None
            for base in cls.__bases__:
                if has_typeql_meta(base) and get_typeql_meta(base, "type") == "entity":
                    parent_map[cls] = base
                    break

        # Topological sort (simple version for single inheritance chains)
        sorted_entities_entries: list[tuple[Type[BaseModel], dict[str, Any], dict[str, Any]]] = []
        processed_classes: set[Type[BaseModel]] = set()

        # Iteratively add entities whose parents are already processed or have no parent
        # This might need multiple passes if the initial self.entities list is not well-ordered
        # A more robust topo sort would handle complex graphs better.

        temp_entities_list = list(self.entities) # Work on a copy

        while len(sorted_entities_entries) < len(self.entities):
            start_count = len(sorted_entities_entries)
            remaining_entities_after_pass = []

            for entry in temp_entities_list:
                cls = entry[0]
                parent = parent_map.get(cls)
                if parent is None or parent in processed_classes:
                    if cls not in processed_classes:
                        sorted_entities_entries.append(entry)
                        processed_classes.add(cls)
                else:
                    remaining_entities_after_pass.append(entry)

            if len(sorted_entities_entries) == start_count and remaining_entities_after_pass:
                # Stuck, indicates a cycle or unresolvable parent not in self.entities
                # This shouldn't happen if all TypeDB entities are discovered correctly
                print(f"Warning: Could not topologically sort all entities. Remaining: {[e[0].__name__ for e in remaining_entities_after_pass]}")
                # Add remaining ones to avoid infinite loop, though order might be wrong
                sorted_entities_entries.extend(remaining_entities_after_pass)
                break

            temp_entities_list = remaining_entities_after_pass

        # Replace self.entities with the sorted version before processing
        original_entities_for_processing = self.entities
        self.entities = sorted_entities_entries

        entity_definition_strs = self._process_entities() # These already end with ";\n"

        self.entities = original_entities_for_processing # Restore if needed elsewhere, though likely not

        relation_definition_strs = self._process_relations() # These already end with ";\n"
        attribute_definition_strs = self._generate_attribute_definitions() # These already end with ";\n"

        final_schema_string = "define\n\n"

        if entity_definition_strs:
            final_schema_string += "\n".join(entity_definition_strs) # Join with single \n, as each already has one.
                                                                    # This creates one blank line between them.
            if relation_definition_strs or attribute_definition_strs:
                final_schema_string += "\n" # Extra newline before next block

        if relation_definition_strs:
            final_schema_string += "\n".join(relation_definition_strs)
            if attribute_definition_strs:
                final_schema_string += "\n" # Extra newline before attributes

        if attribute_definition_strs:
            final_schema_string += "".join(attribute_definition_strs) # Attributes are typically dense

        return final_schema_string.strip() + "\n" # Ensure a single trailing newline


def generate_typeql_schema(module_or_package_path: str) -> str:
    """
    Generates a TypeDB schema from Pydantic models decorated with @entity or @relation.
    This is the main entry point function.

    Args:
        module_or_package_path: Path to a Python file or a package directory containing the Pydantic model definitions. This path should be relative to the project root or an absolute path.
    Returns:
        A string representing the TypeDB schema in TypeQL.
    """
    generator = TypeQLSchemaGenerator(models_path=module_or_package_path)
    return generator.generate()


# Example Usage (for testing purposes, typically you'd import and call generate_typeql_schema)
if __name__ == '__main__':
    # When running this script directly from its own directory. The 'example' directory is a direct subdirectory.
    # The TypeQLSchemaGenerator will convert "example" to an absolute path based on CWD.
    generated_schema = generate_typeql_schema("example")

    # Save to file (or not if there's no difference)
    with open("example/generatedSchema.tql", "r") as file:
        existing_schema = file.read().strip()
    if generated_schema.strip() != existing_schema:
        with open("example/generatedSchema.tql", "w") as file:
            file.write(generated_schema.strip())
        print("Schema updated in example/generatedSchema.tql")
    else:
        print("Schema is up-to-date, no changes made.")
