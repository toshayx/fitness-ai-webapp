from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import DailyGoal, FoodEntry, User
from app.schemas import DashboardToday, DayHistoryItem, FoodEntryOut, GoalOut, MacroTotals

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


def _compute_totals(entries: list[FoodEntry]) -> MacroTotals:
    return MacroTotals(
        kcals=sum(e.kcals for e in entries),
        fats_g=round(sum(e.fats_g for e in entries), 1),
        saturated_fats_g=round(sum(e.saturated_fats_g for e in entries), 1),
        carbs_g=round(sum(e.carbs_g for e in entries), 1),
        proteins_g=round(sum(e.proteins_g for e in entries), 1),
        sodium_mg=round(sum(e.sodium_mg for e in entries), 1),
    )


async def _get_goal(user_id: int, db: AsyncSession) -> GoalOut:
    result = await db.execute(select(DailyGoal).where(DailyGoal.user_id == user_id))
    goal = result.scalar_one_or_none()
    if goal:
        return GoalOut.model_validate(goal)
    return GoalOut()


@router.get("/today", response_model=DashboardToday)
async def today(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    today_date = date.today()
    result = await db.execute(
        select(FoodEntry)
        .where(FoodEntry.user_id == user.id, FoodEntry.entry_date == today_date)
        .order_by(FoodEntry.created_at.desc())
    )
    entries = list(result.scalars().all())

    return DashboardToday(
        date=today_date,
        totals=_compute_totals(entries),
        goals=await _get_goal(user.id, db),
        entries=[FoodEntryOut.model_validate(e) for e in entries],
    )


@router.get("/history", response_model=list[DayHistoryItem])
async def history(
    days: int = Query(default=7, ge=1, le=90),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    start_date = date.today() - timedelta(days=days - 1)
    result = await db.execute(
        select(FoodEntry)
        .where(FoodEntry.user_id == user.id, FoodEntry.entry_date >= start_date)
        .order_by(FoodEntry.entry_date.desc())
    )
    all_entries = list(result.scalars().all())

    by_date: dict[date, list[FoodEntry]] = {}
    for e in all_entries:
        by_date.setdefault(e.entry_date, []).append(e)

    items = []
    for d in sorted(by_date.keys(), reverse=True):
        day_entries = by_date[d]
        items.append(DayHistoryItem(
            date=d,
            totals=_compute_totals(day_entries),
            entry_count=len(day_entries),
        ))
    return items
