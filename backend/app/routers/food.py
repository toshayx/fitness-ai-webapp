from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import FoodEntry, User
from app.schemas import AnalyzeRequest, AnalyzeResponse, FoodEntryCreate, FoodEntryOut
from app.services.openrouter import AVAILABLE_MODELS, analyze_food

router = APIRouter(prefix="/api/food", tags=["food"])


@router.get("/models")
async def list_models():
    return AVAILABLE_MODELS


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(body: AnalyzeRequest, _user: User = Depends(get_current_user)):
    if not body.text and not body.image_base64:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Provide text or image")

    try:
        nutrition, raw = await analyze_food(
            text=body.text,
            image_base64=body.image_base64,
            model=body.model,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"AI service error: {exc}")

    return AnalyzeResponse(nutrition=nutrition, model_used=body.model, raw_response=raw)


@router.post("/entries", response_model=FoodEntryOut, status_code=status.HTTP_201_CREATED)
async def create_entry(
    body: FoodEntryCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    entry = FoodEntry(user_id=user.id, **body.model_dump())
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.get("/entries", response_model=list[FoodEntryOut])
async def list_entries(
    date: date | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(FoodEntry).where(FoodEntry.user_id == user.id).order_by(FoodEntry.created_at.desc())
    if date:
        stmt = stmt.where(FoodEntry.entry_date == date)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.delete("/entries/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_entry(
    entry_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(FoodEntry).where(FoodEntry.id == entry_id, FoodEntry.user_id == user.id)
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
    await db.delete(entry)
    await db.commit()
