from pydantic import BaseModel, ConfigDict, Field


class UserCreate(BaseModel):
    username: str
    email: str

    password: str = Field(
        min_length=8,
        max_length=128
    )


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    access_level: int

    model_config = ConfigDict(
        from_attributes=True
    )