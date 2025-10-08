from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from database import get_db
from schema import Screening, Result
from datetime import datetime, timedelta

dashboard_router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@dashboard_router.get("/kpis")
def get_kpis(db: Session = Depends(get_db)):
    """
    KPIs principais do dashboard
    """
    total_screenings = db.query(Screening).count()
    total_results = db.query(Result).count()
    
    positive_cases = db.query(Result).filter(Result.prediction == "TEA").count()
    negative_cases = db.query(Result).filter(Result.prediction == "Sem TEA").count()
    
    # Média de idade
    avg_age = db.query(func.avg(Screening.age)).scalar() or 0
    
    # Triagens dos últimos 7 dias
    seven_days_ago = datetime.now() - timedelta(days=7)
    recent_screenings = db.query(Screening).filter(
        Screening.created_at >= seven_days_ago
    ).count()
    
    # Confiança média
    avg_confidence = db.query(func.avg(Result.confidence)).scalar() or 0
    
    return {
        "total_screenings": total_screenings,
        "total_results": total_results,
        "positive_cases": positive_cases,
        "negative_cases": negative_cases,
        "positive_rate": positive_cases / total_screenings if total_screenings > 0 else 0,
        "avg_age": round(avg_age, 1),
        "recent_screenings_7d": recent_screenings,
        "avg_confidence": round(avg_confidence, 3)
    }

@dashboard_router.get("/age-distribution")
def get_age_distribution(db: Session = Depends(get_db)):
    """
    Distribuição de triagens por faixa etária
    """
    age_ranges = [
        ("0-5", 0, 5),
        ("6-12", 6, 12),
        ("13-17", 13, 17),
        ("18-25", 18, 25),
        ("26-35", 26, 35),
        ("36-50", 36, 50),
        ("51+", 51, 150)
    ]
    
    distribution = []
    for label, min_age, max_age in age_ranges:
        total = db.query(Screening).filter(
            Screening.age >= min_age,
            Screening.age <= max_age
        ).count()
        
        positive = db.query(Result).join(Screening, Result.screening_id == Screening.id).filter(
            Screening.age >= min_age,
            Screening.age <= max_age,
            Result.prediction == "TEA"
        ).count()
        
        distribution.append({
            "range": label,
            "total": total,
            "positive": positive,
            "negative": total - positive,
            "positive_rate": positive / total if total > 0 else 0
        })
    
    return distribution

@dashboard_router.get("/gender-distribution")
def get_gender_distribution(db: Session = Depends(get_db)):
    """
    Distribuição por gênero
    """
    results = db.query(
        Screening.gender,
        func.count(Screening.id).label('total'),
        func.sum(case((Result.prediction == "TEA", 1), else_=0)).label('positive')
    ).join(Result, Screening.id == Result.screening_id).group_by(Screening.gender).all()
    
    return [
        {
            "gender": "Masculino" if r.gender == "m" else "Feminino",
            "total": r.total,
            "positive": r.positive,
            "negative": r.total - r.positive,
            "positive_rate": r.positive / r.total if r.total > 0 else 0
        }
        for r in results
    ]

@dashboard_router.get("/confidence-distribution")
def get_confidence_distribution(db: Session = Depends(get_db)):
    """
    Distribuição de confiança das predições
    """
    results = db.query(Result.confidence, Result.prediction).all()
    
    confidence_ranges = [
        ("Muito Baixa", 0, 0.5),
        ("Baixa", 0.5, 0.7),
        ("Média", 0.7, 0.85),
        ("Alta", 0.85, 0.95),
        ("Muito Alta", 0.95, 1.0)
    ]
    
    distribution = []
    for label, min_conf, max_conf in confidence_ranges:
        count = sum(1 for r in results if min_conf <= float(r.confidence) < max_conf)
        positive = sum(1 for r in results if min_conf <= float(r.confidence) < max_conf and r.prediction == "TEA")
        
        distribution.append({
            "range": label,
            "count": count,
            "positive": positive,
            "negative": count - positive
        })
    
    return distribution

@dashboard_router.get("/timeline")
def get_timeline(days: int = 30, db: Session = Depends(get_db)):
    """
    Linha do tempo de triagens
    """
    start_date = datetime.now() - timedelta(days=days)
    
    results = db.query(
        func.date(Screening.created_at).label('date'),
        func.count(Screening.id).label('total'),
        func.sum(case((Result.prediction == "TEA", 1), else_=0)).label('positive')
    ).join(Result, Screening.id == Result.screening_id).filter(
        Screening.created_at >= start_date
    ).group_by(func.date(Screening.created_at)).order_by('date').all()
    
    return [
        {
            "date": r.date.isoformat(),
            "total": r.total,
            "positive": r.positive,
            "negative": r.total - r.positive
        }
        for r in results
    ]

@dashboard_router.get("/risk-factors")
def get_risk_factors(db: Session = Depends(get_db)):
    """
    Análise de fatores de risco
    """
    # Icterícia
    jundice_results = db.query(
        Screening.jundice,
        func.count(Screening.id).label('total'),
        func.sum(case((Result.prediction == "TEA", 1), else_=0)).label('positive')
    ).join(Result, Screening.id == Result.screening_id).group_by(Screening.jundice).all()
    
    # Histórico familiar
    autism_results = db.query(
        Screening.autism,
        func.count(Screening.id).label('total'),
        func.sum(case((Result.prediction == "TEA", 1), else_=0)).label('positive')
    ).join(Result, Screening.id == Result.screening_id).group_by(Screening.autism).all()
    
    def format_results(results, factor_name):
        return [
            {
                "factor": factor_name,
                "value": "Sim" if r[0] == "yes" else "Não",
                "total": r.total,
                "positive": r.positive,
                "positive_rate": r.positive / r.total if r.total > 0 else 0
            }
            for r in results
        ]
    
    return {
        "jundice": format_results(jundice_results, "Icterícia"),
        "family_history": format_results(autism_results, "Histórico Familiar")
    }

@dashboard_router.get("/score-analysis")
def get_score_analysis(db: Session = Depends(get_db)):
    """
    Análise dos scores do questionário
    """
    screenings = db.query(
        Screening.a1_score, Screening.a2_score, Screening.a3_score,
        Screening.a4_score, Screening.a5_score, Screening.a6_score,
        Screening.a7_score, Screening.a8_score, Screening.a9_score,
        Screening.a10_score, Result.prediction
    ).join(Result, Screening.id == Result.screening_id).all()
    
    # Calcular média de cada pergunta para casos positivos vs negativos
    questions = []
    for i in range(1, 11):
        attr_name = f'a{i}_score'
        positive_scores = [getattr(s, attr_name) for s in screenings if s.prediction == "TEA"]
        negative_scores = [getattr(s, attr_name) for s in screenings if s.prediction == "Sem TEA"]
        
        questions.append({
            "question": f"A{i}",
            "positive_avg": sum(positive_scores) / len(positive_scores) if positive_scores else 0,
            "negative_avg": sum(negative_scores) / len(negative_scores) if negative_scores else 0,
            "total_avg": sum(positive_scores + negative_scores) / len(screenings) if screenings else 0
        })
    
    return questions

