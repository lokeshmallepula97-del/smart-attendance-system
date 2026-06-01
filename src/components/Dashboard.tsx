import { useState, useEffect } from 'react';
import { api } from '../lib/api.ts';
import { User, ClassRoom } from '../types.ts';
import { motion } from 'motion/react';
import { Plus, BookOpen, GraduationCap, LogOut, Trash2, Calendar, ClipboardCheck, ArrowRight, UserCircle2 } from 'lucide-react';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onSelectClass: (cls: ClassRoom) => void;
}

export default function Dashboard({ user, onLogout, onSelectClass }: DashboardProps) {
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Class Form State
  const [newClassName, setNewClassName] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newCode, setNewCode] = useState('');

  // Fetch registered class registries
  const fetchClasses = async () => {
    setLoading(true);
    try {
      const data = await api.classes.list();
      setClasses(data);
    } catch (err: any) {
      console.error('Failed to get classes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newClassName || !newSubject || !newCode) {
      setError('Please fill in all requested fields.');
      return;
    }

    try {
      const created = await api.classes.create({
        name: newClassName,
        subject: newSubject,
        code: newCode.trim().toUpperCase(),
      });
      setClasses((prev) => [...prev, created]);
      setShowModal(false);
      // Reset form
      setNewClassName('');
      setNewSubject('');
      setNewCode('');
    } catch (err: any) {
      setError(err.message || 'Could not instantiate class. Be sure Code is unique.');
    }
  };

  const handleDeleteClass = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent card click select trigger
    if (!confirm('Are you absolutely sure you want to delete this class? This will permanently wipe all associated student and attendance datasets.')) {
      return;
    }

    try {
      await api.classes.delete(id);
      setClasses((prev) => prev.filter((c) => c._id !== id));
    } catch (err: any) {
      alert(err.message || 'Delete operation failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      {/* Upper Navigation Bar */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white px-6 py-4 shadow-sm shadow-slate-100/40">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-white shadow-sm">
              <ClipboardCheck className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <span className="text-sm font-semibold tracking-tight text-slate-950">SmartGuard Attendance</span>
              <p className="text-[10px] uppercase tracking-widest font-mono text-slate-400">Management Hub</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 hover:bg-slate-100/60 transition">
              <UserCircle2 className="h-5 w-5 text-slate-500" />
              <div className="text-left select-none">
                <p className="text-xs font-semibold text-slate-800 leading-none">{user.name}</p>
                <span className="text-[9px] font-semibold text-indigo-600 uppercase tracking-wider">{user.role}</span>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-200 px-3 py-2 text-xs font-semibold text-slate-600 transition"
              title="Logout Profile"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-6 pt-8">
        {/* Welcome Block */}
        <section className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Welcome back, {user.name}</h2>
            <p className="mt-1 text-xs text-slate-500">
              Select an active class module below to register logs, run rosters, or query AI patterns.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-100/35 transition active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 text-white" />
            <span>Instantiate New Class</span>
          </button>
        </section>

        {/* Classes Loading or Renders */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white p-6" />
            ))}
          </div>
        ) : classes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Calendar className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Classroom Registries Instantiated</h3>
            <p className="mt-2 text-xs text-slate-500 max-w-sm leading-relaxed">
              Create your initial classroom block (e.g. CS-101 Calculus) to import rosters and utilize AI tools.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-semibold text-white shadow transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Instantiate Your First Class</span>
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <motion.div
                key={cls._id}
                whileHover={{ y: -3, transition: { duration: 0.15 } }}
                onClick={() => onSelectClass(cls)}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition cursor-pointer hover:border-slate-300/80"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-block rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 border border-slate-200/50">
                      Code: {cls.code}
                    </span>
                    <button
                      onClick={(e) => handleDeleteClass(cls._id, e)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-100 transition duration-150"
                      title="Delete Class"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <h3 className="mt-4 text-base font-bold text-slate-900 group-hover:text-indigo-600 transition">
                    {cls.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                    <BookOpen className="h-3 w-3 inline text-slate-400" />
                    {cls.subject}
                  </p>
                </div>

                <div className="mt-6 border-t border-slate-100/80 pt-4 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-medium">
                    Created {new Date(cls.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-xs font-bold text-slate-950 flex items-center gap-1 group-hover:translate-x-1 transition duration-150">
                    <span>Manage</span>
                    <ArrowRight className="h-3 w-3 text-indigo-500" />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* NEW CLASS MODAL CREATOR */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop screen */}
          <div
            onClick={() => setShowModal(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
          >
            <div className="mb-4 flex items-center gap-2.5 pb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Instantiate New Class module</h3>
                <p className="text-[10px] text-slate-500">Configure curriculum metadata block</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-100 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-widest mb-1">
                  Classroom Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Data Structures & Algorithms"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-widest mb-1">
                  Topic / Subject
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science (CS)"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-widest mb-1">
                  Unique Class Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS-202"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:border-slate-800 focus:outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white transition shadow shadow-indigo-100"
                >
                  Create Class
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
