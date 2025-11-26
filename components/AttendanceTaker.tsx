import React, { useState, useRef, useEffect } from 'react';
import { Student, AttendanceResult, AttendanceRecord } from '../types';
import { analyzeAttendance } from '../services/gemini';
import { saveAttendance, generateId } from '../services/db';
import { Camera, Upload, RefreshCw, CheckCircle, XCircle, AlertTriangle, Video, Info } from 'lucide-react';

interface AttendanceTakerProps {
  students: Student[];
}

const AttendanceTaker: React.FC<AttendanceTakerProps> = ({ students }) => {
  const [mode, setMode] = useState<'upload' | 'camera'>('camera');
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AttendanceResult | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize camera when in camera mode
  useEffect(() => {
    if (mode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera error", err);
      alert("Could not access camera. Please ensure permissions are granted.");
      setMode('upload');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      setImage(canvas.toDataURL('image/jpeg'));
      // Don't stop camera yet, maybe they want to retake
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processAttendance = async () => {
    if (!image || students.length === 0) return;
    setIsProcessing(true);
    setResult(null);

    try {
      const analysis = await analyzeAttendance(students, image);
      setResult(analysis);

      // Auto-save record
      const record: AttendanceRecord = {
        id: generateId(),
        timestamp: Date.now(),
        presentStudentIds: students
            .filter(s => analysis.presentNames.includes(s.name))
            .map(s => s.id),
        totalStudents: students.length,
        imageUrl: image,
        note: analysis.reasoning
      };
      await saveAttendance(record);

    } catch (err) {
      console.error(err);
      alert("AI Processing Failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    if (mode === 'camera') startCamera();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      {/* Left Column: Input Source */}
      <div className="flex flex-col gap-4">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg flex flex-col h-full min-h-[500px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${mode === 'camera' ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`}></span>
              {mode === 'camera' ? 'CCTV / Live Feed' : 'Image Upload'}
            </h3>
            <div className="flex gap-2 bg-slate-900 p-1 rounded-lg">
              <button
                onClick={() => { setMode('camera'); setResult(null); setImage(null); }}
                className={`px-3 py-1 text-sm rounded-md transition-all ${mode === 'camera' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Video className="w-4 h-4 inline mr-1" /> Live
              </button>
              <button
                onClick={() => { setMode('upload'); setResult(null); setImage(null); }}
                className={`px-3 py-1 text-sm rounded-md transition-all ${mode === 'upload' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Upload className="w-4 h-4 inline mr-1" /> Upload
              </button>
            </div>
          </div>

          <div className="flex-1 bg-slate-950 rounded-lg overflow-hidden relative flex items-center justify-center border border-slate-800">
            {image ? (
              <img src={image} alt="Captured" className="w-full h-full object-contain" />
            ) : mode === 'camera' ? (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="text-center cursor-pointer p-10 hover:bg-slate-900 w-full h-full flex flex-col items-center justify-center transition-colors"
              >
                <Upload className="w-12 h-12 text-slate-600 mb-4" />
                <p className="text-slate-400">Click to upload classroom photo</p>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
              </div>
            )}

            {/* Overlay Buttons */}
            {mode === 'camera' && !image && (
              <button
                onClick={captureImage}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white text-slate-900 rounded-full p-4 shadow-xl hover:scale-105 transition-transform"
              >
                <Camera className="w-8 h-8" />
              </button>
            )}
            {image && !isProcessing && !result && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                <button
                  onClick={reset}
                  className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600"
                >
                  Retake
                </button>
                <button
                  onClick={processAttendance}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 font-medium"
                >
                  Analyze Attendance
                </button>
              </div>
            )}
          </div>
          
          <div className="mt-4 text-xs text-slate-500 flex gap-2 items-center">
            <Info className="w-4 h-4" />
            Ensure student faces are visible and well-lit for best accuracy.
          </div>
        </div>
      </div>

      {/* Right Column: Results */}
      <div className="flex flex-col gap-4">
        {isProcessing ? (
          <div className="h-full flex flex-col items-center justify-center bg-slate-800/50 rounded-xl border border-slate-700 animate-pulse p-8">
            <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
            <h3 className="text-xl font-semibold text-white">Analyzing with Gemini...</h3>
            <p className="text-slate-400 text-center mt-2 max-w-md">
              Comparing {students.length} reference profiles against the target image. This may take a moment.
            </p>
          </div>
        ) : result ? (
          <div className="bg-slate-800 rounded-xl border border-slate-700 flex flex-col h-full overflow-hidden shadow-xl animate-fade-in-up">
            <div className="p-6 border-b border-slate-700 bg-slate-800">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Attendance Report</h3>
                  <p className="text-slate-400 text-sm">
                    {new Date().toLocaleString()} • {result.confidence} Confidence
                  </p>
                </div>
                <button onClick={reset} className="text-sm text-indigo-400 hover:text-indigo-300">
                  New Scan
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-emerald-400">{result.presentNames.length}</div>
                  <div className="text-xs text-emerald-300 uppercase tracking-wider font-semibold">Present</div>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-red-400">{result.absentNames.length}</div>
                  <div className="text-xs text-red-300 uppercase tracking-wider font-semibold">Absent</div>
                </div>
              </div>

              {/* Lists */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">Present Students</h4>
                  {result.presentNames.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {result.presentNames.map((name, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-slate-900/50 p-2 rounded border border-slate-700">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <span className="text-slate-200">{name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">No students detected.</p>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">Absent Students</h4>
                  {result.absentNames.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {result.absentNames.map((name, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-slate-900/50 p-2 rounded border border-slate-700 opacity-75">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-slate-400">{name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">Everyone is present!</p>
                  )}
                </div>
              </div>

              {/* AI Reasoning */}
              {result.reasoning && (
                <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-lg p-4 text-sm text-indigo-200">
                  <strong className="block mb-1 text-indigo-400">AI Analysis:</strong>
                  {result.reasoning}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl p-8">
            <Camera className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">Ready to Scan</p>
            <p className="text-sm">Capture an image or upload a photo to begin attendance.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceTaker;