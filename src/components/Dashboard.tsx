import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ShieldCheck, BookOpen, Plus, BarChart3 } from 'lucide-react';
import StudentHub from './StudentHub';
import AdminConsole from './AdminConsole';
import AnalyticsDashboard from './AnalyticsDashboard';
import AnalyticsReports from './AnalyticsReports';
import FaceDetection from './FaceDetection';

interface UserData { name: string; email: string; role: 'admin' | 'teacher' | 'student'; }

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<'roster' | 'analytics'>('roster');

  useEffect(() => {
   console.log(
  "Token:",
  localStorage.getItem("smart_attendance_auth_token")
);
   const token = localStorage.getItem('smart_attendance_auth_token');
    if (!token) {
      navigate('/');
      return;
    }
    
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      setUser({ name: payload.name || 'User Profile', email: payload.email, role: payload.role });
    } catch (e) {
      localStorage.clear();
      navigate('/');
    }
  }, [navigate]);

  const handleSignOut = () => {
    localStorage.clear();
    navigate('/');
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-medium text-slate-500">Loading Dashboard Context...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Shared Header Bar */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-600 text-white rounded-xl"><ShieldCheck className="w-5 h-5" /></div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">SmartGuard Control Center</h1>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Workspace Environment</p>
          </div>
        </div>

        {/* Tab Selection Navigation (Visible Only to Teachers) */}
        {user.role === 'teacher' && (
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button onClick={() => setActiveTab('roster')} className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === 'roster' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}><BookOpen className="w-4 h-4" /> Class Manager</button>
            <button onClick={() => setActiveTab('analytics')} className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === 'analytics' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}><BarChart3 className="w-4 h-4" /> System Analytics</button>
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-bold text-slate-800">{user.name}</div>
            <div className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md inline-block mt-0.5 uppercase tracking-wide">{user.role}</div>
          </div>
          <button onClick={handleSignOut} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-rose-600 transition border border-slate-200 hover:border-rose-100 rounded-xl px-4 py-2 bg-white">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      {/* Main Container Viewport */}
      <main className="max-w-7xl mx-auto p-6">
      <FaceDetection />
        {user.role === 'admin' && <AdminConsole />}
        {user.role === 'student' && <StudentHub />}
        {user.role === 'teacher' && activeTab === 'roster' && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center max-w-xl mx-auto mt-12">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4"><BookOpen className="w-8 h-8" /></div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome back, Instructor!</h2>
            <p className="text-slate-500 mb-6">Create a curriculum block module to initialize AI attendance sheets or view student records.</p>
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition shadow-sm"><Plus className="w-5 h-5" /> Instantiate First Class Module</button>
          </div>
        )}
        
        {/* Load Analytics Dashboard and Spreadsheets dynamically when the tab is clicked */}
        {user.role === 'teacher' && activeTab === 'analytics' && (
          <div className="space-y-6">
            <AnalyticsDashboard classId="demo-class-id" />
            <AnalyticsReports classId="demo-class-id" />
          </div>
        )}
      </main>
    </div>
  );
}