from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import create_token, get_current_user, hash_password, verify_password
from app.config import Settings, get_settings
from app.database import get_db
from app.models import DailyGoal, User
from app.schemas import AuthRequest, TokenResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    body: AuthRequest,
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    count = (await db.execute(select(func.count(User.id)))).scalar() or 0
    if count >= settings.max_users:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Max users reached")

    exists = (await db.execute(select(User).where(User.username == body.username))).scalar_one_or_none()
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username taken")

    user = User(username=body.username, password_hash=hash_password(body.password))
    db.add(user)
    await db.flush()

    db.add(DailyGoal(user_id=user.id))
    await db.commit()
    await db.refresh(user)

    return TokenResponse(
        access_token=create_token(user.id, user.username, settings),
        username=user.username,
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    body: AuthRequest,
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    result = await db.execute(select(User).where(User.username == body.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    return TokenResponse(
        access_token=create_token(user.id, user.username, settings),
        username=user.username,
    )


@router.get("/me")
async def me(user: User = Depends(get_current_user)):
    return {"id": user.id, "username": user.username}
