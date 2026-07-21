import re

THEME_NAME_VALIDATION_ERROR = "Naam is verplicht en mag maximaal 100 tekens zijn"
THEME_SDG_CODE_VALIDATION_ERROR = "Ongeldig SDG-code formaat. Gebruik bijv. 'SDG1' of 'SDG12,SDG4'"
THEME_COLOR_VALIDATION_ERROR = "Ongeldige kleurcode. Gebruik hex-formaat zoals '#4CAF50'"
THEME_ICON_VALIDATION_ERROR = "Icoon naam mag maximaal 50 tekens zijn"
THEME_DESCRIPTION_VALIDATION_ERROR = "Beschrijving mag maximaal 500 tekens zijn"
THEME_DISPLAY_ORDER_VALIDATION_ERROR = "Sorteervolgorde moet een positief geheel getal zijn"

def strip_markdown(text: str) -> str:
    """ Strips basic markdown syntax to count real character length """
    if not text:
        return ""

    # Remove code blocks
    text = re.sub(r'```[\s\S]*?```', '', text)
    # Remove images
    text = re.sub(r'!\[.*?\]\(.*?\)', '', text)
    # Remove links, keep text
    text = re.sub(r'\[([^\]]+)\]\(.*?\)', r'\1', text)
    # Remove headers
    text = re.sub(r'^\s*#+\s+', '', text, flags=re.MULTILINE)
    # Remove blockquotes
    text = re.sub(r'^\s*>\s+', '', text, flags=re.MULTILINE)
    # Remove list markers
    text = re.sub(r'^\s*(?:[\*\-]|\d+\.)\s+', '', text, flags=re.MULTILINE)
    # Remove bold/italic/code/strikethrough markers
    text = re.sub(r'[*_`~]', '', text)

    # Normalize newlines: collapse multiple newlines to single newline to match visual length
    text = re.sub(r'[\r\n]+', '\n', text)

    return text.strip()

def is_valid_length(text: str, max_length: int, strip_md: bool = False) -> bool:
    """
    Check if text is a minimum of 1 character and maximum of max_length characters.

    Optionally strips markdown before counting length.
    """
    if not text:
        return False

    if strip_md:
        text = strip_markdown(text)

    if not text.strip():
        return False

    return 1 <= len(text.strip()) <= max_length


def validate_theme(theme, require_name: bool = False) -> None:
    if hasattr(theme, "model_fields_set"):
        fields_set = theme.model_fields_set
    else:
        fields_set = set(theme.__fields_set__)

    if (require_name or "name" in fields_set) and not is_valid_length(theme.name, 100):
        raise ValueError(THEME_NAME_VALIDATION_ERROR)

    # An empty sdg_code clears the (optional) SDG link, mirroring how an empty
    # icon/description clears those. Only a non-empty value is format-checked;
    # None still means "leave unchanged" on update.
    if "sdg_code" in fields_set and theme.sdg_code:
        if not re.fullmatch(r"SDG([1-9]|1[0-7])(,SDG([1-9]|1[0-7]))*", theme.sdg_code):
            raise ValueError(THEME_SDG_CODE_VALIDATION_ERROR)

    if "color" in fields_set and theme.color is not None:
        if not re.fullmatch(r"#[0-9A-Fa-f]{6}", theme.color):
            raise ValueError(THEME_COLOR_VALIDATION_ERROR)

    if "icon" in fields_set and theme.icon is not None and len(theme.icon) > 50:
        raise ValueError(THEME_ICON_VALIDATION_ERROR)

    if "description" in fields_set and theme.description is not None and len(theme.description) > 500:
        raise ValueError(THEME_DESCRIPTION_VALIDATION_ERROR)

    if "display_order" in fields_set and theme.display_order is not None:
        if type(theme.display_order) is not int or theme.display_order < 0:
            raise ValueError(THEME_DISPLAY_ORDER_VALIDATION_ERROR)
