from datetime import date, datetime, time
from typing import Any

from fastapi import HTTPException

from .db import get_supabase


def rows(table: str, query: dict[str, Any] | None = None) -> list[dict]:
    request = get_supabase().table(table).select("*")
    if query:
        for key, value in query.items():
            request = request.eq(key, value)
    return request.execute().data or []


def one(table: str, item_id: str) -> dict:
    result = get_supabase().table(table).select("*").eq("id", item_id).maybe_single().execute()
    if not result.data:
        raise HTTPException(404, f"{table.rstrip('s').capitalize()} not found")
    return result.data


def insert(table: str, data: dict) -> dict:
    result = get_supabase().table(table).insert(data).execute()
    return result.data[0]


def update(table: str, item_id: str, data: dict) -> dict:
    result = get_supabase().table(table).update(data).eq("id", item_id).execute()
    if not result.data:
        raise HTTPException(404, f"{table.rstrip('s').capitalize()} not found")
    return result.data[0]


def remove(table: str, item_id: str) -> None:
    result = get_supabase().table(table).delete().eq("id", item_id).execute()
    if not result.data:
        raise HTTPException(404, f"{table.rstrip('s').capitalize()} not found")


def serialise(value: Any) -> Any:
    if isinstance(value, (date, time, datetime)):
        return value.isoformat()
    if isinstance(value, dict):
        return {key: serialise(item) for key, item in value.items()}
    if isinstance(value, list):
        return [serialise(item) for item in value]
    return value
