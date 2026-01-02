from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import FileResponse
import os

class FallbackStaticFiles(StaticFiles):
    def __init__(self, directory: str, default_file: str, **kwargs):
        super().__init__(directory=directory, **kwargs)
        self.default_file = default_file

    async def get_response(self, path: str, scope):
        try:
            response = await super().get_response(path, scope)
            if response.status_code == 404:
                raise StarletteHTTPException(status_code=404)
            return response
        except StarletteHTTPException as e:
            if e.status_code == 404:
                if os.path.exists(self.default_file):
                    return FileResponse(self.default_file)
            raise e
