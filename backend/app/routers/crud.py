from datetime import datetime, timezone
from typing import Type

from fastapi import APIRouter, Depends, HTTPException, Query

from ..auth import require_admin
from ..repository import insert, one, remove, rows, serialise, update
from ..schemas import (
    AssignmentCreate, CompanyCreate, CompanyUpdate, EmployeeCreate, EmployeeUpdate,
    ProjectCreate, ProjectUpdate, WorkEntryCreate, WorkEntryUpdate,
    WorkHistoryCreate,
    ExpenditureCreate, ExpenditureUpdate,
)

router = APIRouter(prefix="/api", dependencies=[Depends(require_admin)])


def payload(model):
    return {key: serialise(value) for key, value in model.model_dump(exclude_none=True).items()}


def collection_router(path: str, table: str, create_schema: Type, update_schema: Type):
    route = APIRouter(prefix=f"/{path}", tags=[path.title()])

    @route.get("")
    def list_items():
        return rows(table)

    @route.post("", status_code=201)
    def create_item(item: create_schema):
        data = payload(item)
        data["created_at"] = datetime.now(timezone.utc).isoformat()
        return insert(table, data)

    @route.get("/{item_id}")
    def get_item(item_id: str):
        return one(table, item_id)

    @route.patch("/{item_id}")
    def update_item(item_id: str, item: update_schema):
        return update(table, item_id, payload(item))

    @route.delete("/{item_id}", status_code=204)
    def delete_item(item_id: str):
        remove(table, item_id)

    router.include_router(route)


collection_router("companies", "companies", CompanyCreate, CompanyUpdate)
collection_router("employees", "employees", EmployeeCreate, EmployeeUpdate)


project_routes = APIRouter(prefix="/projects", tags=["Projects"])


@project_routes.get("")
def list_projects():
    return rows("projects")


@project_routes.post("", status_code=201)
def create_project(item: ProjectCreate):
    data = payload(item)
    data["created_at"] = datetime.now(timezone.utc).isoformat()
    return insert("projects", data)


@project_routes.get("/{item_id}")
def get_project(item_id: str):
    return one("projects", item_id)


@project_routes.patch("/{item_id}")
def update_project(item_id: str, item: ProjectUpdate):
    current = one("projects", item_id)
    data = {**current, **payload(item)}
    if data["end_date"] < data["start_date"]:
        raise HTTPException(422, "end_date must not be before start_date")
    for key in ("id", "created_at", "updated_at"):
        data.pop(key, None)
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    return update("projects", item_id, data)


@project_routes.delete("/{item_id}", status_code=204)
def delete_project(item_id: str):
    remove("projects", item_id)


router.include_router(project_routes)


expenditure_routes = APIRouter(prefix="/expenditures", tags=["Expenditures"])


def validate_expenditure(data: dict) -> dict:
    one("projects", data["project_id"])
    one("employees", data["employee_id"])
    return data


@expenditure_routes.get("")
def list_expenditures():
    return rows("expenditures")


@expenditure_routes.post("", status_code=201)
def create_expenditure(item: ExpenditureCreate):
    data = payload(item)
    data["created_at"] = datetime.now(timezone.utc).isoformat()
    return insert("expenditures", validate_expenditure(data))


@expenditure_routes.get("/{item_id}")
def get_expenditure(item_id: str):
    return one("expenditures", item_id)


@expenditure_routes.patch("/{item_id}")
def update_expenditure(item_id: str, item: ExpenditureUpdate):
    current = one("expenditures", item_id)
    data = {**current, **payload(item)}
    validate_expenditure(data)
    for key in ("id", "created_at", "updated_at"):
        data.pop(key, None)
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    return update("expenditures", item_id, data)


@expenditure_routes.delete("/{item_id}", status_code=204)
def delete_expenditure(item_id: str):
    remove("expenditures", item_id)


router.include_router(expenditure_routes)


@router.get("/assignments", tags=["Assignments"])
def list_assignments(employee_id: str | None = None, project_id: str | None = None):
    query = {key: value for key, value in {"employee_id": employee_id, "project_id": project_id}.items() if value}
    return rows("assignments", query)


@router.post("/assignments", status_code=201, tags=["Assignments"])
def create_assignment(item: AssignmentCreate):
    return insert("assignments", payload(item))


@router.delete("/assignments/{item_id}", status_code=204, tags=["Assignments"])
def delete_assignment(item_id: str):
    remove("assignments", item_id)


@router.get("/employees/{employee_id}/assignments", tags=["Assignments"])
def employee_assignments(employee_id: str):
    one("employees", employee_id)
    return rows("assignments", {"employee_id": employee_id})


@router.get("/projects/{project_id}/employees", tags=["Assignments"])
def project_employees(project_id: str):
    one("projects", project_id)
    assignments = rows("assignments", {"project_id": project_id})
    employee_ids = {item["employee_id"] for item in assignments}
    return [employee for employee in rows("employees") if employee["id"] in employee_ids]


@router.get("/employees/{employee_id}/work-history", tags=["Employee Work History"])
def list_work_history(employee_id: str):
    one("employees", employee_id)
    return rows("employee_work_history", {"employee_id": employee_id})


@router.post("/employees/{employee_id}/work-history", status_code=201, tags=["Employee Work History"])
def create_work_history(employee_id: str, item: WorkHistoryCreate):
    one("employees", employee_id)
    data = payload(item)
    data["employee_id"] = employee_id
    return insert("employee_work_history", data)


@router.patch("/employees/{employee_id}/work-history/{history_id}", tags=["Employee Work History"])
def update_work_history(employee_id: str, history_id: str, item: WorkHistoryCreate):
    one("employees", employee_id)
    history = one("employee_work_history", history_id)
    if history["employee_id"] != employee_id:
        raise HTTPException(404, "Work history not found for this employee")
    data = payload(item)
    data.pop("employee_id", None)
    return update("employee_work_history", history_id, data)


@router.delete("/employees/{employee_id}/work-history/{history_id}", status_code=204, tags=["Employee Work History"])
def delete_work_history(employee_id: str, history_id: str):
    one("employees", employee_id)
    history = one("employee_work_history", history_id)
    if history["employee_id"] != employee_id:
        raise HTTPException(404, "Work history not found for this employee")
    remove("employee_work_history", history_id)


def validate_work_entry(data: dict, ignore_id: str | None = None):
    employee = one("employees", data["employee_id"])
    project = one("projects", data["project_id"])
    if data.get("company_id") and data["company_id"] != project["company_id"]:
        raise HTTPException(422, "The work entry client must match the project's client")
    data["company_id"] = project["company_id"]
    start = data["start_time"]
    end = data["end_time"]
    start_minutes = int(start[:2]) * 60 + int(start[3:5])
    end_minutes = int(end[:2]) * 60 + int(end[3:5])

    def intervals(start_value, end_value):
        if end_value > start_value:
            return [(start_value, end_value)]
        return [(start_value, 24 * 60), (0, end_value)]

    existing = rows("work_entries", {"employee_id": data["employee_id"], "date": data["date"]})
    for entry in existing:
        if ignore_id and entry["id"] == ignore_id:
            continue
        old_start = int(entry["start_time"][:2]) * 60 + int(entry["start_time"][3:5])
        old_end = int(entry["end_time"][:2]) * 60 + int(entry["end_time"][3:5])
        if any(left_start < right_end and right_start < left_end
               for left_start, left_end in intervals(start_minutes, end_minutes)
               for right_start, right_end in intervals(old_start, old_end)):
            raise HTTPException(409, "This employee already has an overlapping work entry on this date")
    if end_minutes < start_minutes:
        end_minutes += 24 * 60
    data["hours"] = round((end_minutes - start_minutes) / 60, 2)
    return data


@router.get("/work-entries", tags=["Daily Work Entries"])
def list_work_entries(
    employee_id: str | None = None, company_id: str | None = None,
    project_id: str | None = None, date: str | None = None,
):
    query = {key: value for key, value in {
        "employee_id": employee_id, "company_id": company_id,
        "project_id": project_id, "date": date,
    }.items() if value}
    return rows("work_entries", query)


@router.post("/work-entries", status_code=201, tags=["Daily Work Entries"])
def create_work_entry(item: WorkEntryCreate):
    return insert("work_entries", validate_work_entry(payload(item)))


@router.patch("/work-entries/{item_id}", tags=["Daily Work Entries"])
def update_work_entry(item_id: str, item: WorkEntryUpdate):
    current = one("work_entries", item_id)
    data = {**current, **payload(item)}
    for key in ("id", "created_at", "updated_at"):
        data.pop(key, None)
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    return update("work_entries", item_id, validate_work_entry(data, item_id))


@router.delete("/work-entries/{item_id}", status_code=204, tags=["Daily Work Entries"])
def delete_work_entry(item_id: str):
    remove("work_entries", item_id)
