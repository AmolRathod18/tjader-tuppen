from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query

from ..auth import require_admin
from ..repository import rows

router = APIRouter(prefix="/api", dependencies=[Depends(require_admin)], tags=["Dashboard and Reports"])


def filtered_entries(date_from: date, date_to: date, employee_id: str | None, company_id: str | None, project_id: str | None):
    entries = rows("work_entries")
    return [entry for entry in entries if date_from.isoformat() <= entry["date"] <= date_to.isoformat()
            and (not employee_id or entry["employee_id"] == employee_id)
            and (not company_id or entry["company_id"] == company_id)
            and (not project_id or entry["project_id"] == project_id)]


def hours(entries):
    return round(sum(entry_hours(item)["weekly_hours"] for item in entries), 2)


def entry_hours(entry):
    normal = float(entry.get("normal_hours") if entry.get("normal_hours") is not None else entry.get("hours") or 0)
    overtime = float(entry.get("normal_overtime") or 0)
    weekend = float(entry.get("weekend_overtime") or 0)
    return {
        "normal_hours": round(normal, 2),
        "normal_overtime": round(overtime, 2),
        "weekend_overtime": round(weekend, 2),
        "weekly_hours": round(normal + overtime + weekend, 2),
    }


@router.get("/dashboard")
def dashboard():
    entries = rows("work_entries")
    today = date.today().isoformat()
    recent = sorted(entries, key=lambda item: (item["date"], item.get("created_at", "")), reverse=True)[:5]
    days = []
    for offset in range(6, -1, -1):
        day = date.today() - timedelta(days=offset)
        day_entries = [item for item in entries if item["date"] == day.isoformat()]
        day_totals = totals(day_entries)
        days.append({"date": day.isoformat(), **day_totals, "hours": day_totals["weekly_hours"], "entries": len(day_entries)})
    return {
        "total_clients": len(rows("companies")),
        "active_projects": len([p for p in rows("projects") if p["status"] == "Active"]),
        "total_employees": len(rows("employees")),
        "today_work_entries": len([e for e in entries if e["date"] == today]),
        "total_logged_hours": hours(entries),
        **totals(entries),
        "recent_work_entries": recent,
        "last_7_days": days,
    }


@router.get("/reports")
def report(
    date_from: date, date_to: date,
    employee_id: str | None = None, company_id: str | None = None, project_id: str | None = None,
):
    entries = filtered_entries(date_from, date_to, employee_id, company_id, project_id)
    return {
        "date_from": date_from,
        "date_to": date_to,
        "entries": entries,
        "total_hours": hours(entries),
        **totals(entries),
        "employee_hours": _group(entries, "employee_id"),
        "client_hours": _group(entries, "company_id"),
        "project_hours": _group(entries, "project_id"),
    }


def _group(entries, key):
    result = {}
    for entry in entries:
        result[entry[key]] = round(result.get(entry[key], 0) + entry_hours(entry)["weekly_hours"], 2)
    return result


def totals(entries):
    result = {"normal_hours": 0, "normal_overtime": 0, "weekend_overtime": 0}
    for entry in entries:
        values = entry_hours(entry)
        for key in result:
            result[key] += values[key]
    result["weekly_hours"] = round(sum(result.values()), 2)
    return {key: round(value, 2) for key, value in result.items()}
