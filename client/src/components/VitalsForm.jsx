import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Heart, Droplets, Wind, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';

const VitalsForm = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [vitals, setVitals] = useState({
    heartRate: '',
    systolicBP: '',
    diastolicBP: '',
    temperature: '',
    oxygenSaturation: '',
    medicalHistory: '',
  });

  const [symptoms, setSymptoms] = useState([]);

  const symptomOptions = [
    { id: 'chest_pain', label: 'Chest Pain', icon: Heart },
    { id: 'shortness_breath', label: 'Shortness of Breath', icon: Wind },
    { id: 'dizziness', label: 'Dizziness' },
    { id: 'fatigue', label: 'Fatigue' },
    { id: 'headache', label: 'Headache' },
    { id: 'fever', label: 'Fever' },
    { id: 'cough', label: 'Cough' },
    { id: 'nausea', label: 'Nausea' },
    { id: 'abdominal_pain', label: 'Abdominal Pain' },
    { id: 'body_aches', label: 'Body Aches' },
    { id: 'sore_throat', label: 'Sore Throat' },
    { id: 'sweating', label: 'Excessive Sweating' },
  ];

  const validateVitals = () => {
    const newErrors = {};

    if (!vitals.heartRate || vitals.heartRate < 40 || vitals.heartRate > 200) {
      newErrors.heartRate = 'Heart rate should be between 40-200 BPM';
    }
    if (!vitals.systolicBP || vitals.systolicBP < 70 || vitals.systolicBP > 250) {
      newErrors.systolicBP = 'Systolic BP should be between 70-250';
    }
    if (!vitals.diastolicBP || vitals.diastolicBP < 40 || vitals.diastolicBP > 150) {
      newErrors.diastolicBP = 'Diastolic BP should be between 40-150';
    }
    if (!vitals.temperature || vitals.temperature < 35 || vitals.temperature > 42) {
      newErrors.temperature = 'Temperature should be between 35-42°C';
    }
    if (!vitals.oxygenSaturation || vitals.oxygenSaturation < 70 || vitals.oxygenSaturation > 100) {
      newErrors.oxygenSaturation = 'SpO2 should be between 70-100%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleVitalChange = (e) => {
    const { name, value } = e.target;
    setVitals(prev => ({
      ...prev,
      [name]: value ? parseFloat(value) : ''
    }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const toggleSymptom = (symptomId) => {
    setSymptoms(prev =>
      prev.includes(symptomId)
        ? prev.filter(id => id !== symptomId)
        : [...prev, symptomId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateVitals()) {
      toast.error('Please fix the validation errors');
      return;
    }

    if (symptoms.length === 0) {
      toast.error('Please select at least one symptom');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_PYTHON_SERVER_URL || 'http://localhost:5000'}/api/diagnosis`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vitals: {
              heartRate: vitals.heartRate,
              systolicBP: vitals.systolicBP,
              diastolicBP: vitals.diastolicBP,
              temperature: vitals.temperature,
              oxygenSaturation: vitals.oxygenSaturation,
            },
            symptoms,
            medicalHistory: vitals.medicalHistory,
            userId: user?.id || 'anonymous',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get diagnosis');
      }

      const result = await response.json();
      toast.success('Analysis complete!');

      // Navigate to results page with the diagnosis data
      navigate('/diagnosis-results', {
        state: {
          diagnosis: result,
          vitals,
          symptoms,
        },
      });
    } catch (error) {
      console.error('Diagnosis error:', error);
      toast.error(error.message || 'Failed to get diagnosis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-lg">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Activity className="w-8 h-8 text-[#00C853]" />
          Health Check & Symptom Assessment
        </h2>
        <p className="text-gray-600 mt-2">
          Enter your vital signs and describe your symptoms for an AI-powered health assessment
        </p>
      </div>

      {/* Medical Disclaimer */}
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900">
          <p className="font-semibold">Medical Disclaimer</p>
          <p className="mt-1">
            This assessment is for informational purposes only and should not replace professional medical advice. 
            Always consult with a healthcare provider for accurate diagnosis and treatment.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Vital Signs Section */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Droplets className="w-5 h-5 text-blue-600" />
            Vital Signs
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Heart Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heart Rate (BPM)
              </label>
              <input
                type="number"
                name="heartRate"
                value={vitals.heartRate}
                onChange={handleVitalChange}
                placeholder="60-100"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.heartRate
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.heartRate && (
                <p className="text-red-500 text-sm mt-1">{errors.heartRate}</p>
              )}
            </div>

            {/* Systolic BP */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Systolic BP (mmHg)
              </label>
              <input
                type="number"
                name="systolicBP"
                value={vitals.systolicBP}
                onChange={handleVitalChange}
                placeholder="90-120"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.systolicBP
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.systolicBP && (
                <p className="text-red-500 text-sm mt-1">{errors.systolicBP}</p>
              )}
            </div>

            {/* Diastolic BP */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diastolic BP (mmHg)
              </label>
              <input
                type="number"
                name="diastolicBP"
                value={vitals.diastolicBP}
                onChange={handleVitalChange}
                placeholder="60-80"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.diastolicBP
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.diastolicBP && (
                <p className="text-red-500 text-sm mt-1">{errors.diastolicBP}</p>
              )}
            </div>

            {/* Temperature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperature (°C)
              </label>
              <input
                type="number"
                name="temperature"
                value={vitals.temperature}
                onChange={handleVitalChange}
                placeholder="36.5"
                step="0.1"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.temperature
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.temperature && (
                <p className="text-red-500 text-sm mt-1">{errors.temperature}</p>
              )}
            </div>

            {/* Oxygen Saturation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Oxygen Saturation (SpO2 %)
              </label>
              <input
                type="number"
                name="oxygenSaturation"
                value={vitals.oxygenSaturation}
                onChange={handleVitalChange}
                placeholder="95-100"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.oxygenSaturation
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.oxygenSaturation && (
                <p className="text-red-500 text-sm mt-1">{errors.oxygenSaturation}</p>
              )}
            </div>
          </div>
        </div>

        {/* Symptoms Section */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Select Your Symptoms</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {symptomOptions.map(symptom => {
              const IconComponent = symptom.icon;
              return (
                <button
                  key={symptom.id}
                  type="button"
                  onClick={() => toggleSymptom(symptom.id)}
                  className={`p-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    symptoms.includes(symptom.id)
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-green-400'
                  }`}
                >
                  {IconComponent && (
                    <IconComponent className="w-4 h-4" />
                  )}
                  <span>{symptom.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Medical History */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Medical History (Optional)</h3>
          <textarea
            name="medicalHistory"
            value={vitals.medicalHistory}
            onChange={(e) =>
              setVitals(prev => ({
                ...prev,
                medicalHistory: e.target.value,
              }))
            }
            placeholder="Any relevant medical conditions, medications, or allergies..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows="4"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !vitals.heartRate || !vitals.systolicBP || !vitals.diastolicBP || !vitals.temperature || !vitals.oxygenSaturation || symptoms.length === 0}
          className="w-full bg-gradient-to-r from-[#00C853] to-[#00B248] hover:from-[#00B248] hover:to-[#009C3C] disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all duration-200 shadow-lg"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Analyzing...
            </div>
          ) : (
            'Get Health Assessment'
          )}
        </button>
      </form>
    </div>
  );
};

export default VitalsForm;
