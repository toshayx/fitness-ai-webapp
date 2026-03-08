from datetime import date, datetime

from pydantic import BaseModel, Field


# ── Auth ──────────────────────────────────────────────────────────────

class AuthRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


# ── Nutrition ─────────────────────────────────────────────────────────

class NutritionData(BaseModel):
    food_name: str
    kcals: int
    fats_g: float
    saturated_fats_g: float
    carbs_g: float
    proteins_g: float
    sodium_mg: float


class AnalyzeRequest(BaseModel):
    text: str | None = None
    image_base64: str | None = None
    model: str = "anthropic/claude-sonnet-4.6"


class AnalyzeResponse(BaseModel):
    nutrition: NutritionData
    model_used: str
    raw_response: str


# ── Food Entries ──────────────────────────────────────────────────────

class FoodEntryCreate(BaseModel):
    food_name: str
    description: str
    model_used: str
    entry_date: date
    kcals: int
    fats_g: float
    saturated_fats_g: float
    carbs_g: float
    proteins_g: float
    sodium_mg: float
    ai_response_raw: str | None = None


class FoodEntryOut(BaseModel):
    id: int
    food_name: str
    description: str
    model_used: str
    entry_date: date
    created_at: datetime
    kcals: int
    fats_g: float
    saturated_fats_g: float
    carbs_g: float
    proteins_g: float
    sodium_mg: float

    model_config = {"from_attributes": True}


# ── Goals ─────────────────────────────────────────────────────────────

class GoalUpdate(BaseModel):
    kcals: int = 2000
    fats_g: float = 65.0
    saturated_fats_g: float = 20.0
    carbs_g: float = 300.0
    proteins_g: float = 50.0
    sodium_mg: float = 2300.0


class GoalOut(GoalUpdate):
    model_config = {"from_attributes": True}


# ── Dashboard ─────────────────────────────────────────────────────────

class MacroTotals(BaseModel):
    kcals: int = 0
    fats_g: float = 0.0
    saturated_fats_g: float = 0.0
    carbs_g: float = 0.0
    proteins_g: float = 0.0
    sodium_mg: float = 0.0


class DashboardToday(BaseModel):
    date: date
    totals: MacroTotals
    goals: GoalOut
    entries: list[FoodEntryOut]


class DayHistoryItem(BaseModel):
    date: date
    totals: MacroTotals
    entry_count: int
