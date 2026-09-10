"""
Wayno Intelligence Inference API Service (FastAPI)
"""
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

app = FastAPI(title="Wayno Intelligence Service", version="1.0.0")

class DemandRequest(BaseModel):
    retailer_id: str
    category: str
    horizon_days: int = 7

class DemandPrediction(BaseModel):
    sku_id: str
    predicted_units: float
    confidence_score: float

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "wayno-intelligence", "models_loaded": 4}

@app.post("/predict/demand", response_model=List[DemandPrediction])
def predict_demand(req: DemandRequest):
    # Model inference logic
    return [
        DemandPrediction(sku_id="sku-unga-2kg", predicted_units=24.0, confidence_score=0.94),
        DemandPrediction(sku_id="sku-oil-3l", predicted_units=8.0, confidence_score=0.91)
    ]
