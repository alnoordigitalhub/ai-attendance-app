import React from 'react';
import { View } from '../types';
import { LayoutDashboard, Users, Camera, History, ShieldCheck } from 'lucide-react';

interface LayoutProps {
  currentView: View;
  setView: (view: View) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentView, setView, children }) => {
  const navItems = [
    { id: View.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: View.STUDENTS, label: 'Students', icon: Users },
    { id: View.ATTENDANCE, label: 'Live Attendance', icon: Camera },
    { id: View.HISTORY, label: 'History', icon: History },
  ];

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <ShieldCheck className="w-8 h-8 text-indigo-500" />
          <div>
            <h1 className="font-bold text-xl tracking-tight">Sentinel AI</h1>
            <p className="text-xs text-slate-500">Attendance System</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-indigo-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 text-xs text-slate-600 text-center">
           Powered by Gemini 2.5 Flash
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-slate-900/50 backdrop-blur border-b border-slate-800 flex items-center px-8 sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-slate-200">
            {navItems.find((n) => n.id === currentView)?.label}
          </h2>
        </header>
        
        <div className="flex-1 overflow-auto p-8 relative">
           {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;