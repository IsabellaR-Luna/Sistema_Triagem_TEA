import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Activity, User, Info, BarChart3, TrendingUp, Users, Brain, Lock } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css';

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];

const questions = [
  { id: 1, text: "Eu frequentemente noto pequenos sons quando outros não notam" },
  { id: 2, text: "Eu costumo me concentrar mais no todo do que nos pequenos detalhes" },
  { id: 3, text: "Acho fácil fazer mais de uma coisa ao mesmo tempo" },
  { id: 4, text: "Se há uma interrupção, consigo voltar rapidamente ao que estava fazendo" },
  { id: 5, text: "Acho fácil 'ler nas entrelinhas' quando alguém está falando" },
  { id: 6, text: "Sei como saber se alguém está me ouvindo e se entedia" },
  { id: 7, text: "Quando estou lendo uma história, acho fácil saber as intenções dos personagens" },
  { id: 8, text: "Consigo captar rapidamente quando alguém diz uma coisa, mas quer dizer outra" },
  { id: 9, text: "Acho fácil entender o que alguém está pensando ou sentindo" },
  { id: 10, text: "Acho fácil saber o que falar em uma conversa" }
];

function KPICard({ title, value, subtitle, icon: Icon, color }) {
  return React.createElement('div', { className: 'kpi-card' },
    React.createElement('div', { className: 'kpi-content' },
      React.createElement('div', null,
        React.createElement('p', { className: 'kpi-title' }, title),
        React.createElement('p', { className: 'kpi-value', style: { color: color.replace('text-', '') } }, value),
        subtitle && React.createElement('p', { className: 'kpi-subtitle' }, subtitle)
      ),
      Icon && React.createElement(Icon, { className: 'kpi-icon', style: { color: color.replace('text-', '') } })
    )
  );
}

function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [ageDistribution, setAgeDistribution] = useState([]);
  const [genderDistribution, setGenderDistribution] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [riskFactors, setRiskFactors] = useState(null);
  const [scoreAnalysis, setScoreAnalysis] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [kpisRes, ageRes, genderRes, timelineRes, riskRes, scoreRes] = await Promise.all([
        fetch('http://localhost:8000/api/dashboard/kpis'),
        fetch('http://localhost:8000/api/dashboard/age-distribution'),
        fetch('http://localhost:8000/api/dashboard/gender-distribution'),
        fetch('http://localhost:8000/api/dashboard/timeline?days=30'),
        fetch('http://localhost:8000/api/dashboard/risk-factors'),
        fetch('http://localhost:8000/api/dashboard/score-analysis')
      ]);

      setKpis(await kpisRes.json());
      setAgeDistribution(await ageRes.json());
      setGenderDistribution(await genderRes.json());
      setTimeline(await timelineRes.json());
      setRiskFactors(await riskRes.json());
      setScoreAnalysis(await scoreRes.json());
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <Activity className="loading-spinner" />
          <p>Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Dashboard Analítico - TEA</h1>
          <p>Análise de triagens e métricas do sistema</p>
        </div>

        <div className="kpis-grid">
          <KPICard
            title="Total de Triagens"
            value={kpis?.total_screenings || 0}
            subtitle={`${kpis?.recent_screenings_7d || 0} nos últimos 7 dias`}
            icon={Activity}
            color="text-indigo-600"
          />
          <KPICard
            title="Taxa de Positividade"
            value={`${((kpis?.positive_rate || 0) * 100).toFixed(1)}%`}
            subtitle={`${kpis?.positive_cases || 0} casos positivos`}
            icon={TrendingUp}
            color="text-orange-600"
          />
          <KPICard
            title="Idade Média"
            value={kpis?.avg_age || 0}
            subtitle="anos"
            icon={Users}
            color="text-blue-600"
          />
          <KPICard
            title="Confiança Média"
            value={`${((kpis?.avg_confidence || 0) * 100).toFixed(1)}%`}
            subtitle="do modelo"
            icon={Brain}
            color="text-green-600"
          />
        </div>

        <div className="charts-grid">
          <div className="chart-card">
            <h2>Triagens ao Longo do Tempo (30 dias)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#6366f1" name="Total" strokeWidth={2} />
                <Line type="monotone" dataKey="positive" stroke="#ec4899" name="Positivos" strokeWidth={2} />
                <Line type="monotone" dataKey="negative" stroke="#10b981" name="Negativos" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h2>Distribuição por Gênero</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genderDistribution}
                  dataKey="total"
                  nameKey="gender"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.gender}: ${entry.total}`}
                >
                  {genderDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="gender-stats">
              {genderDistribution.map((item, idx) => (
                <div key={idx} className="stat-row">
                  <span className="stat-label">{item.gender}:</span>
                  <span className="stat-value">
                    {item.positive} positivos ({(item.positive_rate * 100).toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="chart-card-full">
          <h2>Distribuição por Faixa Etária</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ageDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="positive" fill="#ec4899" name="Positivos" />
              <Bar dataKey="negative" fill="#10b981" name="Negativos" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="risk-grid">
          <div className="chart-card">
            <h2>Impacto da Icterícia</h2>
            <div className="risk-factors">
              {riskFactors?.jundice?.map((item, idx) => (
                <div key={idx} className="risk-item">
                  <div className="risk-header">
                    <span className="risk-label">{item.value}</span>
                    <span className="risk-total">{item.total} casos</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${item.positive_rate * 100}%`, backgroundColor: '#f97316' }}
                    />
                  </div>
                  <p className="risk-stats">
                    {item.positive} positivos ({(item.positive_rate * 100).toFixed(1)}%)
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card">
            <h2>Histórico Familiar de Autismo</h2>
            <div className="risk-factors">
              {riskFactors?.family_history?.map((item, idx) => (
                <div key={idx} className="risk-item">
                  <div className="risk-header">
                    <span className="risk-label">{item.value}</span>
                    <span className="risk-total">{item.total} casos</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${item.positive_rate * 100}%`, backgroundColor: '#a855f7' }}
                    />
                  </div>
                  <p className="risk-stats">
                    {item.positive} positivos ({(item.positive_rate * 100).toFixed(1)}%)
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="chart-card-full">
          <h2>Análise dos Scores por Questão (AQ-10)</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={scoreAnalysis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="question" />
              <YAxis domain={[0, 1]} />
              <Tooltip formatter={(value) => value.toFixed(2)} />
              <Legend />
              <Bar dataKey="positive_avg" fill="#ec4899" name="Média TEA" />
              <Bar dataKey="negative_avg" fill="#10b981" name="Média Sem TEA" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function ScreeningForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    jundice: '',
    autism: '',
    used_app_before: 'no',
    answers: {}
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnswerChange = (questionId, value) => {
    setFormData(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: value }
    }));
  };

  const handleDemographicChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    if (step === 1) {
      return Object.keys(formData.answers).length === 10;
    }
    if (step === 2) {
      return formData.age && formData.gender && formData.jundice && formData.autism;
    }
    return false;
  };

  const submitScreening = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        A1_Score: formData.answers[1],
        A2_Score: formData.answers[2],
        A3_Score: formData.answers[3],
        A4_Score: formData.answers[4],
        A5_Score: formData.answers[5],
        A6_Score: formData.answers[6],
        A7_Score: formData.answers[7],
        A8_Score: formData.answers[8],
        A9_Score: formData.answers[9],
        A10_Score: formData.answers[10],
        age: parseInt(formData.age),
        gender: formData.gender,
        jundice: formData.jundice,
        autism: formData.autism,
        used_app_before: formData.used_app_before
      };

      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Erro na predição');

      const data = await response.json();
      setResult(data);
      setStep(3);
    } catch (err) {
      setError('Erro ao processar triagem. Verifique se o backend está rodando.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setFormData({
      age: '',
      gender: '',
      jundice: '',
      autism: '',
      used_app_before: 'no',
      answers: {}
    });
    setResult(null);
    setError(null);
  };

  return (
    <div className="screening-container">
      <div className="screening-content">
        <div className="screening-header">
          <div className="header-title">
            <Activity className="header-icon" />
            <h1>Triagem TEA</h1>
          </div>
          <p>Sistema de triagem inicial baseado no questionário AQ-10</p>
          
          <div className="progress-bar-container">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={`progress-step ${s === step ? 'active' : s < step ? 'completed' : ''}`}
              />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="form-card">
            <h2 className="form-title">
              <Info className="section-icon" />
              Questionário AQ-10
            </h2>
            <p className="form-subtitle">
              Para cada afirmação, indique se "Definitivamente concordo" (1) ou não (0).
            </p>

            <div className="questions-list">
              {questions.map(q => (
                <div key={q.id} className="question-item">
                  <p className="question-text">{q.id}. {q.text}</p>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name={`q${q.id}`}
                        value="1"
                        checked={formData.answers[q.id] === 1}
                        onChange={() => handleAnswerChange(q.id, 1)}
                        className="radio-input"
                      />
                      <span>Sim (1)</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name={`q${q.id}`}
                        value="0"
                        checked={formData.answers[q.id] === 0}
                        onChange={() => handleAnswerChange(q.id, 0)}
                        className="radio-input"
                      />
                      <span>Não (0)</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!canProceed()}
              className="btn-primary"
            >
              Próximo: Informações Demográficas
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="form-card">
            <h2 className="form-title">
              <User className="section-icon" />
              Informações Demográficas
            </h2>

            <div className="form-fields">
              <div className="form-field">
                <label className="field-label">Idade</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.age}
                  onChange={(e) => handleDemographicChange('age', e.target.value)}
                  className="field-input"
                  placeholder="Digite sua idade"
                />
              </div>

              <div className="form-field">
                <label className="field-label">Gênero</label>
                <div className="radio-group">
                  {[
                    { value: 'm', label: 'Masculino' },
                    { value: 'f', label: 'Feminino' }
                  ].map(option => (
                    <label key={option.value} className="radio-label">
                      <input
                        type="radio"
                        name="gender"
                        value={option.value}
                        checked={formData.gender === option.value}
                        onChange={(e) => handleDemographicChange('gender', e.target.value)}
                        className="radio-input"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-field">
                <label className="field-label">Teve icterícia ao nascer?</label>
                <div className="radio-group">
                  {[
                    { value: 'yes', label: 'Sim' },
                    { value: 'no', label: 'Não' }
                  ].map(option => (
                    <label key={option.value} className="radio-label">
                      <input
                        type="radio"
                        name="jundice"
                        value={option.value}
                        checked={formData.jundice === option.value}
                        onChange={(e) => handleDemographicChange('jundice', e.target.value)}
                        className="radio-input"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-field">
                <label className="field-label">Algum familiar imediato tem autismo?</label>
                <div className="radio-group">
                  {[
                    { value: 'yes', label: 'Sim' },
                    { value: 'no', label: 'Não' }
                  ].map(option => (
                    <label key={option.value} className="radio-label">
                      <input
                        type="radio"
                        name="autism"
                        value={option.value}
                        checked={formData.autism === option.value}
                        onChange={(e) => handleDemographicChange('autism', e.target.value)}
                        className="radio-input"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="error-alert">
                <AlertCircle className="alert-icon" />
                <span>{error}</span>
              </div>
            )}

            <div className="button-group">
              <button
                onClick={() => setStep(1)}
                className="btn-secondary"
              >
                Voltar
              </button>
              <button
                onClick={submitScreening}
                disabled={!canProceed() || loading}
                className="btn-primary"
              >
                {loading ? 'Processando...' : 'Finalizar Triagem'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && result && (
          <div className="form-card">
            <div className={`result-alert ${result.prediction === 'TEA' ? 'alert-warning' : 'alert-success'}`}>
              <div className="alert-content">
                {result.prediction === 'TEA' ? (
                  <AlertCircle className="alert-icon-large" />
                ) : (
                  <CheckCircle className="alert-icon-large" />
                )}
                <div>
                  <h2 className="result-title">
                    {result.prediction === 'TEA' ? 'Indicadores de TEA Detectados' : 'Baixo Risco de TEA'}
                  </h2>
                  <p className="result-confidence">
                    Confiança: {result.confidence} ({(result.confidence * 100).toFixed(1)}%)
                  </p>
                </div>
              </div>
            </div>

            <div className="result-info">
              <div className="info-section">
                <h3>Recomendação</h3>
                <p>{result.recommendation}</p>
              </div>

              <div className="info-box">
                <h3>Informações Importantes</h3>
                <ul>
                  <li>• Este é apenas um teste de triagem inicial</li>
                  <li>• Não substitui diagnóstico profissional</li>
                  <li>• Consulte um especialista para avaliação completa</li>
                </ul>
              </div>

              <div className="result-details">
                <p><strong>ID da triagem:</strong> {result.id}</p>
                <p><strong>Modelo:</strong> {result.model_type}</p>
                <p><strong>Data:</strong> {new Date(result.created_at).toLocaleString('pt-BR')}</p>
              </div>
            </div>

            <button
              onClick={resetForm}
              className="btn-primary"
            >
              Nova Triagem
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TEAScreeningApp() {
  const [currentView, setCurrentView] = useState('screening');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const DASHBOARD_PASSWORD = 'admin123';

  return (
    <div>
      <nav className="navbar">
        <div className="nav-content">
          <div className="nav-brand">
            <Activity className="brand-icon" />
            <span className="brand-text">Sistema TEA</span>
          </div>
          
          <div className="nav-buttons">
            <button
              onClick={() => {
                setCurrentView('screening');
                setIsAuthenticated(false);
              }}
              className={`nav-btn ${currentView === 'screening' ? 'active' : ''}`}
            >
              <User className="btn-icon" />
              Triagem
            </button>
            
            {!isAuthenticated ? (
              <button
                onClick={() => {
                  const pass = prompt('Digite a senha do dashboard:');
                  if (pass === DASHBOARD_PASSWORD) {
                    setIsAuthenticated(true);
                    setCurrentView('dashboard');
                  } else if (pass) {
                    alert('Senha incorreta!');
                  }
                }}
                className="nav-btn"
              >
                <Lock className="btn-icon" />
                Dashboard Analítico
              </button>
            ) : (
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
              >
                <BarChart3 className="btn-icon" />
                Dashboard
              </button>
            )}
          </div>
        </div>
      </nav>

      {currentView === 'screening' && <ScreeningForm />}
      {currentView === 'dashboard' && isAuthenticated && <Dashboard />}
    </div>
  );
}

export default TEAScreeningApp;