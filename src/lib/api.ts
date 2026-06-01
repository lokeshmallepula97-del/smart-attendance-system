/**
 * API client helper to interact with Express Node.js and Gemini AI endpoints.
 * Includes JWT insertion from localStorage automatically.
 */

const API_BASE = '/api';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('smart_attendance_auth_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errMsg = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      errMsg = data.error || errMsg;
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  auth: {
    async register(payload: any) {
      return handleResponse<any>(await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }));
    },
    async login(payload: any) {
      return handleResponse<any>(await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }));
    },
    async me() {
      return handleResponse<any>(await fetch(`${API_BASE}/auth/me`, {
        method: 'GET',
        headers: getHeaders(),
      }));
    }
  },

  // Classes
  classes: {
    async list() {
      return handleResponse<any[]>(await fetch(`${API_BASE}/classes`, {
        method: 'GET',
        headers: getHeaders(),
      }));
    },
    async create(payload: any) {
      return handleResponse<any>(await fetch(`${API_BASE}/classes`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      }));
    },
    async delete(id: string) {
      return handleResponse<any>(await fetch(`${API_BASE}/classes/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      }));
    }
  },

  // Students
  students: {
    async getForClass(classId: string) {
      return handleResponse<any[]>(await fetch(`${API_BASE}/students?classId=${classId}`, {
        method: 'GET',
        headers: getHeaders(),
      }));
    },
    async create(payload: any) {
      return handleResponse<any>(await fetch(`${API_BASE}/students`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      }));
    },
    async delete(id: string) {
      return handleResponse<any>(await fetch(`${API_BASE}/students/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      }));
    }
  },

  // Attendance
  attendance: {
    async get(classId: string, date: string) {
      return handleResponse<any>(await fetch(`${API_BASE}/attendance?classId=${classId}&date=${date}`, {
        method: 'GET',
        headers: getHeaders(),
      }));
    },
    async save(payload: { classId: string; date: string; records: any[] }) {
      return handleResponse<any>(await fetch(`${API_BASE}/attendance`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      }));
    },
    async getSummary(classId: string) {
      return handleResponse<any>(await fetch(`${API_BASE}/attendance/summary?classId=${classId}`, {
        method: 'GET',
        headers: getHeaders(),
      }));
    }
  },

  // AI Assistance (Smart Actions)
  ai: {
    async parseAttendance(rawText: string, students: any[]) {
      return handleResponse<any[]>(await fetch(`${API_BASE}/ai/parse-attendance`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ rawText, students }),
      }));
    },
    async generateInsights(payload: { timeline: any[]; studentStats: any[]; className: string }) {
      return handleResponse<{ insights: string }>(await fetch(`${API_BASE}/ai/generate-insights`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      }));
    }
  }
};
