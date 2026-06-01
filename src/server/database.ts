/**
 * Mock MongoDB Database Engine using standard JSON persistence.
 * Implements Mongoose-like Collection APIs for standard MongoDB feel:
 * find, findOne, create, findByIdAndUpdate, findByIdAndDelete, etc.
 * Keeps data safely synchronized with a local 'db.json' file.
 */

import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'db.json');

// Interface definition matching our MongoDB Documents
export interface UserDoc {
  _id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'teacher' | 'admin';
  createdAt: string;
}

export interface ClassDoc {
  _id: string;
  name: string;
  subject: string;
  code: string;
  teacherId: string;
  createdAt: string;
}

export interface StudentDoc {
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

export interface AttendanceDoc {
  _id: string;
  classId: string;
  date: string; // YYYY-MM-DD
  records: AttendanceRecord[];
  takenById: string;
  createdAt: string;
}

interface DatabaseSchema {
  users: UserDoc[];
  classes: ClassDoc[];
  students: StudentDoc[];
  attendance: AttendanceDoc[];
}

// Initial state
const initialData: DatabaseSchema = {
  users: [],
  classes: [],
  students: [],
  attendance: [],
};

class LocalMongo {
  private data: DatabaseSchema;

  constructor() {
    this.data = { ...initialData };
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
        // Ensure all collections are initialized
        this.data.users = this.data.users || [];
        this.data.classes = this.data.classes || [];
        this.data.students = this.data.students || [];
        this.data.attendance = this.data.attendance || [];
      } else {
        this.save();
      }
    } catch (error) {
      console.error('Failed to load local DB, initializing empty DB:', error);
      this.data = { ...initialData };
      this.save();
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save to local DB:', error);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  }

  // collection accessors modeled like mongoose model methods
  public models = {
    User: {
      find: async (query: Partial<UserDoc> = {}): Promise<UserDoc[]> => {
        this.load();
        return this.data.users.filter(u => 
          Object.entries(query).every(([key, val]) => (u as any)[key] === val)
        );
      },
      findOne: async (query: Partial<UserDoc>): Promise<UserDoc | null> => {
        this.load();
        const found = this.data.users.find(u => 
          Object.entries(query).every(([key, val]) => (u as any)[key] === val)
        );
        return found || null;
      },
      create: async (doc: Omit<UserDoc, '_id' | 'createdAt'>): Promise<UserDoc> => {
        this.load();
        const newUser: UserDoc = {
          ...doc,
          _id: this.generateId(),
          createdAt: new Date().toISOString(),
        };
        this.data.users.push(newUser);
        this.save();
        return newUser;
      },
      findById: async (id: string): Promise<UserDoc | null> => {
        this.load();
        return this.data.users.find(u => u._id === id) || null;
      }
    },

    Class: {
      find: async (query: Partial<ClassDoc> = {}): Promise<ClassDoc[]> => {
        this.load();
        return this.data.classes.filter(c => 
          Object.entries(query).every(([key, val]) => (c as any)[key] === val)
        );
      },
      findOne: async (query: Partial<ClassDoc>): Promise<ClassDoc | null> => {
        this.load();
        const found = this.data.classes.find(c => 
          Object.entries(query).every(([key, val]) => (c as any)[key] === val)
        );
        return found || null;
      },
      create: async (doc: Omit<ClassDoc, '_id' | 'createdAt'>): Promise<ClassDoc> => {
        this.load();
        const newClass: ClassDoc = {
          ...doc,
          _id: this.generateId(),
          createdAt: new Date().toISOString(),
        };
        this.data.classes.push(newClass);
        this.save();
        return newClass;
      },
      findById: async (id: string): Promise<ClassDoc | null> => {
        this.load();
        return this.data.classes.find(c => c._id === id) || null;
      },
      findByIdAndDelete: async (id: string): Promise<ClassDoc | null> => {
        this.load();
        const idx = this.data.classes.findIndex(c => c._id === id);
        if (idx === -1) return null;
        const deleted = this.data.classes[idx];
        this.data.classes.splice(idx, 1);
        
        // Cascade delete students and attendance in this class
        this.data.students = this.data.students.filter(s => s.classId !== id);
        this.data.attendance = this.data.attendance.filter(a => a.classId !== id);
        
        this.save();
        return deleted;
      },
      findByIdAndUpdate: async (id: string, update: Partial<ClassDoc>): Promise<ClassDoc | null> => {
        this.load();
        const idx = this.data.classes.findIndex(c => c._id === id);
        if (idx === -1) return null;
        this.data.classes[idx] = { ...this.data.classes[idx], ...update };
        this.save();
        return this.data.classes[idx];
      }
    },

    Student: {
      find: async (query: Partial<StudentDoc> = {}): Promise<StudentDoc[]> => {
        this.load();
        return this.data.students.filter(s => 
          Object.entries(query).every(([key, val]) => (s as any)[key] === val)
        );
      },
      create: async (doc: Omit<StudentDoc, '_id' | 'createdAt'>): Promise<StudentDoc> => {
        this.load();
        const newStudent: StudentDoc = {
          ...doc,
          _id: this.generateId(),
          createdAt: new Date().toISOString(),
        };
        this.data.students.push(newStudent);
        this.save();
        return newStudent;
      },
      findById: async (id: string): Promise<StudentDoc | null> => {
        this.load();
        return this.data.students.find(s => s._id === id) || null;
      },
      findByIdAndDelete: async (id: string): Promise<StudentDoc | null> => {
        this.load();
        const idx = this.data.students.findIndex(s => s._id === id);
        if (idx === -1) return null;
        const deleted = this.data.students[idx];
        this.data.students.splice(idx, 1);
        
        // Remove from all attendance records
        this.data.attendance.forEach(att => {
          att.records = att.records.filter(r => r.studentId !== id);
        });

        this.save();
        return deleted;
      },
      findByIdAndUpdate: async (id: string, update: Partial<StudentDoc>): Promise<StudentDoc | null> => {
        this.load();
        const idx = this.data.students.findIndex(s => s._id === id);
        if (idx === -1) return null;
        this.data.students[idx] = { ...this.data.students[idx], ...update };
        this.save();
        return this.data.students[idx];
      }
    },

    Attendance: {
      find: async (query: Partial<AttendanceDoc> = {}): Promise<AttendanceDoc[]> => {
        this.load();
        return this.data.attendance.filter(a => 
          Object.entries(query).every(([key, val]) => (a as any)[key] === val)
        );
      },
      findOne: async (query: Partial<AttendanceDoc>): Promise<AttendanceDoc | null> => {
        this.load();
        const found = this.data.attendance.find(a => 
          Object.entries(query).every(([key, val]) => (a as any)[key] === val)
        );
        return found || null;
      },
      create: async (doc: Omit<AttendanceDoc, '_id' | 'createdAt'>): Promise<AttendanceDoc> => {
        this.load();
        const newAttendance: AttendanceDoc = {
          ...doc,
          _id: this.generateId(),
          createdAt: new Date().toISOString(),
        };
        this.data.attendance.push(newAttendance);
        this.save();
        return newAttendance;
      },
      findOneAndUpdate: async (
        query: { classId: string; date: string },
        update: Partial<AttendanceDoc>,
        options = { upsert: false }
      ): Promise<AttendanceDoc | null> => {
        this.load();
        let idx = this.data.attendance.findIndex(a => a.classId === query.classId && a.date === query.date);
        
        if (idx === -1) {
          if (options.upsert) {
            const newDoc: AttendanceDoc = {
              _id: this.generateId(),
              classId: query.classId,
              date: query.date,
              records: update.records || [],
              takenById: update.takenById || '',
              createdAt: new Date().toISOString(),
            };
            this.data.attendance.push(newDoc);
            this.save();
            return newDoc;
          }
          return null;
        }

        this.data.attendance[idx] = { ...this.data.attendance[idx], ...update };
        this.save();
        return this.data.attendance[idx];
      },
      findById: async (id: string): Promise<AttendanceDoc | null> => {
        this.load();
        return this.data.attendance.find(a => a._id === id) || null;
      }
    }
  };
}

export const db = new LocalMongo();
