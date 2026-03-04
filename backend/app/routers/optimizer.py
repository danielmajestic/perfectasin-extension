from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from app.services.title_optimizer import TitleOptimizerService

router = APIRouter()
optimizer_service = TitleOptimizerService()


class OptimizeTitleRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    asin: str = Field(..., pattern=r'^[A-Z0-9]{10}$')
    price: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    bullets: Optional[list[str]] = None


class OptimizeTitleResponse(BaseModel):
    original_title: str
    optimized_title: str
    asin: str
    improvements: list[str]


@router.post("/optimize-title", response_model=OptimizeTitleResponse)
async def optimize_title(request: OptimizeTitleRequest):
    try:
        result = await optimizer_service.optimize_title(
            title=request.title,
            asin=request.asin,
            price=request.price,
            category=request.category,
            brand=request.brand,
            bullets=request.bullets
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
