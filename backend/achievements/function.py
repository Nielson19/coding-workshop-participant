import base64
import json
from urllib.parse import parse_qsl

from bson import ObjectId
from bson.errors import InvalidId

from db_setup import get_connection_summary, get_database


def _method(event):
    return (
        event.get("httpMethod")
        or event.get("requestContext", {}).get("http", {}).get("method")
        or "GET"
    ).upper()


def _request_data(event):
    payload = {}
    query_params = event.get("queryStringParameters") or {}
    if query_params:
        payload.update(query_params)
    raw_query_string = event.get("rawQueryString") or ""
    if raw_query_string:
        payload.update(dict(parse_qsl(raw_query_string, keep_blank_values=True)))

    body = event.get("body")
    if body:
        if event.get("isBase64Encoded"):
            body = base64.b64decode(body).decode("utf-8")
        parsed = json.loads(body)
        if not isinstance(parsed, dict):
            raise ValueError("Request body must be a JSON object")
        payload.update(parsed)

    return payload


def _response(status, body):
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body, default=str),
    }


def _serialize(document):
    item = dict(document)
    item["_id"] = str(item["_id"])
    return item


def _parse_int(value, field_name):
    try:
        return int(value)
    except (TypeError, ValueError):
        raise ValueError(f"'{field_name}' must be an integer")


def _next_numeric_id(collection):
    highest = 0
    for document in collection.find({}, {"id": 1}):
        value = document.get("id")
        if isinstance(value, int) and value > highest:
            highest = value
    return highest + 1


def _achievement_selector(body):
    if body.get("_id"):
        try:
            return {"_id": ObjectId(body["_id"])}
        except InvalidId as exc:
            raise ValueError("Invalid '_id' value") from exc
    if body.get("id") is not None:
        return {"id": _parse_int(body.get("id"), "id")}
    if body.get("title"):
        return {"title": str(body["title"]).strip()}
    raise ValueError("Provide one of: '_id', 'id', or 'title'")


def _sorted_items(items):
    return sorted(items, key=lambda item: (item.get("id") is None, item.get("id"), item.get("title", "")))


def _build_payload(items=None, message="Achievements API is running", extra=None):
    if items is None:
        collection = get_database()["achievements"]
        items = [_serialize(document) for document in collection.find({})]

    payload = {
        "service": "achievements",
        "message": message,
        "database": get_connection_summary(),
        "count": len(items),
        "items": _sorted_items(items),
    }
    if extra:
        payload.update(extra)
    return payload


def _individual_summary(individual):
    return {
        "id": individual.get("id"),
        "name": individual.get("name"),
        "email": individual.get("email"),
        "role": individual.get("role"),
        "region": individual.get("region"),
    }


def _is_individual_owner(document, individual_id):
    owner_id = document.get("ownerId")
    try:
        owner_id = int(owner_id)
    except (TypeError, ValueError):
        pass

    if owner_id != individual_id:
        return False

    owner_type = document.get("ownerType")
    if owner_type in (None, ""):
        return True

    return str(owner_type).strip().lower() in {"individual", "user", "member", "person"}


def _get_achievement(body):
    collection = get_database()["achievements"]
    achievement = collection.find_one(_achievement_selector(body))
    if not achievement:
        return _response(404, {"error": "Achievement not found"})

    item = _serialize(achievement)
    payload = _build_payload(
        items=[item],
        message="Achievement found",
        extra={"item": item},
    )
    return _response(200, payload)


def _get_achievements_by_individual(body):
    database = get_database()
    users = database["users"]
    achievements = database["achievements"]

    individual_id = _parse_int(body.get("individualId"), "individualId")
    individual = users.find_one({"id": individual_id})
    if not individual:
        return _response(404, {"error": "Individual not found"})

    items = [
        _serialize(document)
        for document in achievements.find({})
        if _is_individual_owner(document, individual_id)
    ]

    payload = _build_payload(
        items=items,
        message="Achievements for individual retrieved",
        extra={"individual": _individual_summary(individual)},
    )
    return _response(200, payload)


def _create_achievement(body):
    database = get_database()
    collection = database["achievements"]

    required_fields = ["title", "description", "points"]
    missing_fields = [field for field in required_fields if body.get(field) in (None, "")]
    if missing_fields:
        raise ValueError("Missing required fields: " + ", ".join(missing_fields))

    achievement = {
        "id": _parse_int(body.get("id"), "id") if body.get("id") is not None else _next_numeric_id(collection),
        "title": str(body["title"]).strip(),
        "description": str(body["description"]).strip(),
        "points": _parse_int(body.get("points"), "points"),
        "ownerType": str(body.get("ownerType", "Unassigned")).strip(),
        "ownerId": _parse_int(body.get("ownerId"), "ownerId") if body.get("ownerId") is not None else None,
        "awardedBy": _parse_int(body.get("awardedBy"), "awardedBy") if body.get("awardedBy") is not None else None,
    }

    result = collection.insert_one(achievement)
    achievement["_id"] = str(result.inserted_id)
    return _response(201, {"message": "Achievement created", "achievement": achievement})


def _delete_achievement(body):
    collection = get_database()["achievements"]
    achievement = collection.find_one(_achievement_selector(body))
    if not achievement:
        return _response(404, {"error": "Achievement not found"})

    collection.delete_one({"_id": achievement["_id"]})
    return _response(200, {"message": "Achievement removed", "achievement": _serialize(achievement)})


def _update_achievement(body):
    action = str(body.get("action", "")).strip().lower().replace("-", "_").replace(" ", "_")

    if action in {"remove", "remove_achievement", "delete", "delete_achievement"}:
        return _delete_achievement(body)

    raise ValueError("Unsupported action. Use one of: remove_achievement, delete_achievement")


def handler(event=None, context=None):
    event = event or {}
    method = _method(event)

    try:
        if method == "GET":
            request_data = _request_data(event)

            if request_data.get("individualId") is not None:
                return _get_achievements_by_individual(request_data)

            if any(request_data.get(field) not in (None, "") for field in ("_id", "id", "title")):
                return _get_achievement(request_data)

            return _response(200, _build_payload())

        if method == "POST":
            return _create_achievement(_request_data(event))

        if method == "PUT":
            return _update_achievement(_request_data(event))

        if method == "DELETE":
            return _delete_achievement(_request_data(event))

        return _response(405, {"error": f"Unsupported method: {method}"})
    except ValueError as exc:
        return _response(400, {"error": str(exc)})
    except Exception as exc:
        return _response(500, {"error": str(exc)})
