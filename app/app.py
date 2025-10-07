# app.py
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Optional
import uvicorn
import json
from datetime import datetime

from database import Base, get_db, engine
from classifier_tea import TEAClassifier
from schema import Screening, Result
from dashboard_endpoints import dashboard_router


# Criar tabelas se não existirem
Base.metadata.create_all(bind=engine)

# Modelos Pydantic
class PatientInput(BaseModel):
    A1_Score: int = Field(..., ge=0, le=1)
    A2_Score: int = Field(..., ge=0, le=1)
    A3_Score: int = Field(..., ge=0, le=1)
    A4_Score: int = Field(..., ge=0, le=1)
    A5_Score: int = Field(..., ge=0, le=1)
    A6_Score: int = Field(..., ge=0, le=1)
    A7_Score: int = Field(..., ge=0, le=1)
    A8_Score: int = Field(..., ge=0, le=1)
    A9_Score: int = Field(..., ge=0, le=1)
    A10_Score: int = Field(..., ge=0, le=1)
    age: int = Field(..., ge=1, le=100)
    gender: str = Field(..., pattern='^[mfMF]$')
    jundice: str = Field(..., pattern='^(yes|no)$')
    autism: str = Field(..., pattern='^(yes|no)$')
    used_app_before: str = Field(..., pattern='^(yes|no)$')

class PredictionOutput(BaseModel):
    id: int
    prediction: str
    confidence: float
    model_type: str
    created_at: datetime

# Criar aplicação
app = FastAPI(
    title="TEA Screening API",
    description="API para triagem inicial de TEA com persistência no banco",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Permitir frontend React
    allow_credentials=True,
    allow_methods=["*"],  # Permitir todos os métodos (GET, POST, OPTIONS, etc)
    allow_headers=["*"],  # Permitir todos os headers
)

# Carregar modelo
classifier = TEAClassifier('models/tea_model_optimized.pkl')

app.include_router(dashboard_router)

@app.get("/")
def home():
    return {
        "message": "TEA Screening API",
        "status": "online",
        "database": "connected",
        "endpoints": ["/docs", "/predict", "/health", "/stats"]
    }

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        # Testar conexão com banco
        db.execute("SELECT 1")
        return {
            "status": "healthy",
            "model_loaded": True,
            "database": "connected"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

@app.post("/predict", response_model=PredictionOutput)
async def predict(
    patient: PatientInput, 
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Realiza predição e salva no banco
    """
    try:
        # 1. Salvar dados de entrada no banco
        screening = Screening(
            a1_score=patient.A1_Score,
            a2_score=patient.A2_Score,
            a3_score=patient.A3_Score,
            a4_score=patient.A4_Score,
            a5_score=patient.A5_Score,
            a6_score=patient.A6_Score,
            a7_score=patient.A7_Score,
            a8_score=patient.A8_Score,
            a9_score=patient.A9_Score,
            a10_score=patient.A10_Score,
            age=patient.age,
            gender=patient.gender.lower(),
            jundice=patient.jundice,
            autism=patient.autism,
            used_app_before=patient.used_app_before,
        )
        
        db.add(screening)
        db.commit()
        db.refresh(screening)
        
        # 2. Fazer predição
        result_data = classifier.predict(patient.dict())
        
        # 3. Salvar resultado
        result = Result(
            screening_id=screening.id,
            prediction=result_data['prediction'],
            confidence=result_data['probability'],
            model_version=result_data['model_type'],
        )
        
        db.add(result)
        db.commit()
        db.refresh(result)
        
        # 4. Retornar resposta
        return PredictionOutput(
            id=result.id,
            prediction=result.prediction,
            confidence=result.confidence,
            model_type=result.model_version,
            created_at=result.created_at
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro: {str(e)}")

@app.get("/stats")
def get_statistics(db: Session = Depends(get_db)):
    """
    Retorna estatísticas do sistema
    """
    try:
        total_screenings = db.query(Screening).count()
        total_positive = db.query(Result).filter(Result.prediction == "TEA").count()
        total_negative = db.query(Result).filter(Result.prediction == "Sem TEA").count()
        
        return {
            "total_screenings": total_screenings,
            "positive_cases": total_positive,
            "negative_cases": total_negative,
            "positive_rate": total_positive / total_screenings if total_screenings > 0 else 0
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/recent-screenings")
def get_recent_screenings(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Retorna triagens recentes
    """
    screenings = db.query(
        Screening.id,
        Screening.age,
        Screening.gender,
        Screening.created_at,
        Result.prediction,
   
    ).join(
        Result, Screening.id == Result.screening_id
    ).order_by(
        Screening.created_at.desc()
    ).limit(limit).all()
    
    return [
        {
            "id": s.id,
            "age": s.age,
            "gender": s.gender,
            "created_at": s.created_at,
            "prediction": s.prediction,
  
        }
        for s in screenings
    ]

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)