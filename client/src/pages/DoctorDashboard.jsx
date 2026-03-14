import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Clock, Users } from 'lucide-react';
import axios from 'axios';

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [stats, setStats] = useState({
    totalToday: 0,
    emergencies: 0,
    pending: 0,
    completed: 0,
    topLoadedDoctor: 'N/A',
    recommendedDoctor: 'N/A'
  });
  const navigate = useNavigate();
  const isAdminLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';

  useEffect(() => {
    if (!isAdminLoggedIn) {
      navigate('/doctor-login');
    }
  }, [isAdminLoggedIn, navigate]);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get('/api/appointments/list', {
        withCredentials: true
      });
      setAppointments(response.data.appointments || []);
      
      // Calculate stats
      const today = new Date().toDateString();
      const appointmentsToday = response.data.appointments?.filter(
        a => new Date(a.date).toDateString() === today
      ) || [];

      const activeAppointments = (response.data.appointments || []).filter(
        a => a.status === 'Pending' || a.status === 'Confirmed'
      );

      const doctorLoadMap = activeAppointments.reduce((acc, apt) => {
        const key = apt.doctorName || 'Unassigned';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      const doctorLoads = Object.entries(doctorLoadMap).sort((a, b) => b[1] - a[1]);
      const topLoadedDoctor = doctorLoads[0]?.[0] || 'N/A';
      const recommendedDoctor = doctorLoads.length > 0
        ? [...doctorLoads].sort((a, b) => a[1] - b[1])[0][0]
        : 'N/A';
      
      setStats({
        totalToday: appointmentsToday.length,
        emergencies: response.data.appointments?.filter(a => a.triageLevel === 'EMERGENCY').length || 0,
        pending: response.data.appointments?.filter(a => a.status === 'Pending').length || 0,
        completed: response.data.appointments?.filter(a => a.status === 'Completed').length || 0,
        topLoadedDoctor,
        recommendedDoctor
      });
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    }
  };

  const getTriageColor = (triageLevel) => {
    switch (triageLevel) {
      case 'EMERGENCY': return 'bg-red-100 text-red-800';
      case 'URGENT': return 'bg-yellow-100 text-yellow-800';
      case 'ROUTINE': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskScoreColor = (riskScore) => {
    if (riskScore > 70) return 'text-red-600 font-bold';
    if (riskScore > 40) return 'text-yellow-600 font-bold';
    return 'text-green-600 font-bold';
  };

  const triagePriority = { EMERGENCY: 3, URGENT: 2, ROUTINE: 1 };

  const filteredAppointments = appointments.filter(apt => {
    if (selectedFilter === 'All') return true;
    return apt.triageLevel === selectedFilter;
  }).sort((a, b) => {
    const triageDiff = (triagePriority[b.triageLevel] || 0) - (triagePriority[a.triageLevel] || 0);
    if (triageDiff !== 0) return triageDiff;
    return new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date);
  });

  const updateStatus = async (appointmentId, newStatus) => {
    try {
      await axios.patch(`/api/appointments/${appointmentId}/status`, {
        status: newStatus
      }, { withCredentials: true });
      fetchAppointments();
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold text-gray-800">👨‍⚕️ Doctor Admin Panel</h1>
            </div>
            <p className="text-gray-600">Manage patient appointments and triage cases</p>
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem('adminLoggedIn');
              navigate('/doctor-login');
            }}
            className="inline-flex items-center gap-2 rounded-full border border-purple-300 bg-white/80 px-5 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-50"
          >
            🚪 Logout
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Total Patients Today */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Users size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm font-semibold">Patients Today</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalToday}</p>
              </div>
            </div>
          </div>

          {/* Emergency Cases */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-red-200">
            <div className="flex items-center gap-4">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertCircle size={24} className="text-red-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm font-semibold">EMERGENCY</p>
                <p className="text-3xl font-bold text-red-600">{stats.emergencies}</p>
              </div>
            </div>
          </div>

          {/* Pending Appointments */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-yellow-200">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock size={24} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm font-semibold">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </div>

          {/* Completed Appointments */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-green-200">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm font-semibold">Completed</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="mb-6 flex gap-3 flex-wrap">
          {['All', 'EMERGENCY', 'URGENT', 'ROUTINE'].map(filter => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedFilter === filter
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Workflow Optimization Summary */}
        <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <h3 className="text-base font-bold text-blue-900 mb-2">Workflow Optimization</h3>
          <p className="text-sm text-blue-800">Highest current doctor load: <span className="font-semibold">{stats.topLoadedDoctor}</span></p>
          <p className="text-sm text-blue-800">Suggested next allocation: <span className="font-semibold">{stats.recommendedDoctor}</span></p>
          <p className="text-xs text-blue-700 mt-1">Queue is auto-prioritized by triage level and waiting order.</p>
        </div>

        {/* Patient Queue Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Patient</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Risk Score</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Triage Level</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Symptoms</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Appointment</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.length > 0 ? (
                  filteredAppointments.map((apt, idx) => (
                    <tr key={idx} className="border-b border-gray-200 hover:bg-purple-50 transition">
                      <td className="px-6 py-4 font-semibold text-gray-800">{apt.patientName || 'N/A'}</td>
                      <td className={`px-6 py-4 ${getRiskScoreColor(apt.riskScore)}`}>{apt.riskScore}%</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getTriageColor(apt.triageLevel)}`}>
                          {apt.triageLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{apt.patientSymptoms?.join(', ') || '-'}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {apt.date && apt.time ? `${new Date(apt.date).toLocaleDateString()} @ ${apt.time}` : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          apt.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          apt.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {apt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedAppointment(apt)}
                          className="px-3 py-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm font-semibold transition"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No appointments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side Panel - Details */}
        {selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
            <div className="bg-white w-full md:w-96 rounded-t-2xl p-6 shadow-2xl animate-in slide-in-from-bottom">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Appointment Details</h2>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-gray-600 text-sm">Doctor</p>
                  <p className="font-bold text-gray-800">{selectedAppointment.doctorName}</p>
                  <p className="text-gray-500 text-sm">{selectedAppointment.specialty}</p>
                </div>

                <div>
                  <p className="text-gray-600 text-sm">Patient Name</p>
                  <p className="font-bold text-gray-800">{selectedAppointment.patientName || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-gray-600 text-sm">Appointment Date & Time</p>
                  <p className="font-bold text-gray-800">
                    {selectedAppointment.date && selectedAppointment.time
                      ? `${new Date(selectedAppointment.date).toLocaleDateString()} @ ${selectedAppointment.time}`
                      : 'N/A'}
                  </p>
                </div>

                <div>
                  <p className="text-gray-600 text-sm">Risk Score</p>
                  <p className={`font-bold text-lg ${getRiskScoreColor(selectedAppointment.riskScore)}`}>
                    {selectedAppointment.riskScore}%
                  </p>
                </div>

                <div>
                  <p className="text-gray-600 text-sm">Symptoms</p>
                  <p className="text-gray-800">{selectedAppointment.patientSymptoms?.join(', ') || '-'}</p>
                </div>

                <div>
                  <p className="text-gray-600 text-sm">Full Diagnosis</p>
                  <p className="text-gray-800 text-sm">{selectedAppointment.diagnosis || 'Not provided'}</p>
                </div>
              </div>

              {/* Status Update Buttons */}
              <div className="space-y-2 border-t pt-4">
                <p className="text-gray-600 text-sm font-semibold">Update Status:</p>
                {['Pending', 'Confirmed', 'Completed'].map(status => (
                  <button
                    key={status}
                    onClick={() => updateStatus(selectedAppointment._id, status)}
                    className={`w-full px-4 py-2 rounded-lg font-semibold transition ${
                      selectedAppointment.status === status
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
