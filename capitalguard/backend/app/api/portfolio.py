from fastapi import APIRouter, File, UploadFile, HTTPException
from typing import List
import csv
from io import StringIO
from app.schemas.portfolio import AssetPosition, PortfolioUpload, PortfolioSummary

router = APIRouter()

# In-memory store for demo purposes, could be moved to DB
current_portfolio = []


@router.post("/upload/json", response_model=PortfolioSummary)
async def upload_portfolio_json(portfolio: PortfolioUpload):
    global current_portfolio
    current_portfolio = portfolio.positions
    return _summarize_portfolio(current_portfolio)


@router.post("/upload/csv", response_model=PortfolioSummary)
async def upload_portfolio_csv(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files allowed")

    content = await file.read()
    decoded = content.decode('utf-8')
    reader = csv.DictReader(StringIO(decoded))

    positions = []
    for row in reader:
        try:
            pos = AssetPosition(
                asset_id=row['asset_id'],
                quantity=float(row['quantity']),
                cost_basis=float(row['cost_basis']),
                asset_class=row['asset_class'],
                liquidity_tier=int(row['liquidity_tier']),
                sector=row.get('sector'),
                issuer=row.get('issuer')
            )
            positions.append(pos)
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Error parsing row: {row}. {
                    str(e)}")

    global current_portfolio
    current_portfolio = positions
    return _summarize_portfolio(current_portfolio)


@router.get("/", response_model=PortfolioSummary)
async def get_portfolio():
    return _summarize_portfolio(current_portfolio)


def _summarize_portfolio(positions: List[AssetPosition]) -> PortfolioSummary:
    # Dummy calculation for now. Real value requires market data.
    # Assuming cost_basis as current price for summary before market data is
    # applied.
    total = sum(p.quantity * p.cost_basis for p in positions)
    cash = sum(
        p.quantity *
        p.cost_basis for p in positions if p.liquidity_tier == 1)

    return PortfolioSummary(
        total_value=total,
        cash_buffer=cash,
        positions=positions
    )
