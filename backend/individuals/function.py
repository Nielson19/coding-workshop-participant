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


def _parse_member_ids(value):
    if value in (None, "", []):
        return []
    if isinstance(value, list):
        return [int(item) for item in value]
    return [int(item.strip()) for item in str(value).split(",") if item.strip()]


def _format_member_ids(member_ids):
    return ",".join(str(member_id) for member_id in member_ids)


def _selector_from_body(body):
    if body.get("_id"):
        try:
            return {"_id": ObjectId(body["_id"])}
        except InvalidId as exc:
            raise ValueError("Invalid '_id' value") from exc
    if body.get("id") is not None:
        return {"id": _parse_int(body.get("id"), "id")}
    if body.get("email"):
        return {"email": str(body["email"]).strip()}
    raise ValueError("Provide one of: '_id', 'id', or 'email'")


def _sorted_items(items):
    return sorted(items, key=lambda item: (item.get("id") is None, item.get("id"), item.get("name", "")))


def _build_payload(items=None, message="Individuals API is running", extra=None):
    if items is None:
        collection = get_database()["users"]
        items = [_serialize(document) for document in collection.find({})]

    payload = {
        "service": "individuals",
        "message": message,
        "database": get_connection_summary(),
        "count": len(items),
        "items": _sorted_items(items),
    }
    if extra:
        payload.update(extra)
    return payload


def _get_individual(body):
    collection = get_database()["users"]
    individual = collection.find_one(_selector_from_body(body))
    if not individual:
        return _response(404, {"error": "Individual not found"})

    item = _serialize(individual)
    payload = _build_payload(
        items=[item],
        message="Individual found",
        extra={"item": item},
    )
    return _response(200, payload)


def _get_individuals_by_team(body):
    database = get_database()
    teams = database["teams"]
    users = database["users"]

    team_id = _parse_int(body.get("teamId"), "teamId")
    team = teams.find_one({"id": team_id})
    if not team:
        return _response(404, {"error": "Team not found"})

    member_ids = set(_parse_member_ids(team.get("memberIds")))
    items = [
        _serialize(document)
        for document in users.find({})
        if document.get("id") in member_ids
    ]

    payload = _build_payload(
        items=items,
        message="Individuals for team retrieved",
        extra={"team": _serialize(team)},
    )
    return _response(200, payload)


def _create_individual(body):
    collection = get_database()["users"]

    required_fields = ["name", "email", "password", "role", "region"]
    missing_fields = [field for field in required_fields if not body.get(field)]
    if missing_fields:
        raise ValueError("Missing required fields: " + ", ".join(missing_fields))

    if collection.find_one({"email": body["email"]}):
        raise ValueError(f"Individual with email '{body['email']}' already exists")

    individual = {
        "id": _parse_int(body.get("id"), "id") if body.get("id") is not None else _next_numeric_id(collection),
        "name": str(body["name"]).strip(),
        "email": str(body["email"]).strip(),
        "password": str(body["password"]),
        "role": str(body["role"]).strip(),
        "region": str(body["region"]).strip(),
    }

    result = collection.insert_one(individual)
    individual["_id"] = str(result.inserted_id)
    return _response(201, {"message": "Individual created", "individual": individual})


def _delete_individual(body):
    database = get_database()
    users = database["users"]
    teams = database["teams"]

    selector = _selector_from_body(body)
    individual = users.find_one(selector)
    if not individual:
        return _response(404, {"error": "Individual not found"})

    users.delete_one({"_id": individual["_id"]})

    touched_teams = 0
    for team in teams.find({}):
        member_ids = _parse_member_ids(team.get("memberIds"))
        update_fields = {}

        if individual["id"] in member_ids:
            member_ids = [member_id for member_id in member_ids if member_id != individual["id"]]
            update_fields["memberIds"] = _format_member_ids(member_ids)

        if team.get("leaderId") == individual["id"]:
            update_fields["leaderId"] = None

        if update_fields:
            teams.update_one({"_id": team["_id"]}, {"$set": update_fields})
            touched_teams += 1

    return _response(200, {
        "message": "Individual removed",
        "individual": _serialize(individual),
        "affectedTeams": touched_teams,
    })


def _update_individual(body):
    action = str(body.get("action", "")).strip().lower().replace("-", "_").replace(" ", "_")

    if action in {"remove", "remove_individual", "delete", "delete_individual"}:
        return _delete_individual(body)

    raise ValueError("Unsupported action. Use one of: remove_individual, delete_individual")


def handler(event=None, context=None):
    event = event or {}
    method = _method(event)

    try:
        if method == "GET":
            request_data = _request_data(event)

            if request_data.get("teamId") is not None:
                return _get_individuals_by_team(request_data)

            if any(request_data.get(field) not in (None, "") for field in ("_id", "id", "email")):
                return _get_individual(request_data)

            return _response(200, _build_payload())

        if method == "POST":
            return _create_individual(_request_data(event))

        if method == "PUT":
            return _update_individual(_request_data(event))

        if method == "DELETE":
            return _delete_individual(_request_data(event))

        return _response(405, {"error": f"Unsupported method: {method}"})
    except ValueError as exc:
        return _response(400, {"error": str(exc)})
    except Exception as exc:
        return _response(500, {"error": str(exc)})
