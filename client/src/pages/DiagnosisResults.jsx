import React, { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Heart, Activity, ArrowLeft, Download } from 'lucide-react';
import toast from 'react-hot-toast';

const DiagnosisResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { diagnosis, vitals, symptoms } = location.state || {};

  if (!diagnosis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Diagnosis Data</h2>
          <p className="text-gray-600 mb-6">Please complete the health assessment first.</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleDownload = () => {
    const report = `
HEALTH ASSESSMENT REPORT
Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}

VITAL SIGNS:
- Heart Rate: ${vitals.heartRate} BPM
- Blood Pressure: ${vitals.systolicBP}/${vitals.diastolicBP} mmHg
- Temperature: ${vitals.temperature}°C
- Oxygen Saturation: ${vitals.oxygenSaturation}%

SYMPTOMS REPORTED:
${symptoms.join('\n')}

ASSESSMENT:
${diagnosis.analysis || 'No analysis available'}

RECOMMENDATIONS:
${diagnosis.recommendations || 'No recommendations available'}

DISCLAIMER:
This assessment is for informational purposes only and should not replace professional medical advice.
    `;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(report));
    element.setAttribute('download', `health-assessment-${Date.now()}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Report downloaded!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Health Check
        </button>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Title Section */}
          <div className="bg-gradient-to-r from-[#00C853] to-[#00B248] p-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-8 h-8" />
              <h1 className="text-3xl font-bold">Health Assessment Results</h1>
            </div>
            <p className="text-green-100">
              Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
            </p>
          </div>

          <div className="p-8 space-y-8">
            {/* Medical Disclaimer - More Prominent */}
            <div className="px-6 py-4 bg-red-50 border-l-4 border-red-500 rounded">
              <div className="flex gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-red-900 mb-1">Important Medical Disclaimer</h3>
                  <p className="text-red-800 text-sm">
                    This AI-powered assessment is for informational purposes only. It is NOT a medical diagnosis 
                    and should never replace professional medical advice, examination, or treatment by a licensed healthcare provider. 
                    If you experience severe symptoms or medical emergency, contact emergency services immediately.
                  </p>
                </div>
              </div>
            </div>

            {/* Vital Signs Summary */}
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-blue-600" />
                Your Vital Signs
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Heart Rate</p>
                  <p className="text-2xl font-bold text-blue-600">{vitals.heartRate} BPM</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Blood Pressure</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {vitals.systolicBP}/{vitals.diastolicBP}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Temperature</p>
                  <p className="text-2xl font-bold text-blue-600">{vitals.temperature}°C</p>
                </div>
                <div className="bg-white p-4 rounded-lg md:col-span-2">
                  <p className="text-sm text-gray-600">Oxygen Saturation</p>
                  <p className="text-2xl font-bold text-blue-600">{vitals.oxygenSaturation}%</p>
                </div>
              </div>
            </div>

            {/* Analysis */}
            <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4">AI Health Analysis</h2>
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {diagnosis.analysis || 'No analysis available'}
              </div>
            </div>

            {/* Recommendations */}
            {diagnosis.recommendations && (
              <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Recommendations</h2>
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {diagnosis.recommendations}
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="bg-amber-50 rounded-lg p-6 border border-amber-200">
              <h3 className="font-bold text-amber-900 mb-3">Next Steps:</h3>
              <ul className="text-amber-900 space-y-2 list-disc list-inside">
                <li>Schedule an appointment with your healthcare provider</li>
                <li>Share this assessment with your doctor for review</li>
                <li>Do not delay professional medical care based on this assessment</li>
                <li>Keep track of your vital signs regularly</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 flex-col sm:flex-row">
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
              >
                <Download className="w-5 h-5" />
                Download Report
              </button>
              <button
                onClick={() => navigate('/')}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisResults;
