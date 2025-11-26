import React from 'react';
import { Student, AttendanceRecord } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, UserCheck, UserX, Calendar } from 'lucide-react';

interface DashboardProps {
  students: Student[];
  history: AttendanceRecord[];
}

const Dashboard: React.FC<DashboardProps> = ({ students, history }) => {
  const totalStudents = students.length;
  
  // Calculate stats
  const totalSessions = history.length;
  let totalPresentCount = 0;
  
  history.forEach(h => {
    totalPresentCount += h.presentStudentIds.length;
  });

  const avgAttendance = totalSessions > 0 
    ? Math.round((totalPresentCount / (totalSessions * (totalStudents || 1))) * 100) 
    : 0;

  // Prepare chart data (Last 7 sessions)
  const chartData = history.slice(0, 7).map((h, i) => ({
    name: new Date(h.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    present: h.presentStudentIds.length,
    absent: (h.totalStudents || totalStudents) - h.presentStudentIds.length,
    total: h.totalStudents || totalStudents
  }));

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
      <p className="text-slate-400 text-sm">{label}</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Users} 
          label="Total Students" 
          value={totalStudents} 
          color="bg-blue-500" 
        />
        <StatCard 
          icon={Calendar} 
          label="Sessions Recorded" 
          value={totalSessions} 
          color="bg-purple-500" 
        />
        <StatCard 
          icon={UserCheck} 
          label="Average Attendance" 
          value={`${avgAttendance}%`} 
          color="bg-emerald-500" 
        />
        <StatCard 
          icon={UserX} 
          label="Recent Absences (Last Session)" 
          value={history.length > 0 ? (history[0].totalStudents - history[0].presentStudentIds.length) : 0} 
          color="bg-red-500" 
        />
      </div>

      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
        <h3 className="text-lg font-semibold text-white mb-6">Attendance Trend (Last 7 Sessions)</h3>
        <div className="h-80 w-full">
          {history.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                  itemStyle={{ color: '#f8fafc' }}
                  cursor={{fill: '#334155', opacity: 0.4}}
                />
                <Bar dataKey="present" name="Present" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                <Bar dataKey="absent" name="Absent" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="flex items-center justify-center h-full text-slate-500">
               No attendance data available yet.
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;