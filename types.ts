export interface Student {
  id: string;
  name: string;
  photoData: string; // Base64
  enrolledDate: number;
}

export interface AttendanceRecord {
  id: string;
  timestamp: number;
  presentStudentIds: string[];
  totalStudents: number;
  imageUrl: string; // The capture used for marking
  note?: string;
}

export enum View {
  DASHBOARD = 'DASHBOARD',
  STUDENTS = 'STUDENTS',
  ATTENDANCE = 'ATTENDANCE',
  HISTORY = 'HISTORY',
}

export interface AttendanceResult {
  presentNames: string[];
  absentNames: string[];
  confidence: string;
  reasoning: string;
}