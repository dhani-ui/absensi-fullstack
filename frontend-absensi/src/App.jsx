import { useState, useEffect, useRef } from "react";
import axios from "axios";
import * as faceapi from 'face-api.js';

const API_URL = "http://localhost:8080/api/absensi";

function App() {
  // State untuk Data & Form
  const [absensi, setAbsensi] = useState([]);
  const [form, setForm] = useState({ nama: "", tanggal: "", kelas: "", keterangan: "Hadir" });
  
  // State untuk Face Recognition
  const videoRef = useRef();
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);

  // 1. Load AI Models & Kamera saat start
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        setLoadingModels(false);
        startVideo();
      } catch (err) {
        console.error("Gagal memuat model AI:", err);
      }
    };
    loadModels();
    fetchData();
  }, []);

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: {} })
      .then((stream) => { if (videoRef.current) videoRef.current.srcObject = stream; })
      .catch((err) => console.error("Akses kamera ditolak", err));
  };

  // 2. Deteksi Wajah Secara Real-time
  const handleVideoPlay = () => {
    setInterval(async () => {
      if (videoRef.current && modelsLoaded) {
        const detections = await faceapi.detectAllFaces(
          videoRef.current, 
          new faceapi.TinyFaceDetectorOptions()
        );
        setIsFaceDetected(detections.length > 0);
      }
    }, 1000); // Scan setiap 1 detik agar tidak berat di Termux
  };

  // 3. Logika CRUD
  const fetchData = async () => {
    const res = await axios.get(API_URL);
    setAbsensi(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFaceDetected) {
      alert("Wajah tidak terdeteksi! Pastikan wajah terlihat di kamera.");
      return;
    }
    await axios.post(API_URL, form);
    fetchData();
    setForm({ nama: "", tanggal: "", kelas: "", keterangan: "Hadir" });
  };

  const handleDelete = async (id) => {
    if(window.confirm("Hapus data ini?")) {
      await axios.delete(`${API_URL}/${id}`);
      fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Sistem Absensi AI</h1>
          <p className="text-gray-500 mt-2">Gunakan kamera untuk validasi kehadiran</p>
        </div>

        {/* Section Kamera & Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Kamera Card */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
            <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase">Scanner Wajah</h2>
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border-4 transition-colors duration-500 shadow-inner" 
                 style={{ borderColor: isFaceDetected ? '#22c55e' : '#ef4444' }}>
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                onPlay={handleVideoPlay}
                className="w-full h-full object-cover mirror"
              />
              <div className={`absolute bottom-2 right-2 px-3 py-1 rounded-md text-xs font-bold text-white shadow-lg ${isFaceDetected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}>
                {isFaceDetected ? "READY" : "FACE NOT FOUND"}
              </div>
            </div>
            {loadingModels && <p className="text-xs text-blue-500 mt-2">Memuat AI Model...</p>}
          </div>

          {/* Form Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-400 mb-4 uppercase">Data Kehadiran</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Nama Lengkap" required
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
              
              <div className="grid grid-cols-2 gap-4">
                <input type="date" required
                  className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} />
                <input type="text" placeholder="Kelas" required
                  className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={form.kelas} onChange={(e) => setForm({ ...form, kelas: e.target.value })} />
              </div>

              <select
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all"
                value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })}>
                <option value="Hadir">Hadir</option>
                <option value="Izin">Izin</option>
                <option value="Sakit">Sakit</option>
                <option value="Alpha">Alpha</option>
              </select>

              <button 
                type="submit" 
                disabled={!isFaceDetected}
                className={`w-full font-semibold p-3 rounded-lg transition-all shadow-md ${isFaceDetected ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                {isFaceDetected ? "Simpan Kehadiran" : "Wajah Harus Terdeteksi"}
              </button>
            </form>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
             <h2 className="font-bold text-gray-700">Riwayat Absensi</h2>
             <span className="text-xs text-gray-500">{absensi.length} baris data</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-gray-400 text-xs uppercase tracking-wider">
                  <th className="p-4 border-b">Nama</th>
                  <th className="p-4 border-b">Tanggal</th>
                  <th className="p-4 border-b">Kelas</th>
                  <th className="p-4 border-b text-center">Status</th>
                  <th className="p-4 border-b text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {absensi.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/30 transition border-b border-gray-50 last:border-0">
                    <td className="p-4 font-semibold text-gray-800">{item.nama}</td>
                    <td className="p-4 text-gray-600">{item.tanggal}</td>
                    <td className="p-4 text-gray-600">{item.kelas}</td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase
                        ${item.keterangan === 'Hadir' ? 'bg-green-100 text-green-700' : 
                          item.keterangan === 'Sakit' ? 'bg-yellow-100 text-yellow-700' : 
                          item.keterangan === 'Izin' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                        {item.keterangan}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
