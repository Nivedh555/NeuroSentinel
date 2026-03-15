import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function DoctorLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await axios.post('/api/auth/doctor-login', {
        username,
        password
      }, { withCredentials: true });

      sessionStorage.setItem('adminLoggedIn', 'true');
      localStorage.setItem('appRole', 'admin');
      localStorage.setItem('roleChoiceDone', 'true');
      navigate('/doctor-dashboard');
      return;
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Access denied.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#120F2E] via-[#2E1A63] to-[#271253] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white/95 p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <span className="text-5xl">🏥</span>
          <h1 className="text-3xl font-bold text-slate-900">Hospital Admin Portal</h1>
          <p className="text-sm text-red-500 font-semibold">Authorized Personnel Only</p>
        </div>
        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Admin Username"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base font-medium focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Admin Password"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base font-medium focus:border-purple-500 focus:outline-none"
            />
          </div>
          {error && <p className="text-sm text-red-500 font-semibold">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-2xl bg-gradient-to-r from-[#0F1C6C] to-[#321E75] py-3 text-white font-semibold text-lg shadow-lg transition-all hover:opacity-90"
          >
            Access Dashboard
          </button>
        </form>
        <div className="text-center text-sm text-slate-600">
          <Link to="/" className="font-semibold text-purple-600 hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
