import re
from datetime import datetime

PLACEHOLDER_PATTERN = re.compile(r'@([a-zA-Z_][a-zA-Z0-9_]*)')

class TQLSafeFormatter:
    @staticmethod
    def build_query(template: str, params: dict) -> str:
        # Extract placeholders in template
        placeholders = set(PLACEHOLDER_PATTERN.findall(template))

        # 1. Controleer of alle placeholders en params overeenkomen
        missing = placeholders - params.keys()
        extra = params.keys() - placeholders
        if missing:
            raise ValueError(f"Missing parameters for placeholders: {missing}")
        if extra:
            raise ValueError(f"Unused parameters in dict: {extra}")

        # 2. Vervang elke placeholder door veilig formaat
        def _escape_value(value):
            # Reject None/NULL values explicitly
            if value is None:
                raise ValueError("None/NULL values not supported. Use explicit handling in your query.")

            # Boolean check must come before int check (bool is subclass of int in Python)
            if isinstance(value, bool):
                return "true" if value else "false"

            # String escaping with proper backslash handling
            if isinstance(value, str):
                # CRITICAL: Escape backslashes FIRST, then quotes
                escaped = value.replace('\\', '\\\\').replace('"', '\\"')
                # Escape control characters to prevent multi-line injection
                escaped = escaped.replace('\n', '\\n').replace('\r', '\\r').replace('\t', '\\t')
                return '"' + escaped + '"'

            # DateTime handling
            if isinstance(value, datetime):
                return '"' + value.strftime("%Y-%m-%dT%H:%M:%S") + '"'

            # Numeric types - return unquoted
            if isinstance(value, (int, float)):
                return str(value)

            # Reject unsupported types explicitly
            raise ValueError(f"Unsupported type {type(value).__name__} for value {value}. "
                        f"Supported types: str, bool, int, float, datetime")

        result = template
        for key, value in params.items():
            escaped_value = _escape_value(value)
            placeholder = f'@{key}'
            result = result.replace(placeholder, escaped_value)
        return result
