import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, cross_val_predict
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, roc_curve, auc
from sklearn.metrics import (accuracy_score, precision_score, recall_score, f1_score, precision_recall_curve, roc_auc_score)
from sklearn.utils.class_weight import compute_class_weight
import joblib
import pickle
import json
from datetime import datetime
import os

class TEAClassifier:
    """
    Classificador para triagem de TEA
    """

    def __init__(self, model_path='models/tea_model_optmized.pkl'):

        self.model_data = joblib.load(model_path)
        self.model = self.model_data['model']
        self.scaler = self.model_data['scaler']
        self.threshold = self.model_data.get('threshold', 0.5)
        self.feature_names = self.model_data['feature_names']
        self.model_type = self.model_data.get('model_type', 'unknown')
        self.label_encoders = self.model_data.get('label_encoders', {})

    def prepare_input(self, data_dict):

        df = pd.DataFrame([data_dict])
        df = df.rename(columns={'austim': 'autism',})
        df['gender'] = df['gender'].replace({'m': 'male', 'f': 'female'})

        # score_columns = [f'A{i}_Score' for i in range(1,11)]
        
        categorical_cols = ['gender', 'jundice']
        

        for col in categorical_cols:
            if col in df.columns and col in self.label_encoders:
                df[col + '_encoded'] = self.label_encoders[col].transform(df[col].astype(str))
        
        return df[self.feature_names]
    
    def predict(self, data_dict):
        X = self.prepare_input(data_dict)
        x_scaled = self.scaler.transform(X)

        prediction = self.model.predict(x_scaled)[0]
        probability = self.model.predict_proba(x_scaled)[0,1]

        confidence = self._get_confidence_level(probability)
        
        return {
            'prediction': 'TEA' if prediction == 1 else 'Sem TEA',
            'probability': float(probability),
            'confidence': confidence,
            'recommendation': self._get_recommendation(prediction, probability),
            'model_type': self.model_type
        }
    
    def _get_confidence_level(self, probability):
        """Determina nível de confiança baseado na probabilidade"""
        distance_from_threshold = abs(probability - 0.5)
        
        if distance_from_threshold >= 0.4:
            return 'Muito Alta'
        elif distance_from_threshold >= 0.3:
            return 'Alta'
        elif distance_from_threshold >= 0.2:
            return 'Média'
        else:
            return 'Baixa'
        
    def _get_recommendation(self, prediction, probability):
        """Gera recomendação baseada na predição"""
        if prediction == 1:  # TEA
            if probability >= 0.8:
                return "Encaminhamento prioritário para avaliação especializada."
            elif probability >= 0.6:
                return "Encaminhamento para avaliação especializada recomendado."
            else:
                return "Considerar encaminhamento para avaliação. Reavaliar em 3 meses."
        else:  # Sem TEA
            if probability >= 0.4:
                return "Monitoramento recomendado. Reavaliar em 6 meses."
            else:
                return "Baixo risco. Manter acompanhamento regular."

    
classifier = TEAClassifier('models/tea_model_optimized.pkl')