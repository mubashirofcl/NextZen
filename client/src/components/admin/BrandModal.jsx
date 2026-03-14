import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { X, Save, Upload, Loader2, Award, Percent, Info } from "lucide-react";
import { adminToast } from "../../utils/adminToast";
import { useOffers } from "../../hooks/admin/useOffers";

const BrandModal = ({ isOpen, onClose, mode, initialData, onSubmit }) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    formState: { isSubmitting, errors },
  } = useForm({
    mode: "onBlur"
  });

  const [uploading, setUploading] = useState(false);
  const logo = watch("logo");

  const { offers } = useOffers();
  const brandOffers = offers?.filter(o => o.applyFor === "BRAND" && o.isActive) || [];

  useEffect(() => {
    if (!isOpen) return;
    if (mode === "edit" && initialData) {
      reset({
        name: initialData.name,
        logo: initialData.logo,
        offerId: initialData.offerId?._id || initialData.offerId || ""
      });
    } else {
      reset({ name: "", logo: "", offerId: "" });
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
      adminToast.warn("Format Error", "Please upload a valid image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      adminToast.warn("File Size Alert", "Logo must be smaller than 5MB");
      return;
    }
    try {
      setUploading(true);
      const res = await uploadImage(file);
      setValue("logo", res.url, { shouldValidate: true });
      adminToast.success("Logo Ready", "Brand asset processed successfully");
    } catch {
      adminToast.error("Processing Error", "Failed to prepare the logo");
    } finally {
      setUploading(false);
    }
  };

  const submitHandler = async (data) => {
    try {
      const payload = {
        ...data,
        name: data.name.trim(),
        offerId: data.offerId === "" ? null : data.offerId
      };
      await onSubmit(payload);
      adminToast.success("Success", `Brand ${mode === "add" ? "registered" : "updated"} successfully`);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || "This brand name is already registered";
      setError("name", { type: "server", message: msg });
      adminToast.error("Registration Failed", msg);
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
            type="button"
            onClick={() => !uploading && onClose()}
            className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all active:scale-90"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit(submitHandler)} className="space-y-6">
            <div className="flex justify-center">
              <label className="relative cursor-pointer group">
                <div className={`w-32 h-32 rounded-[28px] border-4 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden bg-white shadow-inner ${errors.logo ? 'border-red-300 bg-red-50' : 'border-slate-100 group-hover:border-[#7a6af6] group-hover:bg-slate-50'}`}>
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
            {errors.logo && <p className="text-[9px] font-black text-red-500 uppercase text-center mt-2 flex items-center justify-center gap-1"><Info size={10}/> Brand logo is required</p>}

            <input type="hidden" {...register("logo", { required: true })} />

            <div className="space-y-2">
              <div className="flex justify-between items-end mb-1">
                <label className="text-[10px] font-black uppercase text-[#0F172A] tracking-widest ml-1">
                  Authorized Brand Name *
                </label>
                {errors.name && (
                  <p className="text-[9px] font-black text-red-500 uppercase animate-pulse pr-1">
                    ! {errors.name.message}
                  </p>
                )}
              </div>
              <input
                {...register("name", {
                  required: "Brand name is mandatory",
                  minLength: { value: 2, message: "Min 2 characters" },
                  maxLength: { value: 25, message: "Max 25 characters" },
                  validate: {
                    notEmpty: (val) => val.trim().length > 0 || "Cannot consist only of spaces",
                    noLeadingSpace: (val) => !/^\s/.test(val) || "Cannot start with spaces",
                    validChars: (val) => /^[A-Za-z0-9\s&-]+$/.test(val) || "Invalid characters used",
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

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[#0F172A] tracking-widest ml-1">
                Campaign Strategy
              </label>
              <div className="relative">
                <select
                  {...register("offerId")}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-xs font-bold text-[#0F172A] outline-none appearance-none cursor-pointer focus:border-[#7a6af6] focus:bg-white transition-all"
                >
                  <option value="">No Active Campaign</option>
                  {brandOffers.map(offer => (
                    <option key={offer._id} value={offer._id}>
                      {offer.title} ({offer.discountValue}% OFF)
                    </option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <Percent size={14} />
                </div>
              </div>
              <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest mt-1 ml-1">
                Applies to all products linked to this partner
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || uploading}
                className="w-full bg-[#0F172A] text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-black hover:shadow-slate-300 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
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