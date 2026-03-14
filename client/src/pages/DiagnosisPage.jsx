import React, { useState, useEffect } from 'react';
import { Heart, Droplets, Thermometer, Ghost, Loader2 } from 'lucide-react';
import axios from 'axios';
import { BarChart, Bar, RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

// Helper function to get vital status color
const getVitalColor = (value, normal_min, normal_max) => {
  const num = parseFloat(value);
  if (num >= normal_min && num <= normal_max) return '#10b981'; // green
  if (num >= normal_min - 10 && num <= normal_max + 10) return '#f59e0b'; // yellow
  return '#ef4444'; // red
};

// Helper function to calculate risk score
const calculateRiskScore = (vitals, selectedSymptoms) => {
  let score = 50; // Base score
  
  // Adjust based on vitals
  const hr = parseFloat(vitals.heartRate);
  const bpSys = parseFloat(vitals.bloodPressure?.split('/')?.[0] || 0);
  const temp = parseFloat(vitals.temperature);
  const spo2 = parseFloat(vitals.spO2);

  if (hr < 60 || hr > 100) score += 15;
  if (bpSys < 90 || bpSys > 140) score += 15;
  if (temp < 97 || temp > 99) score += 15;
  if (spo2 < 95) score += 20;

  // Adjust based on symptoms count
  score += selectedSymptoms.length * 5;

  return Math.min(Math.max(score, 0), 100);
};

// Helper function to parse conditions from analysis
const parseConditions = (analysis) => {
  if (!analysis) return [];
  
  const text = analysis;
  // Try to extract conditions from the analysis text
  const conditionPatterns = [
    'Common Cold',
    'Flu',
    'COVID-19',
    'Pneumonia',
    'Bronchitis',
    'Asthma',
    'Migraine',
    'Hypertension',
    'Diabetes',
    'Dehydration',
    'Infection',
    'Anxiety',
    'Stress'
  ];

  const foundConditions = conditionPatterns
    .map(condition => ({
      name: condition,
      probability: Math.floor(Math.random() * 40) + 20 // 20-60% for demo
    }))
    .filter(c => text.toLowerCase().includes(c.name.toLowerCase()))
    .slice(0, 5);

  // If no conditions found, return generic probabilities
  if (foundConditions.length === 0) {
    return [
      { name: 'Viral Infection', probability: 45 },
      { name: 'Bacterial Infection', probability: 30 },
      { name: 'Inflammatory Response', probability: 25 }
    ];
  }

  return foundConditions;
};

// ===== MEMOIZED CHARTS COMPONENT =====
// This component never re-renders when displayedText changes
// Only depends on: results, vitals, selectedSymptoms
const DiagnosisCharts = React.memo(({ results, vitals, selectedSymptoms }) => {
  // Calculate data inside memoized component
  const riskScore = calculateRiskScore(vitals, selectedSymptoms);
  const riskData = [{ 
    name: 'Risk', 
    value: riskScore, 
    maxValue: 100, 
    fill: riskScore > 70 ? '#ef4444' : riskScore > 40 ? '#f59e0b' : '#10b981' 
  }];
  const conditions = parseConditions(results?.analysis);
  
  const vitalGaugeData = [
    {
      name: 'Heart Rate',
      value: parseFloat(vitals.heartRate) || 0,
      maxValue: 120,
      normalMin: 60,
      normalMax: 100,
      fill: getVitalColor(vitals.heartRate, 60, 100),
      unit: 'BPM'
    },
    {
      name: 'Blood Pressure',
      value: parseFloat(vitals.bloodPressure?.split('/')?.[0] || 0),
      maxValue: 180,
      normalMin: 90,
      normalMax: 120,
      fill: getVitalColor(vitals.bloodPressure?.split('/')?.[0] || 0, 90, 120),
      unit: 'mmHg'
    },
    {
      name: 'Temperature',
      value: parseFloat(vitals.temperature) || 0,
      maxValue: 105,
      normalMin: 97,
      normalMax: 99,
      fill: getVitalColor(vitals.temperature, 97, 99),
      unit: '°F'
    },
    {
      name: 'SpO₂',
      value: parseFloat(vitals.spO2) || 0,
      maxValue: 100,
      normalMin: 95,
      normalMax: 100,
      fill: getVitalColor(vitals.spO2, 95, 100),
      unit: '%'
    }
  ];

  return (
    <div className="mb-10 space-y-10">
      {/* Vitals Gauges */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-5">Vital Signs Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {vitalGaugeData.map((vital, idx) => (
            <div key={idx} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-5 min-h-[255px]">
              <p className="text-base font-semibold text-gray-700 mb-2 text-center">{vital.name}</p>
              <ResponsiveContainer width="100%" height={185}>
                <RadialBarChart
                  data={[vital]}
                  startAngle={180}
                  endAngle={0}
                  innerRadius="62%"
                  outerRadius="96%"
                  cy="88%"
                >
                  <PolarAngleAxis
                    type="number"
                    domain={[0, vital.maxValue]}
                    angleAxisId={0}
                    tick={false}
                  />
                  <RadialBar background dataKey="value" cornerRadius={10} angleAxisId={0} clockWise />
                </RadialBarChart>
              </ResponsiveContainer>
              <p className="text-center text-xl font-bold text-gray-800">{vital.value} {vital.unit}</p>
              <p className="text-sm text-center text-gray-500 mt-1">
                {vital.value >= vital.normalMin && vital.value <= vital.normalMax ? '✓ Normal' : '✗ Abnormal'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Score */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-5">Overall Risk Score</h3>
        <div className="flex items-center justify-center">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-10 w-full md:w-3/4">
            <ResponsiveContainer width="100%" height={330}>
              <RadialBarChart
                data={riskData}
                startAngle={180}
                endAngle={0}
                innerRadius="58%"
                outerRadius="92%"
                cy="86%"
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background dataKey="value" cornerRadius={15} angleAxisId={0} clockWise />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="text-center">
              <p className="text-5xl font-bold" style={{ color: riskData[0].fill }}>
                {riskScore}%
              </p>
              <p className="text-gray-700 font-semibold mt-2 text-lg">
                {riskScore > 70 ? 'High Risk' : riskScore > 40 ? 'Moderate Risk' : 'Low Risk'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conditions Probability */}
      {conditions.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-5">Possible Conditions</h3>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
            <ResponsiveContainer width="100%" height={340}>
              <BarChart
                data={conditions}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 120, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={110} />
                <Tooltip />
                <Bar dataKey="probability" fill="#a855f7" radius={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
});

DiagnosisCharts.displayName = 'DiagnosisCharts';

export default function DiagnosisPage() {
  const [vitals, setVitals] = useState({
    heartRate: '',
    bloodPressure: '',
    temperature: '',
    spO2: ''
  });
  const [bpSystolic, setBpSystolic] = useState('');
  const [bpDiastolic, setBpDiastolic] = useState('');

  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [medicalHistory, setMedicalHistory] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentHour, setAppointmentHour] = useState('');
  const [appointmentMinute, setAppointmentMinute] = useState('');
  const [appointmentPeriod, setAppointmentPeriod] = useState('AM');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [patientName, setPatientName] = useState('');

  // Simple doctor list (no hardcoded availability)
  const doctors = [
    { name: 'Dr. Priya Sharma', specialty: 'Cardiologist', photo: '👩‍⚕️' },
    { name: 'Dr. Rahul Mehta', specialty: 'General Physician', photo: '👨‍⚕️' },
    { name: 'Dr. Anita Reddy', specialty: 'Neurologist', photo: '👩‍⚕️' }
  ];

  const symptoms = [
    'Fever',
    'Cough',
    'Chest Pain',
    'Headache',
    'Fatigue',
    'Breathlessness',
    'Abdominal Pain',
    'Nausea',
    'Joint Pain',
    'Dizziness',
    'Skin Rash',
    'Mental Health'
  ];

  // Helper function to check if emergency is real (contains emergency keywords)
  const hasRealEmergency = (emergencyText) => {
    if (!emergencyText) return false;
    const emergencyKeywords = [
      'chest pain',
      'breathing difficulty',
      'severe shortness of breath',
      'stroke',
      'heart attack',
      'seizure',
      'severe bleeding',
      'loss of consciousness',
      'severe allergic reaction',
      'severe trauma',
      'poisoning',
      'severe burns',
      'choking'
    ];
    const lowerText = emergencyText.toLowerCase();
    return emergencyKeywords.some(keyword => lowerText.includes(keyword));
  };

  const isWithinRange = (value, min, max) => {
    const num = parseFloat(value);
    return !Number.isNaN(num) && num >= min && num <= max;
  };

  const systolic = parseFloat(bpSystolic);
  const diastolic = parseFloat(bpDiastolic);

  const vitalsValidation = {
    heartRate: isWithinRange(vitals.heartRate, 30, 220),
    bloodPressure:
      !Number.isNaN(systolic) &&
      !Number.isNaN(diastolic) &&
      systolic > diastolic &&
      isWithinRange(bpSystolic, 70, 250) &&
      isWithinRange(bpDiastolic, 40, 150),
    temperature: isWithinRange(vitals.temperature, 90, 110),
    spO2: isWithinRange(vitals.spO2, 50, 100),
  };

  const allVitalsValid = Object.values(vitalsValidation).every(Boolean);



  const toggleSymptom = (symptom) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleRunDiagnosis = async () => {
    if (!allVitalsValid) {
      setError('Please enter valid vitals in the suggested ranges before analyzing.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setResults(null);

      const response = await axios.post('/api/diagnosis/analyze', {
        vitals: {
          heartRate: vitals.heartRate,
          bloodPressure: vitals.bloodPressure,
          temperature: vitals.temperature,
          spo2: vitals.spO2
        },
        symptoms: selectedSymptoms,
        medicalHistory: medicalHistory
      }, { withCredentials: true });

      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get diagnosis. Please try again.');
      console.error('Diagnosis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !appointmentDate || !appointmentHour || !appointmentMinute || !appointmentPeriod) {
      alert('Please select a doctor, date, and time');
      return;
    }

    if (!patientName.trim()) {
      alert('Please enter your name');
      return;
    }

    try {
      setBookingLoading(true);
      const riskScore = calculateRiskScore(vitals, selectedSymptoms);
      const formattedAppointmentTime = `${appointmentHour}:${appointmentMinute} ${appointmentPeriod}`;
      
      await axios.post('/api/appointments/book', {
        patientName: patientName.trim(),
        doctorName: selectedDoctor.name,
        specialty: selectedDoctor.specialty,
        date: appointmentDate,
        time: formattedAppointmentTime,
        patientSymptoms: selectedSymptoms,
        riskScore: riskScore,
        diagnosis: results?.analysis || ''
      }, { withCredentials: true });

      setSuccessMessage(`Appointment booked with ${selectedDoctor.name} on ${appointmentDate} at ${formattedAppointmentTime}`);
      setShowAppointmentModal(false);
      setSelectedDoctor(null);
      setAppointmentDate('');
      setAppointmentHour('');
      setAppointmentMinute('');
      setAppointmentPeriod('AM');
      setPatientName('');

      // Show success message for 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      alert('Failed to book appointment: ' + (err.response?.data?.message || err.message));
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🩺</div>
          <h1 className="text-4xl font-serif font-bold text-gray-800 mb-3">
            Vitals & Symptoms
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Enter your vitals and symptoms. AI will analyze your health status.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-xl text-red-700 font-semibold">
            {error}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 rounded-xl text-green-700 font-semibold animate-bounce">
            ✅ {successMessage}
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="mb-6 p-4 bg-blue-100 border border-blue-400 rounded-xl text-blue-700 font-semibold flex items-center gap-2">
            <Loader2 size={20} className="animate-spin" />
            AI is analyzing your vitals and symptoms in real-time...
          </div>
        )}

        {/* Section 1: Current Vitals */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 tracking-wide">CURRENT VITALS</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Heart Rate */}
            <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100">
              <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                <Heart size={20} className="text-red-500" />
                Heart Rate (BPM)
              </label>
              <input
                type="number"
                value={vitals.heartRate}
                onChange={(e) => setVitals({...vitals, heartRate: e.target.value})}
                min="30"
                max="220"
                placeholder="e.g., 72"
                className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900 placeholder-gray-400"
              />
              <p className={`mt-2 text-xs ${vitals.heartRate && !vitalsValidation.heartRate ? 'text-red-600' : 'text-gray-500'}`}>
                Expected range: 30-220 BPM
              </p>
            </div>

            {/* Blood Pressure */}
            <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100">
              <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                <Droplets size={20} className="text-blue-500" />
                Blood Pressure
              </label>
              <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                <input
                  type="number"
                  value={bpSystolic}
                  onChange={(e) => {
                    const value = e.target.value;
                    setBpSystolic(value);
                    const nextBloodPressure = value && bpDiastolic ? `${value}/${bpDiastolic}` : '';
                    setVitals({ ...vitals, bloodPressure: nextBloodPressure });
                  }}
                  min="70"
                  max="250"
                  placeholder="Systolic"
                  className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900 placeholder-gray-400"
                />
                <span className="text-gray-500 font-bold">/</span>
                <input
                  type="number"
                  value={bpDiastolic}
                  onChange={(e) => {
                    const value = e.target.value;
                    setBpDiastolic(value);
                    const nextBloodPressure = bpSystolic && value ? `${bpSystolic}/${value}` : '';
                    setVitals({ ...vitals, bloodPressure: nextBloodPressure });
                  }}
                  min="40"
                  max="150"
                  placeholder="Diastolic"
                  className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900 placeholder-gray-400"
                />
              </div>
              <p className={`mt-2 text-xs ${(bpSystolic || bpDiastolic) && !vitalsValidation.bloodPressure ? 'text-red-600' : 'text-gray-500'}`}>
                Enter as systolic/diastolic. Systolic must be higher.
              </p>
            </div>

            {/* Temperature */}
            <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100">
              <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                <Thermometer size={20} className="text-orange-500" />
                Temperature (°F)
              </label>
              <input
                type="number"
                value={vitals.temperature}
                onChange={(e) => setVitals({...vitals, temperature: e.target.value})}
                min="90"
                max="110"
                step="0.1"
                placeholder="e.g., 98.6"
                className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900 placeholder-gray-400"
              />
              <p className={`mt-2 text-xs ${vitals.temperature && !vitalsValidation.temperature ? 'text-red-600' : 'text-gray-500'}`}>
                Expected range: 90.0-110.0 °F
              </p>
            </div>

            {/* SpO2 */}
            <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100">
              <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                <Ghost size={20} className="text-cyan-500" />
                SpO₂ (Oxygen %)
              </label>
              <input
                type="number"
                value={vitals.spO2}
                onChange={(e) => setVitals({...vitals, spO2: e.target.value})}
                min="50"
                max="100"
                placeholder="e.g., 98"
                className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900 placeholder-gray-400"
              />
              <p className={`mt-2 text-xs ${vitals.spO2 && !vitalsValidation.spO2 ? 'text-red-600' : 'text-gray-500'}`}>
                Expected range: 50-100%
              </p>
            </div>
          </div>
        </div>

        {/* Manual Diagnosis Button */}
        <div className="mb-8 flex justify-center">
          <button
            onClick={handleRunDiagnosis}
            disabled={loading || !allVitalsValid}
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-green-300 disabled:to-emerald-400 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center gap-3 transform hover:scale-105 active:scale-95 text-lg w-full md:w-auto justify-center"
          >
            {loading ? (
              <>
                <Loader2 size={24} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                🧠 Analyze My Vitals & Symptoms →
              </>
            )}
          </button>
        </div>

        {/* Section 2: Select Symptoms */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 tracking-wide">SELECT SYMPTOMS</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {symptoms.map(symptom => (
              <button
                key={symptom}
                onClick={() => toggleSymptom(symptom)}
                className={`px-4 py-2.5 rounded-xl font-semibold transition-all ${
                  selectedSymptoms.includes(symptom)
                    ? 'bg-purple-500 text-white shadow-lg border-2 border-purple-700'
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300'
                }`}
              >
                {symptom}
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Medical History */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 tracking-wide">MEDICAL HISTORY (OPTIONAL)</h2>
          <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100">
            <textarea
              value={medicalHistory}
              onChange={(e) => setMedicalHistory(e.target.value)}
              placeholder="Enter any relevant medical history, allergies, or medications..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none text-gray-900 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Results Section */}
        {results && (
          <div className="bg-white rounded-3xl p-7 md:p-10 shadow-xl border-2 border-green-300 animate-in fade-in">
            <h2 className="text-3xl font-bold text-green-700 mb-7 flex items-center gap-2">
              ✅ AI Diagnosis Results
            </h2>

            {/* Charts Grid - Memoized Component (never re-renders with text changes) */}
            <DiagnosisCharts results={results} vitals={vitals} selectedSymptoms={selectedSymptoms} />

            {/* Text Analysis - Appears instantly (no streaming) */}
            <div className="border-t-2 pt-6 mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Detailed Analysis</h3>
              <div className="prose prose-sm max-w-none text-gray-700">
                <div className="whitespace-pre-wrap text-base leading-relaxed mb-6 min-h-12">
                  {results.analysis}
                </div>
              </div>
            </div>

            {results.emergency && calculateRiskScore(vitals, selectedSymptoms) > 60 && hasRealEmergency(results.emergency) && (
              <div className="p-4 bg-red-100 border-l-4 border-red-600 rounded-lg mb-6">
                <p className="text-red-800 font-bold">⚠️ Emergency Warning:</p>
                <p className="text-red-700">{results.emergency}</p>
              </div>
            )}

            <div className="text-sm text-gray-500 italic border-t pt-4 mb-6">
              ⚕️ Disclaimer: This is an AI analysis for informational purposes only. Always consult with a qualified healthcare professional for proper diagnosis and treatment.
            </div>

            {/* Book Appointment Button */}
            <div className="flex justify-center">
              <button
                onClick={() => {
                  setShowAppointmentModal(true);
                  setSelectedDoctor(null);
                  setAppointmentDate('');
                  setAppointmentHour('');
                  setAppointmentMinute('');
                  setAppointmentPeriod('AM');
                  setPatientName('');
                }}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center gap-2 transform hover:scale-105"
              >
                📅 Book Now
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Appointment Booking Modal */}
      {showAppointmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Book Appointment</h2>
              <button
                onClick={() => setShowAppointmentModal(false)}
                className="text-white text-2xl hover:bg-white hover:text-purple-500 rounded-full w-10 h-10 flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8">
              {/* Summary Info */}
              <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
                <p className="text-sm text-gray-700"><span className="font-semibold">Booking for:</span> {selectedSymptoms.length > 0 ? selectedSymptoms.join(', ') : 'No symptoms selected'}</p>
                <p className="text-sm text-gray-700 mt-1"><span className="font-semibold">Risk Score:</span> <span className="text-purple-600 font-bold">{calculateRiskScore(vitals, selectedSymptoms)}%</span></p>
              </div>

              {/* Patient Name Input */}
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">Your Name *</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 rounded-xl bg-white border-2 border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900 placeholder-gray-400 font-medium"
                />
              </div>

              {/* Doctor Selection */}
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">Select Doctor *</label>
                <div className="grid grid-cols-1 gap-3">
                  {doctors.map((doctor, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedDoctor(doctor)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        selectedDoctor?.name === doctor.name
                          ? 'bg-purple-100 border-purple-500 shadow-lg'
                          : 'bg-white border-gray-300 hover:border-purple-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{doctor.photo}</span>
                        <div>
                          <p className="font-bold text-gray-800">{doctor.name}</p>
                          <p className="text-sm text-purple-600">{doctor.specialty}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Picker */}
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">Appointment Date *</label>
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-xl bg-white border-2 border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900 font-medium"
                />
              </div>

              {/* Time Picker */}
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-3">Appointment Time *</label>
                <div className="grid grid-cols-3 gap-3">
                  <select
                    value={appointmentHour}
                    onChange={(e) => setAppointmentHour(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white border-2 border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium text-gray-900"
                  >
                    <option value="">Hour</option>
                    {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>

                  <select
                    value={appointmentMinute}
                    onChange={(e) => setAppointmentMinute(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white border-2 border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium text-gray-900"
                  >
                    <option value="">Minute</option>
                    {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>

                  <select
                    value={appointmentPeriod}
                    onChange={(e) => setAppointmentPeriod(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white border-2 border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium text-gray-900"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>

              {/* Confirm Button */}
              <div className="mt-8 flex gap-4">
                <button
                  onClick={() => setShowAppointmentModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-800 font-bold rounded-xl hover:bg-gray-200 border border-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBookAppointment}
                  disabled={!selectedDoctor || !appointmentDate || !appointmentHour || !appointmentMinute || !appointmentPeriod || bookingLoading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold rounded-xl hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {bookingLoading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Booking...
                    </>
                  ) : (
                    '✅ Confirm Booking'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
