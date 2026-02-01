import re

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