class AppError(Exception):
    pass


class ResourceNotFoundError(AppError):
    pass


class PermissionDeniedError(AppError):
    pass


class ResourceConflictError(AppError):
    pass