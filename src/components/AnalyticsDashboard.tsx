import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, ClipboardList, TrendingUp, BarChart3, PieChartIcon } from 'lucide-react';

interface SummaryMetrics {
  totalStudents: number;
  totalClasses: number;
  totalRecords: number;
  overallAttendancePercentage: number;
  globalRatios: Array<{ name: string; value: number }>;
}

export default function AnalyticsDashboard({ classId }: { classId: string }) {
  const [summary, setSummary] = useState<SummaryMetrics | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const COLORS = ['#10b981', '#f43f5e'];

  useEffect(() => {
    fetch('/api/analytics/summary', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => setSummary(data));

    if (classId) {
      fetch(`/api/analytics/class/${classId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
        .then(res => res.json())
        .then(data => setTrends(data.dailyTrends || []));
    }
  }, [classId]);

  if (!summary) return <div className="p-4 text-slate-500 font-medium">Loading summary calculations...</div>;

  return (
    <div className="space-y-6 mt-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Users className="w-6 h-6" /></div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{summary.totalStudents}</div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total System Students</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><ClipboardList className="w-6 h-6" /></div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{summary.totalRecords}</div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Logs Registered</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><TrendingUp className="w-6 h-6" /></div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{summary.overallAttendancePercentage}%</div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Attendance Score</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900">Session Attendance Bar Distribution</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends}>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Present" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Absent" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900">Ratio Metric Breakdown</h3>
          </div>
          <div className="h-64 flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={summary.globalRatios} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {summary.globalRatios.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}