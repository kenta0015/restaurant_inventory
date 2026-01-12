# Path: app/main.py
from fastapi import FastAPI

app = FastAPI(
    title="Restaurant Inventory Mini API",
    version="0.1.0",
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
