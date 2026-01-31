import Cropper from "react-easy-crop";
import { useState, useCallback } from "react";
import { Scissors, X, Maximize2, Check } from "lucide-react";

const ImageCropModal = ({ src, onCancel, onConfirm }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixels, setPixels] = useState(null);

  const onComplete = useCallback((_, croppedPixels) => {
    setPixels(croppedPixels);
  }, []);

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[400px] overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">

        {/* COMPACT MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#7a6af6] rounded-lg flex items-center justify-center text-white shadow-md">
              <Scissors size={14} />
            </div>
            <h3 className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest leading-none">
              Crop Asset
            </h3>
          </div>
          <button onClick={onCancel} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* COMPACT CROPPER AREA */}
        <div className="p-5">
          <div className="relative h-[320px] w-full bg-slate-900 rounded-xl overflow-hidden shadow-inner border border-slate-100">
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={4 / 5}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onComplete}
            />
          </div>

          {/* ZOOM CONTROL */}
          <div className="mt-5 space-y-2">
            <div className="flex justify-between items-center px-0.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Maximize2 size={10} className="text-[#7a6af6]" /> Zoom
              </label>
              <span className="text-[9px] font-bold text-slate-400">{(zoom * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#7a6af6]"
            />
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-2.5 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirm(pixels)}
              className="flex-[1.5] bg-[#0F172A] text-white py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Check size={12} strokeWidth={3} /> Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;