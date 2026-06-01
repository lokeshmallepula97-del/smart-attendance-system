import { Router, Response } from 'express';
import { db } from './database.js';
import { AuthenticatedRequest, signToken, hashPassword, comparePassword, authenticateToken } from './auth.js';
import { GoogleGenAI, Type } from '@google/genai';

const router = Router();

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// PRIVATE HEALTH API
router.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ==========================================
// 1. AUTH ROUTES
// ==========================================

// Register
router.post('/auth/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required.' });
    }

    const existingUser = await db.models.User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await hashPassword(password);
    const userRole = role === 'admin' ? 'admin' : 'teacher';

    const newUser = await db.models.User.create({
      email,
      passwordHash,
      name,
      role: userRole,
    });

    const token = signToken({
      id: newUser._id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    });

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      }
    });
  } catch (error: any) {
    console.error('Registration failed:', error);
    res.status(500).json({ error: 'Failed to create user account. Please try again.' });
  }
});

// Login
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await db.models.User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken({
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    });
  } catch (error: any) {
    console.error('Login failed:', error);
    res.status(500).json({ error: 'Failed to sign in. Please try again.' });
  }
});

// Fetch Active Profile details
router.get('/auth/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
    const user = await db.models.User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User profile not found.' });

    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

// ==========================================
// 2. CLASSES CRUD
// ==========================================
router.get('/classes', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
    const classes = await db.models.Class.find({ teacherId: req.user.id });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve classes.' });
  }
});

router.post('/classes', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, subject, code } = req.body;
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
    if (!name || !subject || !code) {
      return res.status(400).json({ error: 'Class name, subject, and unique code are required.' });
    }

    // Check if class code exists
    const existing = await db.models.Class.findOne({ code });
    if (existing) {
      return res.status(400).json({ error: 'A class with this code already exists. Choose a unique code.' });
    }

    const created = await db.models.Class.create({
      name,
      subject,
      code,
      teacherId: req.user.id,
    });

    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create class.' });
  }
});

router.delete('/classes/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

    const cls = await db.models.Class.findById(id);
    if (!cls) return res.status(404).json({ error: 'Class not found.' });
    if (cls.teacherId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied.' });
    }

    await db.models.Class.findByIdAndDelete(id);
    res.json({ message: 'Class deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete class.' });
  }
});

// ==========================================
// 3. STUDENTS CRUD
// ==========================================
router.get('/students', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { classId } = req.query;
    if (!classId) return res.status(400).json({ error: 'Class ID is required.' });

    const students = await db.models.Student.find({ classId: classId as string });
    // Sort students alphabetically by name
    students.sort((a, b) => a.name.localeCompare(b.name));
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve students roster.' });
  }
});

router.post('/students', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, rollNumber, email, classId } = req.body;
    if (!name || !rollNumber || !classId) {
      return res.status(400).json({ error: 'Student name, roll number, and Class ID are required.' });
    }

    // Check duplicate roll number in class
    const existing = await db.models.Student.find({ classId });
    if (existing.some(s => s.rollNumber.toLowerCase() === rollNumber.toString().toLowerCase())) {
      return res.status(400).json({ error: `A student with roll number "${rollNumber}" exists in this class.` });
    }

    const created = await db.models.Student.create({
      name,
      rollNumber: rollNumber.toString(),
      email: email || '',
      classId,
    });

    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add student.' });
  }
});

router.delete('/students/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.models.Student.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Student not found.' });

    res.json({ message: 'Student deleted successfully.', deleted });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove student.' });
  }
});

// ==========================================
// 4. ATTENDANCE LOGS
// ==========================================

// Get attendance session by class & date
router.get('/attendance', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { classId, date } = req.query;
    if (!classId || !date) {
      return res.status(400).json({ error: 'Class ID and date YYYY-MM-DD are required.' });
    }

    const session = await db.models.Attendance.findOne({
      classId: classId as string,
      date: date as string,
    });

    if (!session) {
      // Return empty configuration
      return res.json({ classId, date, records: [] });
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance logs.' });
  }
});

// Set/Overwrite attendance logs for a date
router.post('/attendance', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { classId, date, records } = req.body;
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
    if (!classId || !date || !records) {
      return res.status(400).json({ error: 'Class ID, date, and roster records are required.' });
    }

    // Save logs
    const session = await db.models.Attendance.findOneAndUpdate(
      { classId, date },
      {
        records,
        takenById: req.user.id,
      },
      { upsert: true }
    );

    res.json({ status: 'success', session });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save attendance log.' });
  }
});

// Statistics summary for dashboard visual charts
router.get('/attendance/summary', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { classId } = req.query;
    if (!classId) return res.status(400).json({ error: 'Class ID is required.' });

    const students = await db.models.Student.find({ classId: classId as string });
    const allAttendance = await db.models.Attendance.find({ classId: classId as string });

    const totalSessions = allAttendance.length;

    // Create record mapping
    const studentStats = students.map(s => {
      let present = 0;
      let absent = 0;
      let late = 0;
      let excused = 0;

      allAttendance.forEach(a => {
        const record = a.records.find(r => r.studentId === s._id);
        if (record) {
          if (record.status === 'Present') present++;
          else if (record.status === 'Absent') absent++;
          else if (record.status === 'Late') late++;
          else if (record.status === 'Excused') excused++;
        } else {
          // If a student doesn't have a record on that date, default to absent/excused
          absent++; 
        }
      });

      const totalClasses = present + absent + late + excused;
      const presentRate = totalClasses > 0 ? Math.round(((present + late * 0.7) / totalClasses) * 100) : 100;

      return {
        _id: s._id,
        name: s.name,
        rollNumber: s.rollNumber,
        present,
        absent,
        late,
        excused,
        presentRate,
      };
    });

    // Date-by-date attendance rates
    const timeline = allAttendance.map(a => {
      const presentCount = a.records.filter(r => r.status === 'Present' || r.status === 'Late').length;
      const totalStudents = a.records.length;
      const rate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
      return {
        date: a.date,
        presentCount,
        totalStudents,
        rate,
      };
    }).sort((a,b) => a.date.localeCompare(b.date));

    res.json({
      totalSessions,
      studentStats,
      timeline,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to compute class statistics.' });
  }
});

// ==========================================
// 5. SMART GEMINI AI INTEGRATIONS
// ==========================================

// Parse Voice/Text Rolls Call transcript
router.post('/ai/parse-attendance', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { rawText, students } = req.body;

    if (!rawText || !students || !Array.isArray(students)) {
      return res.status(400).json({ error: 'Roster and transcription text are required.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'AI processing is currently offline. Please configure your GEMINI_API_KEY.' });
    }

    // Build the system prompt & instructions
    const systemPrompt = `You are an expert AI administrative processor of classroom files and vocal transcriptions for a Smart Attendance System.
Given a raw roll-call transcription transcript, map the spoken statements to individual student entries from the actual class roster provided.

Available student statuses are: 'Present', 'Absent', 'Late', or 'Excused'.
Use these default rules to map common patterns:
- "is here", "present", "online", "yeah", "yes", "got it" -> 'Present'
- "absent", "not here", "sick", "vacation", "missed" -> 'Absent'
- "late", "running late", "arrived late", "delayed" -> 'Late'
- "excused", "permission slip", "pre-authorized" -> 'Excused'
- Any student not explicitly named or described as present/late should default to 'Absent' ONLY if the transcript suggests a full roll call was taken, otherwise preserve existing state or default to 'Present' or 'Absent'. For safest results, identify explicitly named student states.

Map any casual speech, typos, or alternate names (e.g., matching "Lokesh" to Lokesh Mallepula, or "Sarah" to Sarah Croft) using smart fuzzy-matching based on the provided student names database.

You MUST respond strictly with a valid JSON array matching the exact format:
[
  { "studentId": "string", "name": "string", "status": "Present" | "Absent" | "Late" | "Excused", "remarks": "Brief matching explanation or speaker comment" }
]
Do not include markdown wrappers, additional text, or conversational lines. Just output the array.`;

    const userPrompt = `Roster list of active students:
${JSON.stringify(students.map(s => ({ id: s._id, name: s.name, rollNumber: s.rollNumber })))}

Raw Transcription roll-call text:
"${rawText}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      }
    });

    const parsedResults = JSON.parse(response.text.trim());
    res.json(parsedResults);
  } catch (error: any) {
    console.error('Gemini Smart Parse error:', error);
    res.status(500).json({ error: 'AI could not digest the raw script. Please log the roster manually or try again with a cleaner transcript.' });
  }
});

// AI Predictions & Actionable Alert Suggestions based on logs
router.post('/ai/generate-insights', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { timeline, studentStats, className } = req.body;

    if (!studentStats || !Array.isArray(studentStats)) {
      return res.status(400).json({ error: 'Attendance history data is required to run predictive insights.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'AI reporting pipeline is currently offline.' });
    }

    const promptMessage = `Provide premium, high-value visual attendance pattern summaries and alerts for my class "${className || 'Students Class'}".
Review the student log datasets:
- Student stats containing total presence, absence, late metrics, and computed rates:
${JSON.stringify(studentStats)}

- Class timelines summarizing daily present rates over past milestones:
${JSON.stringify(timeline || [])}

Generate a concise, professional report containing:
1. **Critical Alerts**: Flags students currently dropping below 75% present rates, noting if they are chronic absentees. 
2. **Key Absence Trends**: Identifies overall class patterns (e.g. "Absences spike on Fridays", "Roster rates improved by 12% last week", etc.).
3. **Smart Action Plans**: Tailored recommendation steps for the teacher to re-engage struggling students or hold interventions.
4. **Interactive Template draft**: Write brief, high-empathy re-engagement email templates for the parents or students with a placeholder like "[Student Name]" to help teachers reach out instantly.

Respond in direct professional markdown format. Use visual components like list bullets, bold accents or alert callouts. Keep content human-centric, positive, and clean. Avoid technical labels, system lines, or code. Do not praise yourself or write general introductions. Make it scannable.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: promptMessage,
    });

    res.json({ insights: response.text });
  } catch (error: any) {
    console.error('Gemini Insights generation error:', error);
    res.status(500).json({ error: 'Failed to generate smart recommendations. Please try again later.' });
  }
});

export default router;
