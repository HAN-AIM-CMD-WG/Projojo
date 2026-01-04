import uuid


# TODO: replace with UUID v7
def generate_uuid() -> str:
    """
    Generate a new UUID v4 as a string.

    This function provides a centralized way to generate UUIDs across the application,
    making it easy to change the UUID generation strategy if needed in the future.

    Returns:
        str: A new UUID v4 as a string
    """
    return str(uuid.uuid4())
