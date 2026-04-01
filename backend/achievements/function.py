import os
from typing import Any
from urllib.parse import quote_plus

from fastapi import FastAPI, HTTPException, Query
from mangum import Mangum
from pymongo import MongoClient
from pymongo.errors import PyMongoError

SERVICE_NAME = "achievements"
COLLECTION_NAME = "achievements"

app = FastAPI(title="Achievements API", version="1.0.0")
_client: MongoClient | None = None


def is_local_environment() -> bool:
    return os.getenv("IS_LOCAL", "false").lower() == "true"


def get_database_name() -> str:
    database_name = os.getenv("MONGO_NAME")
    if database_name:
        return database_name

    app_name = os.getenv("APP_NAME")
    if app_name:
        return app_name.replace("-", "_")

    return "coding_workshop"


def build_mongo_uri(include_credentials: bool) -> str:
    host = os.getenv("MONGO_HOST", "localhost")
    port = os.getenv("MONGO_PORT", "27017")
    database_name = quote_plus(get_database_name())
    username = os.getenv("MONGO_USER", "")
    password = os.getenv("MONGO_PASS", "")

    auth = ""
    if include_credentials and username and password:
        auth = f"{quote_plus(username)}:{quote_plus(password)}@"

    uri = f"mongodb://{auth}{host}:{port}/{database_name}"
    options = ["retryWrites=false"]

    if is_local_environment():
        if include_credentials and username and password:
            options.append("authSource=admin")
    else:
        options.extend(["tls=true", "tlsAllowInvalidCertificates=true"])

    return f"{uri}?{'&'.join(options)}"


def get_client() -> MongoClient:
    global _client

    if _client is not None:
        return _client

    connection_attempts = [False, True] if is_local_environment() else [True]
    last_error: Exception | None = None

    for include_credentials in connection_attempts:
        try:
            client = MongoClient(
                build_mongo_uri(include_credentials),
                serverSelectionTimeoutMS=5000,
            )
            client.admin.command("ping")
            _client = client
            return client
        except PyMongoError as exc:
            last_error = exc

    raise HTTPException(
        status_code=500,
        detail=f"MongoDB connection failed: {last_error}",
    )


def serialize_value(value: Any) -> Any:
    if isinstance(value, dict):
        return {key: serialize_value(item) for key, item in value.items()}
    if isinstance(value, list):
        return [serialize_value(item) for item in value]
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def fetch_documents(limit: int) -> list[dict[str, Any]]:
    try:
        collection = get_client()[get_database_name()][COLLECTION_NAME]
        documents = list(collection.find().limit(limit))
        return [serialize_value(document) for document in documents]
    except PyMongoError as exc:
        raise HTTPException(status_code=500, detail=f"MongoDB query failed: {exc}") from exc


@app.get("/")
def read_achievements(limit: int = Query(default=20, ge=1, le=100)) -> dict[str, Any]:
    documents = fetch_documents(limit)
    return {
        "service": SERVICE_NAME,
        "message": "Achievements API is running",
        "database": {
            "name": get_database_name(),
            "host": os.getenv("MONGO_HOST", "localhost"),
            "port": os.getenv("MONGO_PORT", "27017"),
            "isLocal": is_local_environment(),
        },
        "count": len(documents),
        "items": documents,
    }


@app.get("/health")
def healthcheck() -> dict[str, str]:
    get_client().admin.command("ping")
    return {"status": "ok", "service": SERVICE_NAME}


handler = Mangum(app, lifespan="off")

if __name__ == "__main__":
    print(read_achievements())
