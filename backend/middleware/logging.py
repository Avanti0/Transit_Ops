from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
import time
import logging

logger = logging.getLogger("transitops.requests")

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that logs incoming HTTP requests and their processing times.
    """
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        method = request.method
        path = request.url.path
        client_host = request.client.host if request.client else "unknown"
        
        logger.info(f"Incoming request: {method} {path} from {client_host}")
        
        try:
            response = await call_next(request)
            process_time = (time.time() - start_time) * 1000
            
            logger.info(
                f"Completed response: {method} {path} with status {response.status_code} "
                f"processed in {process_time:.2f}ms"
            )
            return response
            
        except Exception as exc:
            process_time = (time.time() - start_time) * 1000
            logger.error(
                f"Failed request: {method} {path} threw {type(exc).__name__} "
                f"after {process_time:.2f}ms"
            )
            raise exc
