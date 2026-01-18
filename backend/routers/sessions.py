from datetime import datetime
import json
from typing import Literal, Optional, cast

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..db import db
from ..orm.types import SessionResultUpdateInput


IssueType = Literal[
    "seo-issues",
    "missing-title",
    "missing-meta-description",
    "missing-h1",
    "slow-performance",
]

ResultStatus = Literal["pending", "completed", "error"]
Tier = float


class SessionCreate(BaseModel):
    pass


class SessionRead(BaseModel):
    id: int
    created_at: datetime
    name: str
    is_configured: bool
    is_completed: bool


class SessionSearchCreate(BaseModel):
    query: str
    issues: list[IssueType]
    max_results: int


class SessionSearchRead(BaseModel):
    session_id: int
    query: str
    issues: list[IssueType]
    max_results_requested: int
    checked_websites_count: int
    last_search_cursor: Optional[str]
    is_completed: bool


class SessionResultRead(BaseModel):
    id: int
    created_at: datetime
    session_id: int
    url: str
    domain: str
    page_count: int
    tier: Tier
    issues_detected: list[IssueType]
    lighthouse_json: Optional[str]
    contact_email: Optional[str]
    status: ResultStatus


class SessionResultUpdate(BaseModel):
    tier: Optional[Tier] = None
    status: Optional[ResultStatus] = None


router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("", response_model=SessionRead)
async def create_session(body: SessionCreate | None = None) -> SessionRead:
    session = await db.session.create(
        data={},
    )
    name = getattr(session, "name", "Untitled session")
    return SessionRead(
        id=session.id,
        created_at=session.createdAt,
        name=name,
        is_configured=False,
        is_completed=False,
    )


@router.get("", response_model=list[SessionRead])
async def list_sessions(offset: int = 0, limit: int = 50) -> list[SessionRead]:
    sessions = await db.session.find_many(
        skip=offset,
        take=limit,
        order={"createdAt": "desc"},
        include={"search": True},
    )
    results: list[SessionRead] = []
    for session in sessions:
        search = session.search
        is_configured = search is not None
        is_completed = bool(search and search.completedAt is not None)
        name = getattr(session, "name", "Untitled session")
        results.append(
            SessionRead(
                id=session.id,
                created_at=session.createdAt,
                name=name,
                is_configured=is_configured,
                is_completed=is_completed,
            )
        )
    return results


@router.put(
    "/{session_id}/search",
    response_model=SessionSearchRead,
)
async def upsert_session_search(
    session_id: int,
    body: SessionSearchCreate,
) -> SessionSearchRead:
    session = await db.session.find_unique(
        where={"id": session_id},
        include={"search": True},
    )
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    issues_filter = json.dumps(body.issues)

    if session.search is None:
        search = await db.sessionsearch.create(
            data={
                "session": {"connect": {"id": session_id}},
                "query": body.query,
                "issuesFilter": issues_filter,
                "maxResultsRequested": body.max_results,
                "status": "pending",
            }
        )
    else:
        search = await db.sessionsearch.update(
            where={"id": session.search.id},
            data={
                "query": body.query,
                "issuesFilter": issues_filter,
                "maxResultsRequested": body.max_results,
            },
        )

    issues: list[IssueType] = json.loads(search.issuesFilter)
    return SessionSearchRead(
        session_id=search.sessionId,
        query=search.query,
        issues=issues,
        max_results_requested=search.maxResultsRequested,
        checked_websites_count=search.checkedWebsitesCount,
        last_search_cursor=search.lastSearchCursor,
        is_completed=search.completedAt is not None,
    )


@router.get(
    "/{session_id}/search",
    response_model=SessionSearchRead,
)
async def get_session_search(session_id: int) -> SessionSearchRead:
    search = await db.sessionsearch.find_unique(
        where={"sessionId": session_id},
    )
    if search is None:
        raise HTTPException(status_code=404, detail="Search not configured for session")

    issues: list[IssueType] = json.loads(search.issuesFilter)
    return SessionSearchRead(
        session_id=search.sessionId,
        query=search.query,
        issues=issues,
        max_results_requested=search.maxResultsRequested,
        checked_websites_count=search.checkedWebsitesCount,
        last_search_cursor=search.lastSearchCursor,
        is_completed=search.completedAt is not None,
    )


@router.get(
    "/{session_id}/results",
    response_model=list[SessionResultRead],
)
async def list_session_results(
    session_id: int,
    offset: int = 0,
    limit: int = 50,
) -> list[SessionResultRead]:
    results = await db.sessionresult.find_many(
        where={"sessionId": session_id},
        skip=offset,
        take=limit,
        order={"createdAt": "desc"},
    )
    output: list[SessionResultRead] = []
    for result in results:
        issues: list[IssueType] = (
            json.loads(result.issuesDetected) if result.issuesDetected else []
        )
        output.append(
            SessionResultRead(
                id=result.id,
                created_at=result.createdAt,
                session_id=result.sessionId,
                url=result.url,
                domain=result.domain,
                page_count=result.pageCount,
                tier=result.tier,
                issues_detected=issues,
                lighthouse_json=result.lighthouseJson,
                contact_email=result.contactEmail,
                status=cast(ResultStatus, result.status),
            )
        )
    return output


@router.patch(
    "/{session_id}/results/{result_id}",
    response_model=SessionResultRead,
)
async def update_session_result(
    session_id: int,
    result_id: int,
    body: SessionResultUpdate,
) -> SessionResultRead:
    result = await db.sessionresult.find_unique(
        where={"id": result_id},
    )
    if result is None or result.sessionId != session_id:
        raise HTTPException(status_code=404, detail="Result not found for session")

    update_data: SessionResultUpdateInput = {}
    if body.tier is not None:
        update_data["tier"] = body.tier
    if body.status is not None:
        update_data["status"] = body.status

    if update_data:
        result = await db.sessionresult.update(
            where={"id": result_id},
            data=update_data,
        )

    if result is None:
        raise HTTPException(status_code=404, detail="Result not found for session")

    issues: list[IssueType] = (
        json.loads(result.issuesDetected) if result.issuesDetected else []
    )
    return SessionResultRead(
        id=result.id,
        created_at=result.createdAt,
        session_id=result.sessionId,
        url=result.url,
        domain=result.domain,
        page_count=result.pageCount,
        tier=result.tier,
        issues_detected=issues,
        lighthouse_json=result.lighthouseJson,
        contact_email=result.contactEmail,
        status=cast(ResultStatus, result.status),
    )
