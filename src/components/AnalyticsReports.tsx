import React, { useEffect, useState } from 'react';
import { Award } from 'lucide-react';

interface ReportRow { name: string; percentage: number; totalSessions: number; }

export default function AnalyticsReports({ classId }: { classId: string }) {
  const [report, setReport] = useState<ReportRow[]>([]);

  useEffect(() => {
    if (!classId) return;
    fetch(`/api/analytics/class/${classId}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => setReport(data.studentPerformance || []));
  }, [classId]);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-6">
      <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex items-center gap-2">
        <Award className="w-5 h-5 text-indigo-600" />
        <h3 className="font-bold text-slate-900">Student Percentage Breakdown List</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold uppercase tracking-wider bg-slate-50/30">
              <th className="py-3 px-6">Name</th>
              <th className="py-3 px-6">Tracked Classes</th>
              <th className="py-3 px-6">Total Percentage Level</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm text-slate-600">
            {report.map((row, index) => (
              <tr key={index} className="hover:bg-slate-50/50 transition">
                <td className="py-4 px-6 font-semibold text-slate-900">{row.name}</td>
                <td className="py-4 px-6 font-medium">{row.totalSessions} sessions</td>
                <td className="py-4 px-6">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                    row.percentage >= 75 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {row.percentage}% Matches
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}