import React, { useState, useRef } from 'react';
import { Student } from '../types';
import { saveStudent, deleteStudent, generateId } from '../services/db';
import { Plus, Trash2, Upload, User, Search, RefreshCw } from 'lucide-react';

interface StudentManagerProps {
  students: Student[];
  onUpdate: () => void;
}

const StudentManager: React.FC<StudentManagerProps> = ({ students, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhoto, setNewPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Resize to reasonable size for storage/API
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const maxSize = 512;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);
          setNewPhoto(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!newName || !newPhoto) return;
    setLoading(true);
    try {
      const newStudent: Student = {
        id: generateId(),
        name: newName,
        photoData: newPhoto,
        enrolledDate: Date.now(),
      };
      await saveStudent(newStudent);
      setNewName('');
      setNewPhoto(null);
      setIsAdding(false);
      onUpdate();
    } catch (err: any) {
      console.error(err);
      // More detailed error message
      alert(`Failed to save student: ${err.message || err.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this student?')) {
      await deleteStudent(id);
      onUpdate();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-white">Enrolled Students</h3>
          <p className="text-slate-400">Manage your class roster and reference photos.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          {isAdding ? 'Cancel' : <><Plus className="w-4 h-4" /> Add Student</>}
        </button>
      </div>

      {isAdding && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 animate-fade-in shadow-xl">
          <h4 className="text-lg font-semibold text-white mb-4">New Student Enrollment</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Reference Photo</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-900/50"
                >
                  {newPhoto ? (
                    <img src={newPhoto} alt="Preview" className="h-32 w-32 object-cover rounded-full border-2 border-indigo-500" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-500 mb-2" />
                      <span className="text-sm text-slate-500">Click to upload face photo</span>
                    </>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
              </div>
            </div>
            
            <div className="flex items-end justify-end">
              <button
                disabled={!newName || !newPhoto || loading}
                onClick={handleSave}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors w-full md:w-auto"
              >
                {loading ? 'Saving...' : 'Confirm Enrollment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {students.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
          <div className="bg-slate-800 p-4 rounded-full inline-block mb-4">
            <User className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-400">No students enrolled yet. Add some students to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {students.map((student) => (
            <div key={student.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex items-center gap-4 hover:border-slate-600 transition-colors group">
              <img
                src={student.photoData}
                alt={student.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-slate-600"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-medium truncate">{student.name}</h4>
                <p className="text-xs text-slate-500 truncate">ID: {student.id.slice(0, 8)}...</p>
                <p className="text-xs text-slate-500">Joined: {new Date(student.enrolledDate).toLocaleDateString()}</p>
              </div>
              <button
                onClick={() => handleDelete(student.id)}
                className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentManager;