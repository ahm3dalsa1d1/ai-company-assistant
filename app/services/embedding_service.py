from math import sqrt

from openai import OpenAI

from app.core.config import settings


client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=settings.openrouter_api_key
)


def generate_embedding(
    text: str
) -> list[float]:

    response = client.embeddings.create(
        model=settings.embedding_model,
        input=text
    )

    return response.data[0].embedding


def cosine_similarity(
    vector_a: list[float],
    vector_b: list[float]
) -> float:

    if len(vector_a) != len(vector_b):
        raise ValueError(
            "Vectors must have the same dimensions"
        )

    dot_product = sum(
        a * b
        for a, b in zip(vector_a, vector_b)
    )

    magnitude_a = sqrt(
        sum(a * a for a in vector_a)
    )

    magnitude_b = sqrt(
        sum(b * b for b in vector_b)
    )

    if magnitude_a == 0 or magnitude_b == 0:
        return 0.0

    return dot_product / (
        magnitude_a * magnitude_b
    )