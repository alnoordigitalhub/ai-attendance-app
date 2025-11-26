import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import StudentManager from './components/StudentManager';
import AttendanceTaker from './components/AttendanceTaker';
import Dashboard from './components/Dashboard';
import { View, Student, AttendanceRecord } from './types';
import { getStudents, getAttendanceHistory } from './services/db';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [students, setStudents] = useState<Student[]>([]);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [fetchedStudents, fetchedHistory] = await Promise.all([
        getStudents(),
        getAttendanceHistory()
      ]);
      setStudents(fetchedStudents);
      setHistory(fetchedHistory);
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full text-indigo-400">
          <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      );
    }

    switch (currentView) {
      case View.DASHBOARD:
        return <Dashboard students={students} history={history} />;
      case View.STUDENTS:
        return <StudentManager students={students} onUpdate={fetchData} />;
      case View.ATTENDANCE:
        return <AttendanceTaker students={students} />;
      case View.HISTORY:
        return (
           <div className="space-y-4">
             <h3 className="text-2xl font-bold text-white mb-4">History Logs</h3>
             {history.length === 0 ? (
               <p className="text-slate-500">No records found.</p>
             ) : (
               history.map(record => (
                 <div key={record.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="flex gap-4 items-center">
                      <img src={record.imageUrl} alt="Snap" className="w-16 h-16 object-cover rounded bg-slate-900" />
                      <div>
                        <div className="font-semibold text-white">
                          {new Date(record.timestamp).toLocaleDateString()} at {new Date(record.timestamp).toLocaleTimeString()}
                        </div>
                        <div className="text-sm text-slate-400">
                           Present: {record.presentStudentIds.length} / {record.totalStudents}
                        </div>
                      </div>
                    </div>
                    {record.note && (
                      <div className="text-xs text-indigo-300 max-w-xs bg-indigo-900/20 p-2 rounded">
                        {record.note}
                      </div>
                    )}
                 </div>
               ))
             )}
           </div>
        );
      default:
        return <div>Not Implemented</div>;
    }
  };

  return (
    <Layout currentView={currentView} setView={setCurrentView}>
      {renderContent()}
    </Layout>
  );
};

export default App;