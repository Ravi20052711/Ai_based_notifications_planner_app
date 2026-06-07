from fastapi import HTTPException, status

class AppException(Exception):
    """Base class for all custom application exceptions."""
    def __init__(self, message: str, status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class ResourceNotFound(AppException):
    def __init__(self, resource: str, identifier: any):
        super().__init__(
            f"{resource} with id '{identifier}' not found.",
            status.HTTP_404_NOT_FOUND
        )

class UnauthorizedAccess(AppException):
    def __init__(self, detail: str = "Unauthorized access"):
        super().__init__(detail, status.HTTP_401_UNAUTHORIZED)

class AIProviderError(AppException):
    def __init__(self, detail: str):
        super().__init__(f"AI Service Error: {detail}", status.HTTP_502_BAD_GATEWAY)

class ValidationException(AppException):
    def __init__(self, detail: str):
        super().__init__(detail, status.HTTP_422_UNPROCESSABLE_ENTITY)
