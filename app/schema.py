# schema.py
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class TrainingData(Base):
    __tablename__ = "training_data"
    __table_args__ = {"schema": "tea_screening"}
    
    id = Column(Integer, primary_key=True, index=True)
    a1_score = Column(Integer)
    a2_score = Column(Integer)
    a3_score = Column(Integer)
    a4_score = Column(Integer)
    a5_score = Column(Integer)
    a6_score = Column(Integer)
    a7_score = Column(Integer)
    a8_score = Column(Integer)
    a9_score = Column(Integer)
    a10_score = Column(Integer)
    age = Column(Integer)
    gender = Column(String(50))
    ethnicity = Column(String(100))
    jundice = Column(String(10))
    autism = Column(String(10))
    country_of_res = Column(String(100))
    used_app_before = Column(String(10))
    result = Column(Integer)
    age_desc = Column(String(50))
    relation = Column(String(50))
    class_asd = Column(String(10))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Screening(Base):
    __tablename__ = "screenings"
    __table_args__ = {"schema": "tea_screening"}
    
    id = Column(Integer, primary_key=True, index=True)
    a1_score = Column(Integer, nullable=False)
    a2_score = Column(Integer, nullable=False)
    a3_score = Column(Integer, nullable=False)
    a4_score = Column(Integer, nullable=False)
    a5_score = Column(Integer, nullable=False)
    a6_score = Column(Integer, nullable=False)
    a7_score = Column(Integer, nullable=False)
    a8_score = Column(Integer, nullable=False)
    a9_score = Column(Integer, nullable=False)
    a10_score = Column(Integer, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(50), nullable=False)
    jundice = Column(String(10), nullable=False)
    autism = Column(String(10), nullable=False)
    used_app_before = Column(String(10), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Result(Base):
    __tablename__ = "results"
    __table_args__ = {"schema": "tea_screening"}
    
    id = Column(Integer, primary_key=True, index=True)
    # screening_id = Column(Integer, nullable=False)
    screening_id = Column(Integer, ForeignKey('tea_screening.screenings.id'), nullable=False)

    prediction = Column(String(50), nullable=False)
    confidence = Column(String(50))
    model_version = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    screening = relationship("Screening", backref="results")