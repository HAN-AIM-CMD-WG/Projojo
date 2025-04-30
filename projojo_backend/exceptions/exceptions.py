class GenericException(Exception):
    def __init__(self, message="Application error", status_code=500):
        self.message = message
        self.status_code = status_code
        super().__init__(message)

class UnauthorizedException(GenericException):
    def __init__(self, item_class: type, message="Unauthorized"):
        class_name = item_class.__name__
        full_message = f"{class_name} authorization failed: {message}"
        super().__init__(message=full_message, status_code=402)

class ItemRetrievalException(GenericException):
    def __init__(self, item_class: type, message="Could not be found"):
        class_name = item_class.__name__
        full_message = f"{class_name} retrieval failed: {message}"
        super().__init__(message=full_message, status_code=500)