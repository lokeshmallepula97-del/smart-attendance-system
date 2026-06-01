import React, { useEffect, useState } from 'react';
import { Users } from 'lucide-react';

interface UserRow { id: string; name: string; email: string; role: 'admin' | 'teacher' | 'student'; }

export default function AdminConsole() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (res.ok) setUsers(await res.json());
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ role: newRole })
    });
    
    if (res.ok) {
      setMessage('Identity authorization mapping updated safely.');
      fetchUsers();
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 max-w-4xl mx-auto mt-6">
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-6 h-6 text-indigo-600" />
        <h2 className="text-xl font-bold text-slate-900">System Identity Core Control Console</h2>
      </div>

      {message && <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm">{message}</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 text-sm font-medium">
              <th className="py-3 px-4">Account Holder</th>
              <th className="py-3 px-4">Network Email Identifier</th>
              <th className="py-3 px-4">Authorization Classification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-slate-600">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/50 transition">
                <td className="py-4 px-4 font-medium text-slate-900">{u.name}</td>
                <td className="py-4 px-4">{u.email}</td>
                <td className="py-4 px-4">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="student">🎓 Student Profile</option>
                    <option value="teacher">💼 Teacher Operator</option>
                    <option value="admin">🔑 Master Administrator</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}