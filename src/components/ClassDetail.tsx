import { useState, useEffect } from 'react';
import { api } from '../lib/api.ts';
import { ClassRoom, Student, AttendanceRecord, AttendanceSession, ClassStats } from '../types.ts';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  ArrowLeft,
  Users,
  ClipboardCheck,
  BrainCircuit,
  Settings,
  Plus,
  Trash2,
  Calendar,
  Save,
  CheckCircle,
  AlertTriangle,
  XCircle,
  HelpCircle,
  FileText,
  BadgeAlert,
  Sparkles,
  Info,
  Volume2,
  Mail,
  RefreshCw,
  Award
} from 'lucide-react';

interface ClassDetailProps {
  cls: ClassRoom;
  onBack: () => void;
}

export default function ClassDetail({ cls, onBack }: ClassDetailProps) {
  const [activeTab, setActiveTab] = useState<'attendance' | 'quick-enroll' | 'ai-parser' | 'insights'>('attendance');
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  // Take Attendance State
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const YYYY = today.getFullYear();
    const MM = String(today.getMonth() + 1).padStart(2, '0');
    const DD = String(today.getDate()).padStart(2, '0');
    return `${YYYY}-${MM}-${DD}`;
  });

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // AI OCR Voice Parser State
  const [voiceText, setVoiceText] = useState('');
  const [aiParsing, setAiParsing] = useState(false);
  const [aiParseAlert, setAiParseAlert] = useState<string | null>(null);

  // Enroll Form State
  const [stuName, setStuName] = useState('');
  const [stuRoll, setStuRoll] = useState('');
  const [stuEmail, setStuEmail] = useState('');
  const [enrollError, setEnrollError] = useState<string | null>(null);

  // Insights State
  const [stats, setStats] = useState<ClassStats | null>(null);
  const [fetchingStats, setFetchingStats] = useState(false);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  // Fetch Class roster
  const fetchRoster = async () => {
    setLoadingStudents(true);
    try {
      const data = await api.students.getForClass(cls._id);
      setStudents(data);
    } catch (err) {
      console.error('Failed to get student list:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Fetch existing attendance logs
  const fetchAttendance = async () => {
    if (!cls._id || !selectedDate) return;
    try {
      const session = await api.attendance.get(cls._id, selectedDate);
      if (session && session.records && session.records.length > 0) {
        // Hydrate attendance records
        setRecords(session.records);
      } else {
        // Initialize default all Present for convenience
        const defaults = students.map((s) => ({
          studentId: s._id,
          status: 'Present' as const,
          remarks: ''
        }));
        setRecords(defaults);
      }
    } catch (error) {
      console.error('Failed to load session details:', error);
    }
  };

  // Fetch statistical breakdowns (Summary Metrics)
  const fetchSummaryStats = async () => {
    setFetchingStats(true);
    try {
      const sumStats = await api.attendance.getSummary(cls._id);
      setStats(sumStats);
    } catch (err) {
      console.error('Failed to fetch summary logs:', err);
    } finally {
      setFetchingStats(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, [cls._id]);

  useEffect(() => {
    if (students.length > 0) {
      fetchAttendance();
    }
  }, [students, selectedDate]);

  useEffect(() => {
    if (activeTab === 'insights') {
      fetchSummaryStats();
    }
  }, [activeTab]);

  // Handle manual individual status select
  const setStudentStatus = (studentId: string, status: 'Present' | 'Absent' | 'Late' | 'Excused') => {
    setRecords((prev) => {
      const exists = prev.find((r) => r.studentId === studentId);
      if (exists) {
        return prev.map((r) => (r.studentId === studentId ? { ...r, status } : r));
      } else {
        return [...prev, { studentId, status, remarks: '' }];
      }
    });
  };

  // Set manual remark
  const setStudentRemark = (studentId: string, remarks: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, remarks } : r))
    );
  };

  // Quick Action - Mark All present
  const handleMarkAllPresent = () => {
    setRecords(
      students.map((s) => ({
        studentId: s._id,
        status: 'Present' as const,
        remarks: ''
      }))
    );
  };

  const handleSaveAttendance = async () => {
    setSavingAttendance(true);
    setSaveStatus('idle');
    try {
      // Validate that all students have records (if not, default to Absent)
      const finalRecords = students.map((s) => {
        const record = records.find((r) => r.studentId === s._id);
        return record || { studentId: s._id, status: 'Absent' as const, remarks: '' };
      });

      await api.attendance.save({
        classId: cls._id,
        date: selectedDate,
        records: finalRecords
      });

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: any) {
      setSaveStatus('error');
    } finally {
      setSavingAttendance(false);
    }
  };

  // Perform Manual enrollment
  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnrollError(null);

    if (!stuName || !stuRoll) {
      setEnrollError('Name and Roll Number are required.');
      return;
    }

    try {
      const newStu = await api.students.create({
        name: stuName,
        rollNumber: stuRoll.trim(),
        email: stuEmail.trim(),
        classId: cls._id
      });

      setStudents((prev) => [...prev, newStu].sort((a,b) => a.name.localeCompare(b.name)));
      // Reset enrollment form state
      setStuName('');
      setStuRoll('');
      setStuEmail('');
    } catch (err: any) {
      setEnrollError(err.message || 'Enrollment query failed.');
    }
  };

  // Remove a Student
  const handleUnenrollStudent = async (id: string) => {
    if (!confirm('Unenroll student from directory? Historical attendance records indexes related to this ID will lose linkage.')) {
      return;
    }

    try {
      await api.students.delete(id);
      setStudents((prev) => prev.filter((s) => s._id !== id));
    } catch (err: any) {
      alert(err.message || 'Operation failed.');
    }
  };

  // Fire Gemini Smart voice parser
  const handleParseTranscript = async () => {
    if (!voiceText.trim()) return;
    setAiParsing(true);
    setAiParseAlert(null);

    try {
      const parsedRoster = await api.ai.parseAttendance(voiceText, students);
      
      // Update local state with parser values
      setRecords((prev) => {
        return prev.map((currentRecord) => {
          const aiRecord = parsedRoster.find((ar) => ar.studentId === currentRecord.studentId);
          if (aiRecord) {
            return {
              ...currentRecord,
              status: aiRecord.status,
              remarks: aiRecord.remarks ? `AI matching: ${aiRecord.remarks}` : currentRecord.remarks
            };
          }
          return currentRecord;
        });
      });

      setAiParseAlert(`Gemini successfully matched & imported values for ${parsedRoster.length} students. Verify & saved changes!`);
      // Toggle back to take attendance
      setActiveTab('attendance');
    } catch (err: any) {
      setAiParseAlert(err.message || 'AI parsing was unsuccessful. Please verify speech text.');
    } finally {
      setAiParsing(false);
    }
  };

  // Ask Gemini Insights for AI Report Advice
  const handleGenerateInsights = async () => {
    if (!stats) return;
    setGeneratingInsights(true);
    setInsightsError(null);

    try {
      const result = await api.ai.generateInsights({
        timeline: stats.timeline,
        studentStats: stats.studentStats,
        className: cls.name
      });
      setAiInsights(result.insights);
    } catch (err: any) {
      setInsightsError(err.message || 'Could not query predictive insights. Check connection.');
    } finally {
      setGeneratingInsights(false);
    }
  };

  const getStatusColor = (status: 'Present' | 'Absent' | 'Late' | 'Excused') => {
    switch (status) {
      case 'Present':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Absent':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Late':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Excused':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      {/* Detail header */}
      <div className="border-b border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <button
              onClick={onBack}
              className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition shadow-xs"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">{cls.name}</h1>
                <span className="rounded bg-slate-900 px-2 py-0.5 text-[9px] font-mono tracking-tight text-indigo-400 border border-slate-800">
                  {cls.code}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">Subject: {cls.subject}</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 self-start sm:self-center">
            <button
              onClick={() => setActiveTab('attendance')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold tracking-wide transition ${
                activeTab === 'attendance' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardCheck className="h-3.5 w-3.5" />
              <span>Mark Attendance</span>
            </button>

            <button
              onClick={() => setActiveTab('ai-parser')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold tracking-wide transition ${
                activeTab === 'ai-parser' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Volume2 className="h-3.5 w-3.5" />
              <span className="flex items-center gap-1">
                <span>AI Transcript</span>
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('quick-enroll')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold tracking-wide transition ${
                activeTab === 'quick-enroll' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Enroll Student</span>
            </button>

            <button
              onClick={() => setActiveTab('insights')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold tracking-wide transition ${
                activeTab === 'insights' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BrainCircuit className="h-3.5 w-3.5" />
              <span>Analytics & Insights</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main workspace panels */}
      <main className="mx-auto max-w-7xl px-6 pt-6">
        {aiParseAlert && (
          <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 text-xs font-medium text-indigo-900 flex justify-between items-center shadow-xs">
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-550" />
              {aiParseAlert}
            </span>
            <button
              onClick={() => setAiParseAlert(null)}
              className="text-indigo-600 hover:text-indigo-800 underline font-semibold text-[10px]"
            >
              Acknowledge
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* TAB 1: ATTENDANCE SESSION TAKEN */}
          {activeTab === 'attendance' && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-4 gap-6"
            >
              {/* Sidebar controls */}
              <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm self-start space-y-4">
                <div className="space-y-1 pb-2">
                  <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400">Roster Session</h3>
                  <p className="text-xs text-slate-500">Pick active date to register logs.</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>Select Calendar Date</span>
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 tracking-wide focus:border-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <button
                    onClick={handleMarkAllPresent}
                    disabled={students.length === 0}
                    className="w-full text-center rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 py-2 text-xs font-bold text-slate-700 transition disabled:opacity-50"
                  >
                    Set All "Present"
                  </button>

                  <button
                    onClick={handleSaveAttendance}
                    disabled={savingAttendance || students.length === 0}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 py-2.5 text-xs font-bold text-white shadow-xs transition"
                  >
                    {savingAttendance ? (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        <span>Save Attendance Logs</span>
                      </>
                    )}
                  </button>

                  {saveStatus === 'success' && (
                    <p className="mt-1.5 text-center text-[10px] font-semibold text-indigo-600 animate-pulse flex items-center gap-1 justify-center">
                      <CheckCircle className="h-3 w-3 inline" /> Attendance saved successfully!
                    </p>
                  )}
                </div>

                {/* Legend cards info */}
                <div className="rounded-xl bg-slate-50 p-3 pt-2 text-[10px] space-y-1.5">
                  <div className="font-mono text-[9px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1 mb-1">
                    <Info className="h-3.5 w-3.5" /> Registry Legend
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Present (100% Rate)</span>
                    <span className="rounded bg-emerald-50 px-1.5 font-bold text-emerald-700 border border-emerald-100">P</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Late (70% Weight)</span>
                    <span className="rounded bg-amber-50 px-1.5 font-bold text-amber-700 border border-amber-100">L</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Absent (0% Rate)</span>
                    <span className="rounded bg-red-50 px-1.5 font-bold text-red-700 border border-red-100">A</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Excused (Neutralized)</span>
                    <span className="rounded bg-blue-50 px-1.5 font-bold text-blue-700 border border-blue-100">E</span>
                  </div>
                </div>
              </div>

              {/* Roster database table */}
              <div className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100/80 gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Classroom Registry</h3>
                    <p className="text-xs text-slate-500">
                      Roster has {students.length} students enrolled. Configure presence status individual indexes.
                    </p>
                  </div>
                  <div className="rounded-full bg-indigo-50 border border-indigo-100 text-indigo-900 text-[10px] px-3 py-1 font-semibold flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                    <span>Session: {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                  </div>
                </div>

                {loadingStudents ? (
                  <div className="space-y-3 py-12 text-center text-slate-400">
                    <RefreshCw className="mx-auto h-8 w-8 animate-spin" />
                    <p className="text-xs font-semibold">Synchronizing roster directory logs...</p>
                  </div>
                ) : students.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 space-y-3">
                    <Users className="mx-auto h-10 w-10 text-slate-300" />
                    <p className="text-xs font-semibold">No students currently enrolled in this class module.</p>
                    <button
                      onClick={() => setActiveTab('quick-enroll')}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline hover:text-indigo-850"
                    >
                      Enroll your first student instantly
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full table-auto text-left text-xs text-slate-600">
                      <thead>
                        <tr className="border-b border-slate-100 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                          <th className="py-2.5">Roll No.</th>
                          <th>Full Name</th>
                          <th className="text-center">Status Assignment</th>
                          <th className="pr-2">Private Notes / Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {students.map((student) => {
                          const matchingRecord = records.find((r) => r.studentId === student._id) || {
                            status: 'Present' as const,
                            remarks: ''
                          };

                          return (
                            <tr key={student._id} className="hover:bg-slate-50/40">
                              <td className="py-3 font-mono font-bold text-slate-500">{student.rollNumber}</td>
                              <td>
                                <div className="font-semibold text-slate-900">{student.name}</div>
                                {student.email && (
                                  <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                    <Mail className="h-3 w-3" />
                                    <span>{student.email}</span>
                                  </div>
                                )}
                              </td>
                              <td className="text-center shrink-0">
                                <div className="inline-flex rounded-lg border border-slate-250 p-0.5 bg-slate-50/50">
                                  {(['Present', 'Late', 'Absent', 'Excused'] as const).map((st) => (
                                    <button
                                      key={st}
                                      onClick={() => setStudentStatus(student._id, st)}
                                      className={`rounded-md px-2 py-1 text-[10px] font-semibold transition ${
                                        matchingRecord.status === st
                                          ? st === 'Present'
                                            ? 'bg-emerald-600 text-white shadow-xs'
                                            : st === 'Late'
                                            ? 'bg-amber-500 text-white shadow-xs'
                                            : st === 'Absent'
                                            ? 'bg-red-600 text-white shadow-xs'
                                            : 'bg-blue-600 text-white shadow-xs'
                                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                                      }`}
                                    >
                                      {st.substring(0, 4)}
                                    </button>
                                  ))}
                                </div>
                              </td>
                              <td className="pr-2">
                                <input
                                  type="text"
                                  placeholder="Late train, sick note, etc."
                                  value={matchingRecord.remarks || ''}
                                  onChange={(e) => setStudentRemark(student._id, e.target.value)}
                                  className="w-full rounded border border-transparent hover:border-slate-200/80 bg-stone-50 px-2 py-1 text-[11px] focus:bg-white focus:border-slate-800 focus:outline-none transition"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 2: AI TRANSCRIPT PARSER */}
          {activeTab === 'ai-parser' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6"
            >
              <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-650 shadow-sm shrink-0">
                  <BrainCircuit className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Gemini Instant Voice / Text Parser</h3>
                  <p className="text-xs text-slate-500 max-w-2xl mt-1">
                     Took attendance calling out names orally in classroom or via a chat channel? Copy & paste everything! 
                     Paste voice transcripts or text listings below. Gemini artificial intelligence will fuzzy match student names against your class roster, handle casual phonetic typos, deduce status, and populate logs instantly.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Paste Speech Transcription
                    </label>
                    <textarea
                      rows={8}
                      placeholder='Example: "Okay class, let us start roll-call. Lokesh is here, Sarah is sitting right here, David emailed that he is late because of rain, and I have not seen Jack... so absent"'
                      value={voiceText}
                      onChange={(e) => setVoiceText(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/40 p-4 text-xs font-medium text-slate-800 leading-relaxed focus:border-slate-700 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={handleParseTranscript}
                    disabled={aiParsing || !voiceText.trim() || students.length === 0}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-705 py-3 text-xs font-bold text-white shadow-sm transition duration-150 active:scale-[0.99] disabled:opacity-50"
                  >
                    {aiParsing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-white" />
                        <span>AI digesting transcript...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-white" />
                        <span>Intelligent Parse with Gemini</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Practical Demo Examples */}
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/20 p-5 self-start">
                  <h4 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 mb-2">
                    <Info className="h-4 w-4 text-indigo-500" />
                    <span>How it works — Copy & Try:</span>
                  </h4>
                  <p className="text-[11px] leading-relaxed text-slate-600 mb-3">
                    Your active student database contains names like {students.slice(0, 3).map(s => s.name).join(', ') || 'N/A'}. 
                    Gemini maps spoken shorthand to structured profiles automatically.
                  </p>

                  <div className="space-y-2.5 text-[10px] text-slate-500">
                    <div className="rounded border border-indigo-100 bg-white p-2.5">
                      <span className="font-bold text-indigo-700">Sample prompt:</span>
                      <p className="mt-1 font-mono text-[9px] italic text-slate-500">
                        "{students[0]?.name || 'Student'} called out here, but {students[1]?.name || 'Student_B'} was not around. Marked running late for {students[2]?.name || 'Student_C'}."
                      </p>
                    </div>

                    <p className="text-[10px] text-slate-400 font-medium">
                      💡 For premium performance, ensure your student directory is enrolled with the correct name spellings.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: REGISTER NEW STUDENT roster */}
          {activeTab === 'quick-enroll' && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {/* Enrollment form block */}
              <div className="md:col-span-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm self-start space-y-4">
                <div className="space-y-1 pb-2 border-b border-slate-100/80">
                  <h3 className="font-bold text-slate-900 text-sm">Enroll Student</h3>
                  <p className="text-xs text-slate-500">Instanstly expand your class roster catalog.</p>
                </div>

                {enrollError && (
                  <div className="rounded-lg bg-red-50 border border-red-100 p-2.5 text-xs text-red-700 font-semibold flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>{enrollError}</span>
                  </div>
                )}

                <form onSubmit={handleEnrollStudent} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Student Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alice Cooper"
                      value={stuName}
                      onChange={(e) => setStuName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-slate-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Unique Roll Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CS-2026-03"
                      value={stuRoll}
                      onChange={(e) => setStuRoll(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono focus:border-slate-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Parent/Student Email (Optional)</label>
                    <input
                      type="email"
                      placeholder="e.g. alice@school.edu"
                      value={stuEmail}
                      onChange={(e) => setStuEmail(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-slate-800 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-100/40 transition active:scale-[0.99]"
                  >
                    <Plus className="h-3.5 w-3.5 text-white" />
                    <span>Enroll Into Class</span>
                  </button>
                </form>
              </div>

              {/* ENROLLED DIR roster */}
              <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="pb-3 border-b border-slate-100 mb-4">
                  <h3 className="font-bold text-slate-900 text-sm">Roster Directory List</h3>
                  <p className="text-xs text-slate-500">Currently enrolled academic students.</p>
                </div>

                {students.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <Users className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="text-xs">Roster is empty. Register students in the panel.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-650">
                      <thead>
                        <tr className="border-b border-slate-150 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                          <th className="py-2">Roll No.</th>
                          <th>Full Name</th>
                          <th>Registered Mail</th>
                          <th className="text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {students.map((student) => (
                          <tr key={student._id} className="hover:bg-slate-50/40">
                            <td className="py-3 font-mono font-bold text-slate-800">{student.rollNumber}</td>
                            <td className="font-semibold text-slate-900">{student.name}</td>
                            <td className="text-slate-500">{student.email || 'N/A'}</td>
                            <td className="text-right">
                              <button
                                onClick={() => handleUnenrollStudent(student._id)}
                                className="rounded px-2 py-1 text-red-500 hover:bg-red-50 transition border border-transparent hover:border-red-100"
                                title="Remove enrolled student"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 4: PREDICTIVE INSIGHTS */}
          {activeTab === 'insights' && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Overview Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Roster Attendance Sessions</span>
                    <h3 className="mt-1 text-2xl font-black text-slate-900">{stats?.totalSessions || 0}</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Calendar dates saved</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-800 shrink-0">
                    <Calendar className="h-5 w-5" />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Absence Alerts (Critical)</span>
                    <h3 className="mt-1 text-2xl font-black text-red-650">
                      {stats?.studentStats.filter((st) => st.presentRate < 75).length || 0}
                    </h3>
                    <p className="text-[10px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                      <BadgeAlert className="h-3 w-3" /> Under 75% threshold
                    </p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 border border-red-100 text-red-600 shrink-0">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                </div>

                <div className="rounded-xl border border-indigo-150 bg-indigo-50/20 p-5 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-800">Honor Roll attendees</span>
                    <h3 className="mt-1 text-2xl font-black text-indigo-900">
                      {stats?.studentStats.filter((st) => st.presentRate >= 95).length || 0}
                    </h3>
                    <p className="text-[10px] text-indigo-600 mt-1 font-semibold flex items-center gap-1">
                      <Award className="h-3 w-3" /> Over 95% constant
                    </p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 border border-indigo-200 text-indigo-700 shrink-0">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                </div>
              </div>

              {/* Stats Timeline Visual Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Block */}
                <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="pb-4 border-b border-slate-100 mb-4">
                    <h3 className="font-bold text-slate-900 text-sm">Classroom Attendance Timeline Curve</h3>
                    <p className="text-xs text-slate-500">Day-of-week rate metrics (Present + Late records percentage).</p>
                  </div>

                  {!stats || stats.timeline.length === 0 ? (
                    <div className="py-20 text-center text-slate-400">
                      <FileText className="mx-auto h-8 w-8 text-slate-350 mb-2" />
                      <p className="text-xs font-semibold">Insufficent historical data to render chronological timeline curves.</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Please log attendance session curves first.</p>
                    </div>
                  ) : (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats.timeline}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(value) => [`${value}% Attendance Rate`, 'Ratio']} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Line
                            type="monotone"
                            dataKey="rate"
                            name="Attendance rate (%)"
                            stroke="#6366f1"
                            strokeWidth={3}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Chronic absentee quick tables */}
                <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="pb-3 border-b border-slate-100 mb-3">
                      <h3 className="font-bold text-slate-900 text-sm">Chronic Absence Flag Roster</h3>
                      <p className="text-xs text-slate-500">Prioritized students requiring pedagogical followups.</p>
                    </div>

                    {!stats || stats.studentStats.filter(s => s.presentRate < 75).length === 0 ? (
                      <div className="py-12 text-center text-teal-600/70 bg-teal-50/20 rounded-xl border border-teal-100 mt-2">
                        <CheckCircle className="mx-auto h-7 w-7 text-teal-400 mb-1" />
                        <p className="text-xs font-bold">Excellent!</p>
                        <p className="text-[10px] text-slate-500">Every student is above the critical 75% margin.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 mt-2 font-medium">
                        {stats.studentStats
                          .filter((s) => s.presentRate < 75)
                          .map((stu) => (
                            <div
                               key={stu._id}
                               className="rounded-xl border border-red-100 bg-red-50/30 p-2.5 flex items-center justify-between"
                            >
                              <div>
                                <h4 className="text-xs font-bold text-slate-900">{stu.name}</h4>
                                <p className="text-[10px] font-mono text-slate-400">Roll: {stu.rollNumber}</p>
                              </div>
                              <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-black text-red-700">
                                {stu.presentRate}% Present
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Ask Gemini triggers */}
                  <div className="mt-6 pt-3 border-t border-slate-100">
                    <button
                      onClick={handleGenerateInsights}
                      disabled={generatingInsights || !stats || stats.studentStats.length === 0}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-705 py-3 text-xs font-bold text-white shadow shadow-indigo-100 transition duration-150 active:scale-[0.99] disabled:opacity-50"
                    >
                      {generatingInsights ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin text-white" />
                          <span>Gemini compiling analytics...</span>
                        </>
                      ) : (
                        <>
                          <BrainCircuit className="h-4 w-4 text-white animate-pulse" />
                          <span>Generate Deep AI Insights</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Smart Analytical Report Box */}
              {aiInsights && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-slate-250 bg-white p-6 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-indigo-600 text-white shadow-xs shadow-indigo-100">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Gemini High-Value Predictive Report</h4>
                        <p className="text-[10px] text-slate-500">Autonomous attendance insights & re-engagement outlines</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(aiInsights);
                        alert('Insights Markdown successfully copied to clipboard!');
                      }}
                      className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-705 border border-slate-200 hover:bg-slate-200 transition"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>Copy Report</span>
                    </button>
                  </div>

                  {/* Render Insights Markdown */}
                  <div className="text-xs prose max-w-none text-slate-700 leading-relaxed space-y-4 pt-1">
                    <Markdown>{aiInsights}</Markdown>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
