export interface User {
  id: string;
  email: string;
  name: string;
  role: 'teacher' | 'admin';
}

export interface ClassRoom {
  _id: string;
  name: string;
  subject: string;
  code: string;
  teacherId: string;
  createdAt: string;
}

export interface Student {
  _id: string;
  name: string;
  rollNumber: string;
  email: string;
  classId: string;
  createdAt: string;
}

export interface AttendanceRecord {
  studentId: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  remarks?: string;
}

export interface AttendanceSession {
  _id?: string;
  classId: string;
  date: string; // YYYY-MM-DD
  records: AttendanceRecord[];
  takenById?: string;
  createdAt?: string;
}

export interface StudentStat {
  _id: string;
  name: string;
  rollNumber: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  presentRate: number;
}

export interface TimelineItem {
  date: string;
  presentCount: number;
  totalStudents: number;
  rate: number;
}

export interface ClassStats {
  totalSessions: number;
  studentStats: StudentStat[];
  timeline: TimelineItem[];
}
