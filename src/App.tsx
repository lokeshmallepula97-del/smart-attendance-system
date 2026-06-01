import { useState, useEffect } from 'react';
import { api } from './lib/api.ts';
import { User, ClassRoom } from './types.ts';
import LoginScreen from './components/LoginScreen.tsx';
import Dashboard from './components/Dashboard.tsx';
import ClassDetail from './components/ClassDetail.tsx';
import { ClipboardCheck, Sparkles, RefreshCw } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('smart_attendance_auth_token'));
  const [selectedClass, setSelectedClass] = useState<ClassRoom | null>(null);
  const [bootstrapLoading, setBootstrapLoading] = useState(true);

  // Authenticate session on app load
  useEffect(() => {
    const bootstrapSession = async () => {
      const storedToken = localStorage.getItem('smart_attendance_auth_token');
      if (!storedToken) {
        setBootstrapLoading(false);
        return;
      }

      try {
        const activeProfile = await api.auth.me();
        setUser(activeProfile);
      } catch (err) {
        console.error('Session restoration failed:', err);
        // Clear invalidated token
        localStorage.removeItem('smart_attendance_auth_token');
        setToken(null);
      } finally {
        setBootstrapLoading(false);
      }
    };

    bootstrapSession();
  }, [token]);

  const handleAuthSuccess = (authUser: User, authToken: string) => {
    setUser(authUser);
    setToken(authToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('smart_attendance_auth_token');
    setUser(null);
    setToken(null);
    setSelectedClass(null);
  };

  if (bootstrapLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-md shadow-slate-100">
          <ClipboardCheck className="h-6 w-6 text-indigo-400" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 font-mono">
          <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />
          <span>Starting Command Center UI...</span>
        </div>
      </div>
    );
  }

  // Auth screen fallback
  if (!user) {
    return <LoginScreen onAuthSuccess={handleAuthSuccess} />;
  }

  // Connected screens
  if (selectedClass) {
    return <ClassDetail cls={selectedClass} onBack={() => setSelectedClass(null)} />;
  }

  return (
    <Dashboard
      user={user}
      onLogout={handleLogout}
      onSelectClass={(cls) => setSelectedClass(cls)}
    />
  );
}
