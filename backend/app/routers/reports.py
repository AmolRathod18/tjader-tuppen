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
    return round(sum(float(item.get("hours") or 0) for item in entries), 2)


@router.get("/dashboard")
def dashboard():
    entries = rows("work_entries")
    today = date.today().isoformat()
    recent = sorted(entries, key=lambda item: (item["date"], item.get("created_at", "")), reverse=True)[:5]
    days = []
    for offset in range(6, -1, -1):
        day = date.today() - timedelta(days=offset)
        day_entries = [item for item in entries if item["date"] == day.isoformat()]
        days.append({"date": day.isoformat(), "hours": hours(day_entries), "entries": len(day_entries)})
    return {
        "total_clients": len(rows("companies")),
        "active_projects": len([p for p in rows("projects") if p["status"] == "Active"]),
        "total_employees": len(rows("employees")),
        "today_work_entries": len([e for e in entries if e["date"] == today]),
        "total_logged_hours": hours(entries),
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
        "employee_hours": _group(entries, "employee_id"),
        "client_hours": _group(entries, "company_id"),
        "project_hours": _group(entries, "project_id"),
    }


def _group(entries, key):
    result = {}
    for entry in entries:
        result[entry[key]] = round(result.get(entry[key], 0) + float(entry.get("hours") or 0), 2)
    return result
