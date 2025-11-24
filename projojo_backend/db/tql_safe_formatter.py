import re
from datetime import datetime

PLACEHOLDER_PATTERN = re.compile(r'@([a-zA-Z_][a-zA-Z0-9_]*)')

class TQLSafeFormatter:
    # Security limits
    MAX_STRING_LENGTH = 10_000
    MAX_PLACEHOLDER_NAME_LENGTH = 100

    @staticmethod
    def build_query(template: str, params: dict) -> str:
        # Extract placeholders in template (find ALL occurrences)
        placeholder_matches = PLACEHOLDER_PATTERN.findall(template)
        placeholders = set(placeholder_matches)

        # 1. Validate placeholder names length
        for placeholder in placeholders:
            if len(placeholder) > TQLSafeFormatter.MAX_PLACEHOLDER_NAME_LENGTH:
                raise ValueError(f"Placeholder name too long: {placeholder} ({len(placeholder)} > {TQLSafeFormatter.MAX_PLACEHOLDER_NAME_LENGTH})")

        # 2. Check that each placeholder appears exactly once
        from collections import Counter
        placeholder_counts = Counter(placeholder_matches)
        duplicates = {name: count for name, count in placeholder_counts.items() if count > 1}
        if duplicates:
            raise ValueError(f"Placeholders must appear exactly once in template. Duplicates found: {duplicates}")

        # 3. Check that all placeholders have corresponding params and no extra params
        missing = placeholders - params.keys()
        extra = params.keys() - placeholders
        if missing:
            raise ValueError(f"Missing parameters for placeholders: {missing}")
        if extra:
            raise ValueError(f"Unused parameters in dict: {extra}")

        # 4. Replace each placeholder with safely formatted value
        def _escape_value(value):
            # Reject None/NULL values explicitly
            if value is None:
                raise ValueError("None/NULL values not supported. Use explicit handling in your query.")

            # Boolean check must come before int check (bool is subclass of int in Python)
            if isinstance(value, bool):
                return "true" if value else "false"

            # String escaping with proper backslash handling
            if isinstance(value, str):
                # Length validation (DoS prevention)
                if len(value) > TQLSafeFormatter.MAX_STRING_LENGTH:
                    raise ValueError(f"String too long: {len(value)} > {TQLSafeFormatter.MAX_STRING_LENGTH}")

                # Unicode validation - allow common European characters but block dangerous ones
                # Allow: Latin-1 Supplement (À-ÿ), includes Dutch é, ë, ï, etc.
                # Block: Dangerous homoglyphs, zero-width chars, but allow control chars that will be escaped
                for c in value:
                    code = ord(c)
                    # Allow ASCII printable (32-126)
                    if 32 <= code <= 126:
                        continue
                    # Allow common European characters (Latin-1 Supplement: 160-255)
                    # Includes: À Á Â Ã Ä Å Æ Ç È É Ê Ë Ì Í Î Ï Ñ Ò Ó Ô Õ Ö Ø Ù Ú Û Ü Ý à á â ã ä å æ ç è é ê ë ì í î ï ñ ò ó ô õ ö ø ù ú û ü ý ÿ
                    if 160 <= code <= 255:
                        continue
                    # Allow common control characters that will be escaped: \n (10), \r (13), \t (9)
                    if code in (9, 10, 13):
                        continue
                    # Block everything else (homoglyphs, zero-width, Cyrillic, Greek, etc.)
                    raise ValueError(f"Character not allowed: '{c}' (U+{code:04X}). Only ASCII, common European characters (À-ÿ), and newlines/tabs are supported.")

                # CRITICAL: Escape backslashes FIRST, then quotes (both " and ')
                escaped = value.replace('\\', '\\\\').replace('"', '\\"').replace("'", "\\'")
                # Escape control characters to prevent multi-line injection
                escaped = escaped.replace('\n', '\\n').replace('\r', '\\r').replace('\t', '\\t')
                return '"' + escaped + '"'

            # DateTime handling
            if isinstance(value, datetime):
                return value.strftime("%Y-%m-%dT%H:%M:%S.%f+0000")

            # Float validation - reject Infinity and NaN
            if isinstance(value, float):
                if not (float('-inf') < value < float('inf')):
                    raise ValueError(f"Invalid float value: {value}. Infinity and NaN not supported.")
                return str(value)

            # Integer validation - check bounds (TypeQL likely uses 64-bit integers)
            if isinstance(value, int):
                MAX_INT = 2**63 - 1
                MIN_INT = -(2**63)
                if not (MIN_INT <= value <= MAX_INT):
                    raise ValueError(f"Integer out of bounds: {value} (must be between {MIN_INT} and {MAX_INT})")
                return str(value)

            # Reject unsupported types explicitly
            raise ValueError(f"Unsupported type {type(value).__name__} for value {value}. "
                        f"Supported types: str, bool, int, float, datetime")

        # Sort parameters by key length (longest first) to prevent partial replacement
        # Example: @userName before @user
        result = template
        for key in sorted(params.keys(), key=len, reverse=True):
            value = params[key]
            escaped_value = _escape_value(value)
            placeholder = f'@{key}'
            result = result.replace(placeholder, escaped_value)
        return result
