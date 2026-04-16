import os
import socket

from pymongo import MongoClient
from pymongo.errors import PyMongoError


_CLIENT = None
_CONNECTED_HOST = None
_DATABASE_NAME = None

_LOCAL_DATABASE_CANDIDATES = (
    "TeamManagements",
    "acme_team_mgmt",
    "coding_workshop",
)


def _is_local():
    return os.environ.get("IS_LOCAL", "true").lower() == "true"


def _can_resolve(host, port):
    try:
        socket.getaddrinfo(host, int(port), type=socket.SOCK_STREAM)
        return True
    except OSError:
        return False


def _mongo_config():
    return {
        "host": os.environ.get("MONGO_HOST") or "localhost",
        "port": os.environ.get("MONGO_PORT") or "27017",
        "user": os.environ.get("MONGO_USER") or "",
        "password": os.environ.get("MONGO_PASS") or "",
    }


def _mongo_host_candidates():
    config = _mongo_config()
    candidates = [config["host"]]

    if _is_local():
        candidates.extend(["172.17.0.1", "host.docker.internal", "localhost"])

    ordered = []
    seen = set()
    for host in candidates:
        if host in seen:
            continue
        seen.add(host)
        if host == config["host"] or _can_resolve(host, config["port"]):
            ordered.append(host)

    return ordered


def _build_mongo_uri(host):
    config = _mongo_config()
    user = config["user"]
    password = config["password"]
    auth = ""

    if user and password:
        auth = f"{user}:{password}@"

    if _is_local():
        return f"mongodb://{auth}{host}:{config['port']}/"

    return (
        f"mongodb://{auth}{host}:{config['port']}/"
        "?tls=true&tlsAllowInvalidCertificates=true&retryWrites=false"
    )


def _connection_uris_for_host(host):
    config = _mongo_config()
    if not _is_local():
        return [_build_mongo_uri(host)]

    uris = [f"mongodb://{host}:{config['port']}/"]

    if config["user"] and config["password"]:
        uris.append(_build_mongo_uri(host))

    return uris


def get_db_connection():
    global _CLIENT, _CONNECTED_HOST

    if _CLIENT is not None:
        return _CLIENT

    errors = []
    for host in _mongo_host_candidates():
        for uri in _connection_uris_for_host(host):
            try:
                client = MongoClient(uri, serverSelectionTimeoutMS=2000)
                client.admin.command("ping")
                _CLIENT = client
                _CONNECTED_HOST = host
                return _CLIENT
            except PyMongoError as exc:
                errors.append(f"{uri}: {exc}")

    raise RuntimeError("MongoDB connection failed: " + "; ".join(errors))


def get_database_name():
    global _DATABASE_NAME

    if _DATABASE_NAME is not None:
        return _DATABASE_NAME

    requested_name = os.environ.get("MONGO_NAME")
    if not _is_local():
        _DATABASE_NAME = requested_name or "acme_team_mgmt"
        return _DATABASE_NAME

    client = get_db_connection()
    available = set(client.list_database_names())

    for candidate in (requested_name, *_LOCAL_DATABASE_CANDIDATES):
        if candidate and candidate in available:
            _DATABASE_NAME = candidate
            return _DATABASE_NAME

    _DATABASE_NAME = requested_name or _LOCAL_DATABASE_CANDIDATES[0]
    return _DATABASE_NAME


def get_database():
    return get_db_connection()[get_database_name()]


def get_connection_summary():
    config = _mongo_config()
    return {
        "name": get_database_name(),
        "host": _CONNECTED_HOST or config["host"],
        "port": config["port"],
        "isLocal": _is_local(),
    }
