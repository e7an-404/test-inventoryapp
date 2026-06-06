import React, { useState, useRef, useEffect } from 'react';
import { Camera, Image as ImageIcon, Trash2, Video, RefreshCw, AlertCircle, Sparkles, AlertTriangle } from 'lucide-react';

interface ProductPhotoSelectorProps {
  value: string;
  onChange: (newValue: string) => void;
  isDark: boolean;
}

export const ProductPhotoSelector: React.FC<ProductPhotoSelectorProps> = ({
  value,
  onChange,
  isDark
}) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera helper
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setCameraError(null);
  };

  // Start camera helper
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        stopCamera();
      }
      
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => {
          console.warn("Autoplay failed, trying with play button", e);
        });
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      let errorMsg = 'Gagal mengakses kamera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Akses kamera ditolak. Silahkan periksa izin browser Anda.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'Perangkat kamera tidak ditemukan.';
      } else {
        errorMsg = `Gagal membuka kamera: ${err.message || 'Error tidak dikenal'}`;
      }
      setCameraError(errorMsg);
    }
  };

  // Restart camera if facingMode changes while camera is active
  useEffect(() => {
    if (isCameraActive) {
      startCamera();
    }
    return () => {
      // Don't stop unless unmounting
    };
  }, [facingMode]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Capture Photo
  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      
      // Set canvas size to match the actual video stream
      const videoWidth = video.videoWidth || 640;
      const videoHeight = video.videoHeight || 480;
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw the current video frame on canvas
        ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
        
        // Convert to high-quality compressed JPEG base64 string
        const base64Data = canvas.toDataURL('image/jpeg', 0.85);
        onChange(base64Data);
        stopCamera();
      }
    } catch (err) {
      console.error('Capture photo error:', err);
      setCameraError('Gagal memproses snapshot gambar.');
    }
  };

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Direct sanity check for file size (standard local check, let's keep it clean under 3MB)
    if (file.size > 3.5 * 1024 * 1024) {
      alert('Ukuran berkas gambar maksimal 3.5 MB untuk menjaga penyimpanan lokal.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      onChange(base64String);
    };
    reader.onerror = () => {
      alert('Gagal membaca berkas gambar.');
    };
    reader.readAsDataURL(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const clearPhoto = () => {
    onChange('');
    stopCamera();
  };

  const toggleFacingMode = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2.5">
        
        {/* Hidden File Input */}
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          id="product_photo_uploader_input"
        />

        {/* INPUT URL & OPTIONS HEADER */}
        <div className="relative">
          <input 
            type="url" 
            value={value && value.startsWith('data:') ? '[Foto Kamera/Unggahan Lokal]' : value}
            onChange={(e) => {
              if (!e.target.value.startsWith('[')) {
                onChange(e.target.value);
              }
            }}
            placeholder=" https://example.com/foto-produk.jpg atau ambil langsung dari kamera"
            className={`w-full pr-10 border rounded-lg px-3 py-2 text-xs font-bold leading-normal transition-all focus:ring-1 focus:ring-indigo-500 focus:outline-none ${
              isDark 
                ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' 
                : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
            }`}
          />
          {value && (
            <button
              type="button"
              onClick={clearPhoto}
              title="Hapus foto saat ini"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition cursor-pointer p-1 rounded-sm"
              id="clear_photo_btn"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        {/* ACTION BUTTONS (CAMERA & FILE SELECTOR) */}
        {!isCameraActive && (
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={startCamera}
              className={`flex items-center justify-center gap-2 py-2 px-3.5 text-[11px] font-black uppercase tracking-wider rounded-xl border transition cursor-pointer ${
                isDark
                  ? 'bg-indigo-950/30 border-indigo-900/40 hover:bg-indigo-950/60 text-indigo-400 hover:text-indigo-300'
                  : 'bg-indigo-50/55 border-indigo-100 hover:bg-indigo-50 text-indigo-700'
              }`}
              id="btn_trigger_camera_capture"
            >
              <Camera size={14} className="stroke-[2.5]" />
              Ambil Foto
            </button>

            <button
              type="button"
              onClick={triggerFileSelect}
              className={`flex items-center justify-center gap-2 py-2 px-3.5 text-[11px] font-black uppercase tracking-wider rounded-xl border transition cursor-pointer ${
                isDark
                  ? 'bg-emerald-950/15 border-emerald-900/35 hover:bg-emerald-950/30 text-emerald-400 hover:text-emerald-300'
                  : 'bg-emerald-50/20 border-emerald-100 hover:bg-emerald-50/50 text-emerald-700'
              }`}
              id="btn_trigger_local_upload"
            >
              <ImageIcon size={14} className="stroke-[2.5]" />
              Unggah File
            </button>
          </div>
        )}

        {/* ACTIVE WEBCAM PANEL SCREEN */}
        {isCameraActive && (
          <div className={`rounded-xl border p-3 space-y-3 ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="relative rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center">
              <video 
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <div className="absolute top-2 left-2 px-2 py-1 bg-red-650 bg-red-600 text-white rounded text-[8px] font-black tracking-widest uppercase animate-pulse flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white block"></span>
                LIVE KAMERA
              </div>

              {/* Facing Mode Control switcher for mobile user vs environment */}
              <button
                type="button"
                onClick={toggleFacingMode}
                title="Ganti arah kamera (depan/belakang)"
                className="absolute top-2 right-2 p-2 bg-slate-900/80 hover:bg-slate-950 text-white rounded-lg border border-slate-800 transition cursor-pointer"
                id="btn_switch_camera_facing"
              >
                <RefreshCw size={13} className="animate-spin-once" />
              </button>
            </div>

            {/* Camera Capture Controls bar */}
            <div className="flex gap-2 text-[10px]">
              <button
                type="button"
                onClick={capturePhoto}
                className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-550 text-white font-black uppercase tracking-wider rounded-lg transition text-center cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                id="btn_shoot_photo_snap"
              >
                <Camera size={14} />
                BIDIK SEKARANG
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className={`py-2 px-3 font-bold uppercase tracking-wider rounded-lg transition cursor-pointer border ${
                  isDark 
                    ? 'border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-slate-300' 
                    : 'border-slate-200 hover:bg-slate-100 text-slate-500'
                }`}
                id="btn_cancel_camera_capture"
              >
                Kembali
              </button>
            </div>
          </div>
        )}

        {/* DYNAMIC ERROR ALERTS */}
        {cameraError && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg border bg-rose-500/10 border-rose-500/20 text-rose-500 text-[10px] leading-relaxed">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-bold uppercase tracking-wider">Izin Kamera Terhambat</p>
              <p className="mt-0.5 text-slate-400">{cameraError}</p>
            </div>
          </div>
        )}

        {/* ACTIVE PHOTO MINIATURE PREVIEW THUMBNAIL */}
        {value && (
          <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
            isDark ? 'bg-slate-900/30 border-slate-850' : 'bg-slate-50/40 border-slate-150'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0 bg-slate-950 flex items-center justify-center">
                <img 
                  src={value} 
                  alt="Review foto produk" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback visual indicator
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Preview Terpasang</span>
                <p className="text-[9px] text-slate-500 truncate max-w-[180px] font-mono mt-0.5">
                  {value.startsWith('data:') ? `Upload Base64 (${Math.round(value.length / 1024)} KB)` : value}
                </p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={clearPhoto}
              className="p-1.5 rounded-lg border border-rose-500/20 hover:border-rose-500/40 bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 transition cursor-pointer"
              title="Hapus foto produk"
              id="delete_photo_review_btn"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
