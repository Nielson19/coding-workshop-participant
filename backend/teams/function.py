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


def _team_selector(body):
    if body.get("_id"):
        try:
            return {"_id": ObjectId(body["_id"])}
        except InvalidId as exc:
            raise ValueError("Invalid '_id' value") from exc
    if body.get("id") is not None:
        return {"id": _parse_int(body.get("id"), "id")}
    if body.get("teamId") is not None:
        return {"id": _parse_int(body.get("teamId"), "teamId")}
    if body.get("name"):
        return {"name": str(body["name"]).strip()}
    raise ValueError("Provide one of: '_id', 'id', 'teamId', or 'name'")


def _achievement_selector(body):
    if body.get("achievementObjectId"):
        try:
            return {"_id": ObjectId(body["achievementObjectId"])}
        except InvalidId as exc:
            raise ValueError("Invalid 'achievementObjectId' value") from exc
    if body.get("achievementId") is not None:
        return {"id": _parse_int(body.get("achievementId"), "achievementId")}
    if body.get("achievementTitle"):
        return {"title": str(body["achievementTitle"]).strip()}
    raise ValueError("Provide one of: 'achievementObjectId', 'achievementId', or 'achievementTitle'")


def _require_user(users_collection, individual_id, field_name):
    user = users_collection.find_one({"id": individual_id})
    if not user:
        raise ValueError(f"Unknown individual for '{field_name}': {individual_id}")
    return user


def _sorted_items(items):
    return sorted(items, key=lambda item: (item.get("id") is None, item.get("id"), item.get("name", "")))


def _build_payload(items=None, message="Teams API is running", extra=None):
    if items is None:
        collection = get_database()["teams"]
        items = [_serialize(document) for document in collection.find({})]

    payload = {
        "service": "teams",
        "message": message,
        "database": get_connection_summary(),
        "count": len(items),
        "items": _sorted_items(items),
    }
    if extra:
        payload.update(extra)
    return payload


def _get_team(body):
    collection = get_database()["teams"]
    team = collection.find_one(_team_selector(body))
    if not team:
        return _response(404, {"error": "Team not found"})

    item = _serialize(team)
    payload = _build_payload(
        items=[item],
        message="Team found",
        extra={"item": item},
    )
    return _response(200, payload)


def _create_team(body):
    database = get_database()
    teams = database["teams"]
    users = database["users"]

    required_fields = ["name", "description", "region"]
    missing_fields = [field for field in required_fields if not body.get(field)]
    if missing_fields:
        raise ValueError("Missing required fields: " + ", ".join(missing_fields))

    leader_id = None
    if body.get("leaderId") is not None:
        leader_id = _parse_int(body.get("leaderId"), "leaderId")
        _require_user(users, leader_id, "leaderId")

    member_ids = _parse_member_ids(body.get("memberIds"))
    for member_id in member_ids:
        _require_user(users, member_id, "memberIds")

    if leader_id is not None and leader_id not in member_ids:
        member_ids.insert(0, leader_id)

    team = {
        "id": _parse_int(body.get("id"), "id") if body.get("id") is not None else _next_numeric_id(teams),
        "name": str(body["name"]).strip(),
        "description": str(body["description"]).strip(),
        "region": str(body["region"]).strip(),
        "leaderId": leader_id,
        "memberIds": _format_member_ids(member_ids),
    }

    result = teams.insert_one(team)
    team["_id"] = str(result.inserted_id)
    return _response(201, {"message": "Team created", "team": team})


def _add_individual(body):
    database = get_database()
    teams = database["teams"]
    users = database["users"]

    team = teams.find_one(_team_selector(body))
    if not team:
        return _response(404, {"error": "Team not found"})

    individual_id = _parse_int(body.get("individualId"), "individualId")
    _require_user(users, individual_id, "individualId")

    member_ids = _parse_member_ids(team.get("memberIds"))
    if individual_id not in member_ids:
        member_ids.append(individual_id)

    update_fields = {"memberIds": _format_member_ids(member_ids)}
    if body.get("makeLeader"):
        update_fields["leaderId"] = individual_id

    teams.update_one({"_id": team["_id"]}, {"$set": update_fields})
    updated_team = teams.find_one({"_id": team["_id"]})
    return _response(200, {"message": "Individual added to team", "team": _serialize(updated_team)})


def _remove_individual(body):
    teams = get_database()["teams"]

    team = teams.find_one(_team_selector(body))
    if not team:
        return _response(404, {"error": "Team not found"})

    individual_id = _parse_int(body.get("individualId"), "individualId")
    member_ids = _parse_member_ids(team.get("memberIds"))
    if individual_id not in member_ids and team.get("leaderId") != individual_id:
        return _response(404, {"error": "Individual is not associated with this team"})

    member_ids = [member_id for member_id in member_ids if member_id != individual_id]
    update_fields = {"memberIds": _format_member_ids(member_ids)}
    if team.get("leaderId") == individual_id:
        update_fields["leaderId"] = None

    teams.update_one({"_id": team["_id"]}, {"$set": update_fields})
    updated_team = teams.find_one({"_id": team["_id"]})
    return _response(200, {"message": "Individual removed from team", "team": _serialize(updated_team)})


def _assign_achievement(body):
    database = get_database()
    teams = database["teams"]
    achievements = database["achievements"]

    team = teams.find_one(_team_selector(body))
    if not team:
        return _response(404, {"error": "Team not found"})

    achievement = achievements.find_one(_achievement_selector(body))
    if not achievement:
        return _response(404, {"error": "Achievement not found"})

    update_fields = {
        "ownerType": "Team",
        "ownerId": team["id"],
    }
    if body.get("awardedBy") is not None:
        update_fields["awardedBy"] = _parse_int(body.get("awardedBy"), "awardedBy")
    elif team.get("leaderId") is not None:
        update_fields["awardedBy"] = team["leaderId"]

    achievements.update_one({"_id": achievement["_id"]}, {"$set": update_fields})
    updated_achievement = achievements.find_one({"_id": achievement["_id"]})
    return _response(200, {
        "message": "Achievement assigned to team",
        "team": _serialize(team),
        "achievement": _serialize(updated_achievement),
    })


def _update_team(body):
    action = str(body.get("action", "")).strip().lower().replace("-", "_").replace(" ", "_")

    if action == "add_individual":
        return _add_individual(body)
    if action == "remove_individual":
        return _remove_individual(body)
    if action == "assign_achievement":
        return _assign_achievement(body)
    if action in {"remove_team", "delete_team", "remove", "delete"}:
        return _delete_team(body)

    raise ValueError(
        "Unsupported action. Use one of: add_individual, remove_individual, assign_achievement, remove_team"
    )


def _delete_team(body):
    database = get_database()
    teams = database["teams"]
    achievements = database["achievements"]

    team = teams.find_one(_team_selector(body))
    if not team:
        return _response(404, {"error": "Team not found"})

    teams.delete_one({"_id": team["_id"]})
    unassigned = achievements.update_many(
        {"ownerType": "Team", "ownerId": team["id"]},
        {"$set": {"ownerType": "Unassigned", "ownerId": None}},
    )

    return _response(200, {
        "message": "Team removed",
        "team": _serialize(team),
        "updatedAchievements": unassigned.modified_count,
    })


def handler(event=None, context=None):
    event = event or {}
    method = _method(event)

    try:
        if method == "GET":
            request_data = _request_data(event)

            if any(request_data.get(field) not in (None, "") for field in ("_id", "id", "teamId", "name")):
                return _get_team(request_data)

            return _response(200, _build_payload())

        if method == "POST":
            return _create_team(_request_data(event))

        if method == "PUT":
            return _update_team(_request_data(event))

        if method == "DELETE":
            return _delete_team(_request_data(event))

        return _response(405, {"error": f"Unsupported method: {method}"})
    except ValueError as exc:
        return _response(400, {"error": str(exc)})
    except Exception as exc:
        return _response(500, {"error": str(exc)})
