import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  X,
  Loader2,
  CheckCircle2,
  ShieldAlert,
  Home,
  Briefcase,
  MapPin
} from "lucide-react";
import { nxToast } from "../../utils/toastProvider";

const AddAddressModal = ({ isOpen, onClose, onSave }) => {
  const [addressType, setAddressType] = useState("Home");
  const [backendError, setBackendError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ mode: "onBlur" });

  useEffect(() => {
    if (isOpen) {
      reset();
      setAddressType("Home");
      setBackendError("");
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data) => {
    setBackendError("");
    try {
      await onSave({ ...data, addressType });
      nxToast.success(
        "Address Added",
        "Your delivery address has been saved successfully."
      );

      onClose();
    } catch (err) {
      const message =
        err.response?.data?.message || "We couldn’t save the address. Try again.";

      setBackendError(message);

      nxToast.security(
        "Something Went Wrong",
        message
      );
    };
  }

  const labelStyle = "text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block";
  const inputStyle = (err) => `
    w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold border-2 outline-none transition-all
    ${err ? "border-red-500" : "border-transparent focus:border-[#7a6af6]/20 focus:bg-white"}
  `;
  const errorText = "text-[9px] text-red-500 font-bold mt-1 uppercase ml-1 tracking-tighter";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0F172A]/60 backdrop-blur-sm transition-all">
      <div className="bg-white w-full max-w-[400px] rounded-2xl shadow-2xl p-8 relative animate-in zoom-in duration-300">

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-black transition-colors"
        >
          <X size={20} />
        </button>

        <div className="mb-6">
          <h3 className="text-xl font-black text-[#0F172A] uppercase tracking-tight">Deployment Point</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
            Define a new NEXTZEN delivery destination
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-[#0F172A] rounded-2xl flex items-center justify-center shadow-xl shadow-[#0F172A]/10 text-white">
            <MapPin size={28} strokeWidth={2.5} />
          </div>
        </div>

        {backendError && (
          <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 flex items-center gap-3">
            <ShieldAlert size={16} className="text-red-500 shrink-0" />
            <p className="text-[9px] font-black text-red-700 uppercase leading-tight">
              {backendError}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">

          <div>
            <label className={labelStyle}>Full Name</label>
            <input
              {...register("fullName", {
                required: "Full name is required",
                minLength: { value: 2, message: "Minimum 2 characters" },
                pattern: { value: /^[A-Za-z\s]+$/, message: "Letters only please" }
              })}
              className={inputStyle(errors.fullName)}
              placeholder="Recipient Name"
            />
            {errors.fullName && <p className={errorText}>{errors.fullName.message}</p>}
          </div>

          <div>
            <label className={labelStyle}>Security Phone</label>
            <input
              {...register("phone", {
                required: "Phone is required",
                pattern: { value: /^[6-9]\d{9}$/, message: "Invalid 10-digit number" },
              })}
              className={inputStyle(errors.phone)}
              placeholder="91XXXXXXXX"
            />
            {errors.phone && <p className={errorText}>{errors.phone.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelStyle}>City</label>
              <input
                {...register("city", {
                  required: "City is required",
                  pattern: { value: /^[A-Za-z\s]+$/, message: "Letters only" }
                })}
                className={inputStyle(errors.city)}
                placeholder="City"
              />
              {errors.city && <p className={errorText}>{errors.city.message}</p>}
            </div>
            <div>
              <label className={labelStyle}>State</label>
              <input
                {...register("state", {
                  required: "State is required",
                  pattern: { value: /^[A-Za-z\s]+$/, message: "Letters only" }
                })}
                className={inputStyle(errors.state)}
                placeholder="State"
              />
              {errors.state && <p className={errorText}>{errors.state.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelStyle}>Pincode</label>
              <input
                {...register("pincode", {
                  required: "Required",
                  pattern: { value: /^\d{6}$/, message: "Must be 6 digits" }
                })}
                className={inputStyle(errors.pincode)}
                placeholder="000000"
              />
              {errors.pincode && <p className={errorText}>{errors.pincode.message}</p>}
            </div>
            <div>
              <label className={labelStyle}>Landmark</label>
              <input
                {...register("landmark", {
                  minLength: { value: 3, message: "Min 3 characters" }
                })}
                className={inputStyle(errors.landmark)}
                placeholder="Optional"
              />
              {errors.landmark && <p className={errorText}>{errors.landmark.message}</p>}
            </div>
          </div>

          <div>
            <label className={labelStyle}>Detailed Address</label>
            <textarea
              {...register("addressLine", {
                required: "Required",
                minLength: { value: 10, message: "Min 10 characters required" }
              })}
              className={`${inputStyle(errors.addressLine)} h-20 py-3 resize-none`}
              placeholder="Building/Street Details"
            />
            {errors.addressLine && <p className={errorText}>{errors.addressLine.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            {["Home", "Office"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setAddressType(type)}
                className={`h-12 rounded-xl flex items-center justify-center gap-2 font-black text-[9px] uppercase tracking-widest transition-all border-2 ${addressType === type
                  ? "bg-[#7a6af6]/5 border-[#7a6af6] text-[#7a6af6]"
                  : "bg-white border-slate-100 text-slate-400"
                  }`}
              >
                {type === "Home" ? <Home size={14} /> : <Briefcase size={14} />}
                {type}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-[#0F172A] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all active:scale-95 disabled:bg-slate-200 mt-4"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin mx-auto" size={16} />
            ) : (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle2 size={16} /> Save Coordinate
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddAddressModal;