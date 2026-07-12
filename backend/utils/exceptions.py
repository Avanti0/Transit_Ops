from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import logging

logger = logging.getLogger("transitops.exceptions")

class TransitOpsException(Exception):
    """
    Base exception class for all custom errors in TransitOps.
    """
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(message)
        self.message = message
        self.status_code = status_code

class EntityNotFoundException(TransitOpsException):
    """
    Exception raised when a requested resource is not found in the database.
    """
    def __init__(self, message: str):
        super().__init__(message, status_code=status.HTTP_404_NOT_FOUND)

class BusinessRuleException(TransitOpsException):
    """
    Exception raised when a business constraint or validation check fails.
    """
    def __init__(self, message: str):
        super().__init__(message, status_code=status.HTTP_400_BAD_REQUEST)

class ValidationException(TransitOpsException):
    """
    Exception raised when request payload validation fails.
    """
    def __init__(self, message: str):
        super().__init__(message, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)

class UnauthorizedException(TransitOpsException):
    """
    Exception raised when authentication fails or resource access is unauthorized.
    """
    def __init__(self, message: str):
        super().__init__(message, status_code=status.HTTP_401_UNAUTHORIZED)


def register_exception_handlers(app: FastAPI):
    """
    Registers custom global exception handlers for standardized error responses.
    """
    @app.exception_handler(TransitOpsException)
    async def transitops_exception_handler(request: Request, exc: TransitOpsException):
        logger.warning(f"TransitOpsException: {exc.message} on request {request.method} {request.url.path}")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "detail": exc.message
            }
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        # Format the Pydantic/FastAPI validation errors into a clean string
        errors = exc.errors()
        error_messages = []
        for err in errors:
            loc = " -> ".join([str(x) for x in err.get("loc", [])])
            msg = err.get("msg", "Validation error")
            error_messages.append(f"{loc}: {msg}")
            
        formatted_message = "; ".join(error_messages)
        logger.warning(f"ValidationError: {formatted_message} on request {request.method} {request.url.path}")
        
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "detail": formatted_message,
                "errors": errors
            }
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        logger.exception(f"Unhandled server error occurred on request {request.method} {request.url.path}: {str(exc)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "detail": "An unexpected server error occurred. Please contact administrator."
            }
        )
