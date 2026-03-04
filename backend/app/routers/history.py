"""
Analysis history router — Pro-only endpoints.

GET    /api/history              — paginated list of past analyses
GET    /api/history/{id}         — single analysis detail
DELETE /api/history/{id}         — soft-delete analysis
"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.firebase import db
from app.middleware.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/history", tags=["history"])


def _require_pro(uid: str):
    """Raise 403 if user is not on a Pro tier."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    snap = db.collection("users").document(uid).get()
    tier = "free"
    if snap.exists:
        tier = snap.to_dict().get("tier", "free")
    if tier == "free":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Analysis history is a Pro feature. Upgrade to access.",
        )


@router.get("")
async def list_analyses(
    current_user: dict = Depends(get_current_user),
    limit: int = Query(20, ge=1, le=50),
    cursor: Optional[str] = Query(None, description="Document ID to start after"),
):
    """
    List user's past analyses, newest first.
    Cursor-based pagination: pass the last document ID as `cursor`
    to get the next page.
    """
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")

    uid = current_user["uid"]
    _require_pro(uid)

    query = (
        db.collection("analyses")
        .where("uid", "==", uid)
        .where("deleted", "==", False)
        .order_by("timestamp", direction="DESCENDING")
        .limit(limit)
    )

    # Cursor-based pagination
    if cursor:
        cursor_snap = db.collection("analyses").document(cursor).get()
        if cursor_snap.exists:
            query = query.start_after(cursor_snap)

    docs = query.stream()

    results = []
    last_id = None
    for doc in docs:
        data = doc.to_dict()
        last_id = doc.id
        results.append({
            "id": doc.id,
            "asin": data.get("asin"),
            "title": data.get("title"),
            "scores": data.get("scores"),
            "icp": data.get("icp"),
            "timestamp": data.get("timestamp"),
        })

    return {
        "analyses": results,
        "next_cursor": last_id if len(results) == limit else None,
    }


@router.get("/{analysis_id}")
async def get_analysis(
    analysis_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Return a single analysis with full detail (variations, full_icp, etc.)."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")

    uid = current_user["uid"]
    _require_pro(uid)

    snap = db.collection("analyses").document(analysis_id).get()
    if not snap.exists:
        raise HTTPException(status_code=404, detail="Analysis not found")

    data = snap.to_dict()

    # Enforce uid scope
    if data.get("uid") != uid:
        raise HTTPException(status_code=404, detail="Analysis not found")

    if data.get("deleted"):
        raise HTTPException(status_code=404, detail="Analysis not found")

    return {"id": snap.id, **data}


@router.delete("/{analysis_id}")
async def delete_analysis(
    analysis_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Soft-delete an analysis (marks as deleted, does not remove from Firestore)."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")

    uid = current_user["uid"]
    _require_pro(uid)

    ref = db.collection("analyses").document(analysis_id)
    snap = ref.get()
    if not snap.exists:
        raise HTTPException(status_code=404, detail="Analysis not found")

    data = snap.to_dict()
    if data.get("uid") != uid:
        raise HTTPException(status_code=404, detail="Analysis not found")

    ref.update({"deleted": True})
    return {"deleted": True, "id": analysis_id}
