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
            if isinstance(value, str):
                return '"' + value.replace('"', '\\"') + '"'
            if isinstance(value, bool):
                return "true" if value else "false"
            if isinstance(value, datetime):
                return '"' + value.strftime("%Y-%m-%dT%H:%M:%S") + '"'
            return str(value)

        result = template
        for key, value in params.items():
            escaped_value = _escape_value(value)
            result = re.sub(rf'@{key}\b', escaped_value, result)
        return result
