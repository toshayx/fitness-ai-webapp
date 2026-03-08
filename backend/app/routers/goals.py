from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import DailyGoal, User
from app.schemas import GoalOut, GoalUpdate

router = APIRouter(prefix="/api/goals", tags=["goals"])


@router.get("", response_model=GoalOut)
async def get_goals(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(DailyGoal).where(DailyGoal.user_id == user.id))
    goal = result.scalar_one_or_none()
    if not goal:
        goal = DailyGoal(user_id=user.id)
        db.add(goal)
        await db.commit()
        await db.refresh(goal)
    return goal


@router.put("", response_model=GoalOut)
async def update_goals(
    body: GoalUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(DailyGoal).where(DailyGoal.user_id == user.id))
    goal = result.scalar_one_or_none()
    if not goal:
        goal = DailyGoal(user_id=user.id)
        db.add(goal)

    for field, value in body.model_dump().items():
        setattr(goal, field, value)

    await db.commit()
    await db.refresh(goal)
    return goal
