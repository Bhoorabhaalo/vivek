from pydantic import BaseModel
from typing import List, Optional


class AssetPosition(BaseModel):
    asset_id: str
    quantity: float
    cost_basis: float
    asset_class: str
    # 1 to 5, where 1 is highly liquid (Cash) and 5 is illiquid
    liquidity_tier: int
    sector: Optional[str] = None
    issuer: Optional[str] = None


class PortfolioUpload(BaseModel):
    positions: List[AssetPosition]


class PortfolioSummary(BaseModel):
    total_value: float
    cash_buffer: float
    positions: List[AssetPosition]
