from pydantic import BaseModel, Field
from typing import List


class ProductInfo(BaseModel):
    title: str
    asin: str = Field(..., pattern=r'^[A-Z0-9]{10}$')
    url: str


class OptimizeTitleRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    asin: str = Field(..., pattern=r'^[A-Z0-9]{10}$')


class OptimizeTitleResponse(BaseModel):
    original_title: str
    optimized_title: str
    asin: str
    improvements: List[str]
