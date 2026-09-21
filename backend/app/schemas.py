from __future__ import annotations

from datetime import date as Date, time as Time
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict[str, str]


class CompanyBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    contact: str = Field(min_length=1, max_length=200)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=50)
    address: str | None = Field(default=None, max_length=500)


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    contact: str | None = Field(default=None, min_length=1, max_length=200)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=50)
    address: str | None = Field(default=None, max_length=500)


class ProjectBase(BaseModel):
    company_id: str
    name: str = Field(min_length=1, max_length=200)
    location: str | None = Field(default=None, max_length=300)
    start_date: Date
    end_date: Date
    status: str = Field(default="Active", pattern="^(Active|Completed|On Hold)$")
    description: str | None = None

    @field_validator("end_date")
    @classmethod
    def dates_are_valid(cls, value: Date, info):
        start = info.data.get("start_date")
        if start and value < start:
            raise ValueError("end_date must not be before start_date")
        return value


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    company_id: str | None = None
    name: str | None = Field(default=None, min_length=1, max_length=200)
    location: str | None = Field(default=None, max_length=300)
    start_date: Date | None = None
    end_date: Date | None = None
    status: str | None = Field(default=None, pattern="^(Active|Completed|On Hold)$")
    description: str | None = None


class EmployeeBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    role: str | None = Field(default=None, max_length=150)
    phone: str | None = Field(default=None, max_length=50)
    email: EmailStr | None = None
    status: str = Field(default="Active", pattern="^(Active|Inactive)$")
    experience: str | None = None
    work_type: str | None = None
    address: str | None = None
    emergency_contact: str | None = None


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    role: str | None = None
    phone: str | None = None
    email: EmailStr | None = None
    status: str | None = Field(default=None, pattern="^(Active|Inactive)$")
    experience: str | None = None
    work_type: str | None = None
    address: str | None = None
    emergency_contact: str | None = None


class AssignmentCreate(BaseModel):
    employee_id: str
    project_id: str
    assigned_from: Date | None = None
    assigned_to: Date | None = None
    role: str | None = None


class WorkHistoryCreate(BaseModel):
    employee_id: str
    company_name: str = Field(min_length=1, max_length=200)
    role: str | None = None
    start_date: Date | None = None
    end_date: Date | None = None
    description: str | None = None


class ExpenditureCreate(BaseModel):
    project_id: str
    employee_id: str
    journey_date: Date
    start_place: str = Field(min_length=1, max_length=300)
    end_place: str = Field(min_length=1, max_length=300)
    kilometers: float = Field(gt=0, le=100000)
    remarks: str | None = None


class ExpenditureUpdate(BaseModel):
    project_id: str | None = None
    employee_id: str | None = None
    journey_date: Date | None = None
    start_place: str | None = Field(default=None, min_length=1, max_length=300)
    end_place: str | None = Field(default=None, min_length=1, max_length=300)
    kilometers: float | None = Field(default=None, gt=0, le=100000)
    remarks: str | None = None


class WorkEntryBase(BaseModel):
    employee_id: str
    project_id: str
    company_id: str | None = None
    date: Date
    start_time: Time
    end_time: Time
    description: str = Field(min_length=1)
    remarks: str | None = None

    @field_validator("end_time")
    @classmethod
    def times_are_valid(cls, value: Time, info):
        start = info.data.get("start_time")
        if start and value == start:
            raise ValueError("start_time and end_time must be different")
        return value


class WorkEntryCreate(WorkEntryBase):
    pass


class WorkEntryUpdate(BaseModel):
    employee_id: str | None = None
    project_id: str | None = None
    company_id: str | None = None
    date: Date | None = None
    start_time: Time | None = None
    end_time: Time | None = None
    description: str | None = Field(default=None, min_length=1)
    remarks: str | None = None


class ReportQuery(BaseModel):
    date_from: Date
    date_to: Date
    employee_id: str | None = None
    company_id: str | None = None
    project_id: str | None = None


class ApiModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class DashboardResponse(ApiModel):
    total_clients: int
    active_projects: int
    total_employees: int
    today_work_entries: int
    total_logged_hours: float
    recent_work_entries: list[dict[str, Any]]
    last_7_days: list[dict[str, Any]]
