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
    text = re.sub(r'^#+\s+', '', text, flags=re.MULTILINE)
    # Remove blockquotes
    text = re.sub(r'^>\s+', '', text, flags=re.MULTILINE)
    # Remove list markers
    text = re.sub(r'^[\*\-]\s+', '', text, flags=re.MULTILINE)
    # Remove bold/italic/code markers
    text = re.sub(r'[*_`]', '', text)

    return text.strip()
