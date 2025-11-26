import { Student, AttendanceRecord } from '../types';

const DB_NAME = 'SentinelAI_DB';
const DB_VERSION = 2; // Incremented to ensure schema updates
const STORE_STUDENTS = 'students';
const STORE_ATTENDANCE = 'attendance';

// Utility for safe ID generation (works in non-secure contexts too)
export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Fallback if crypto.randomUUID fails
    }
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_STUDENTS)) {
        db.createObjectStore(STORE_STUDENTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_ATTENDANCE)) {
        db.createObjectStore(STORE_ATTENDANCE, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      console.error("IndexedDB Open Error:", (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

export const saveStudent = async (student: Student): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_STUDENTS], 'readwrite');
      const store = transaction.objectStore(STORE_STUDENTS);
      const request = store.put(student);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Save Student Error:", error);
    throw error;
  }
};

export const getStudents = async (): Promise<Student[]> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_STUDENTS], 'readonly');
      const store = transaction.objectStore(STORE_STUDENTS);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Get Students Error:", error);
    return []; // Return empty array on error to prevent crash
  }
};

export const deleteStudent = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_STUDENTS], 'readwrite');
    const store = transaction.objectStore(STORE_STUDENTS);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const saveAttendance = async (record: AttendanceRecord): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_ATTENDANCE], 'readwrite');
    const store = transaction.objectStore(STORE_ATTENDANCE);
    const request = store.put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getAttendanceHistory = async (): Promise<AttendanceRecord[]> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_ATTENDANCE], 'readonly');
      const store = transaction.objectStore(STORE_ATTENDANCE);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result.reverse()); // Newest first
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
     console.error("Get History Error:", error);
     return [];
  }
};