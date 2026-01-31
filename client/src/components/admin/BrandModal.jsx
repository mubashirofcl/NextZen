import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { X, Save, Upload, Loader2, Award } from "lucide-react";
import { adminToast } from "../../utils/adminToast";

const BrandModal = ({ isOpen, onClose, mode, initialData, onSubmit }) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    formState: { isSubmitting, errors },
  } = useForm();

  const [uploading, setUploading] = useState(false);
  const logo = watch("logo");

  useEffect(() => {
    if (!isOpen) return;
    if (mode === "edit" && initialData) {
      reset({
        name: initialData.name,
        logo: initialData.logo,
      });
    } else {
      reset({ name: "", logo: "" });
    }
  }, [isOpen, mode, initialData, reset]);

  if (!isOpen) return null;

  const uploadImage = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ url: reader.result });
      reader.onerror = () => reject(new Error("Failed to read image"));
      reader.readAsDataURL(file);
    });

  const handleImageUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      adminToast.warn("Format Error", "Only image files allowed");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      adminToast.warn("Size Error", "Image must be under 8MB");
      return;
    }
    try {
      setUploading(true);
      const res = await uploadImage(file);
      setValue("logo", res.url, { shouldValidate: true });
    } catch {
      adminToast.warn("Sync Error", "Image processing failed");
    } finally {
      setUploading(false);
    }
  };

  const submitHandler = async (data) => {
    try {
      await onSubmit(data);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || "Brand already exists!";
      setError("name", { type: "server", message: msg });
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-[420px] rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
        <div className="px-8 py-5 border-b flex justify-between items-center bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0F172A] text-white rounded-xl flex items-center justify-center shadow-lg shadow-slate-200">
              <Award size={20} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-[#0F172A] leading-none">
                {mode === "add" ? "Register Partner" : "Edit Brand Profile"}
              </h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Official Brand Registry</p>
            </div>
          </div>
          <button
            onClick={() => !uploading && onClose()}
            className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all active:scale-90"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit(submitHandler)} className="space-y-8">
            <div className="flex justify-center">
              <label className="relative cursor-pointer group">
                <div className={`w-32 h-32 rounded-[28px] border-4 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden bg-white shadow-inner ${errors.logo ? 'border-red-200 bg-red-50' : 'border-slate-100 group-hover:border-[#7a6af6] group-hover:bg-slate-50'}`}>
                  {uploading ? (
                    <Loader2 className="animate-spin text-[#7a6af6]" size={28} />
                  ) : logo ? (
                    <img src={logo} className="w-full h-full object-contain p-3 animate-in fade-in zoom-in" alt="Brand Logo" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="text-slate-300 group-hover:text-[#7a6af6] group-hover:animate-bounce" size={28} />
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Attach Logo</span>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files[0])}
                />
              </label>
            </div>

            <input type="hidden" {...register("logo", { required: true })} />

            <div className="space-y-2">
              <div className="flex justify-between items-end mb-1">
                <label className="text-[10px] font-black uppercase text-[#0F172A] tracking-widest ml-1">
                  Authorized Brand Name *
                </label>
                {errors.name && (
                  <p className="text-[9px] font-black text-red-500 uppercase animate-pulse pr-1">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <input
                {...register("name", {
                  required: "Name is required",
                  validate: {
                    notEmpty: (val) => val.trim().length > 0 || "Cannot be empty",
                    noLeadingSpace: (val) => !/^\s/.test(val) || "No leading spaces",
                    onlyLettersAndSpaces: (val) => /^[A-Za-z ]+$/.test(val) || "Letters only",
                    noOnlyDots: (val) => !/^[.]+$/.test(val) || "Dots not allowed",
                  }
                })}
                placeholder="e.g. NIKE"
                className={`w-full bg-white border-2 rounded-2xl px-6 py-4 text-xs font-bold text-[#0F172A] outline-none shadow-sm transition-all ${
                  errors.name 
                    ? 'border-red-500 bg-red-50 ring-4 ring-red-50/20' 
                    : 'border-slate-100 focus:border-[#7a6af6] focus:ring-4 focus:ring-purple-50'
                }`}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || uploading}
                className="w-full bg-[#0F172A] text-white py-4.5 p-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-black hover:shadow-slate-300 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <>
                    <Save size={16} />
                    {mode === "add" ? "Register Brand" : "Update Profile"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BrandModal;