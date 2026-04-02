import json
from db_setup import get_connection_summary, get_database


def handler(event=None, context=None):
    database = get_database()
    items = []

    for collection_name in sorted(database.list_collection_names()):
        items.append({
            "name": collection_name,
            "count": database[collection_name].count_documents({}),
        })

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({
            "service": "metadata",
            "message": "Metadata API is running",
            "database": get_connection_summary(),
            "count": len(items),
            "items": items,
        }, default=str),
    }
