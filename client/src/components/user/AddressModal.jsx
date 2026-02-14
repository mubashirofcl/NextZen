import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
    X,
    Loader2,
    CheckCircle2,
    ShieldAlert,
    Home,
    Briefcase,
    MapPin,
    Edit3,
} from "lucide-react";
import { nxToast } from "../../utils/userToast";

const AddressModal = ({
    isOpen,
    onClose,
    onSubmit,
    mode = "add",
    initialData = null,
}) => {
    const [addressType, setAddressType] = useState("Home");
    const [backendError, setBackendError] = useState("");

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({ mode: "onBlur" });

    useEffect(() => {
        if (!isOpen) return;

        if (mode === "edit" && initialData) {
            reset({
                fullName: initialData.fullName || initialData.name,
                phone: initialData.phone,
                addressLine: initialData.addressLine,
                city: initialData.city,
                state: initialData.state,
                pincode: initialData.pincode,
                landmark: initialData.landmark || "",
            });
            setAddressType(initialData.addressType || "Home");
        } else {
            reset({
                fullName: "",
                phone: "",
                addressLine: "",
                city: "",
                state: "",
                pincode: "",
                landmark: "",
            });
            setAddressType("Home");
        }
        setBackendError("");
    }, [isOpen, mode, initialData, reset]);

    if (!isOpen) return null;

    const submitHandler = async (data) => {
        setBackendError("");
        try {
            const payload = mode === "edit" ? { ...data, addressType, id: initialData?._id } : { ...data, addressType };

            await onSubmit(payload);

            nxToast.success(
                mode === "add" ? "New Address details Added successfully" : "Coordinate Updated",
                mode === "add" ? "New delivery destination saved." : "Address details refined successfully."
            );
            onClose();
        } catch (err) {
            const msg = err.response?.data?.message || "System error. Try again.";
            setBackendError(msg);
            nxToast.security("Shield Alert", msg);
        }
    };

    // Shared Styles
    const labelStyle = "text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block";
    const inputStyle = (err) => `
        w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold border-2 outline-none transition-all
        ${err ? "border-red-500" : "border-transparent focus:border-[#7a6af6]/20 focus:bg-white"}
    `;
    const errorText = "text-[9px] text-red-500 font-bold mt-1 uppercase ml-1 tracking-tighter";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-[#0F172A]/60 backdrop-blur-sm transition-all">
            <div className="bg-white w-[95%] sm:w-full max-w-[420px] rounded-2xl shadow-2xl p-5 md:p-8 relative animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">

                {/* Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-black transition-colors z-10">
                    <X size={20} />
                </button>

                {/* Header Section */}
                <div className="mb-4 md:mb-6 text-center md:text-left shrink-0">
                    <h3 className="text-xl font-black text-[#0F172A] uppercase tracking-tight">
                        {mode === "add" ? "Deployment Point" : "Refine Point"}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                        {mode === "add" ? "Define a new NEXTZEN destination" : "Modify your delivery coordinates"}
                    </p>
                </div>

                {/* Icon Badge - Hidden on very small screens to save space if needed, or kept compact */}
                <div className="flex justify-center mb-6 shrink-0">
                    <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shadow-xl text-white ${mode === 'add' ? 'bg-[#0F172A] shadow-[#0F172A]/10' : 'bg-[#7a6af6] shadow-[#7a6af6]/20'}`}>
                        {mode === "add" ? <MapPin size={24} md:size={28} strokeWidth={2.5} /> : <Edit3 size={24} md:size={28} strokeWidth={2.5} />}
                    </div>
                </div>

                {/* Backend Error Alert */}
                {backendError && (
                    <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 flex items-center gap-3 shrink-0">
                        <ShieldAlert size={16} className="text-red-500 shrink-0" />
                        <p className="text-[9px] font-black text-red-700 uppercase leading-tight">{backendError}</p>
                    </div>
                )}

                {/* Scrollable Form Area */}
                <form onSubmit={handleSubmit(submitHandler)} className="text-black space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1 pb-2">

                    {/* Full Name */}
                    <div>
                        <label className={labelStyle}>Recipient Name</label>
                        <input
                            {...register("fullName", {
                                required: "Required",
                                minLength: { value: 2, message: "Min 2 characters" },
                                pattern: { value: /^[A-Za-z\s]+$/, message: "Letters only" }
                            })}
                            className={inputStyle(errors.fullName)}
                            placeholder="Full Name"
                        />
                        {errors.fullName && <p className={errorText}>{errors.fullName.message}</p>}
                    </div>

                    {/* Phone */}
                    <div>
                        <label className={labelStyle}>Security Phone</label>
                        <input
                            {...register("phone", {
                                required: "Required",
                                pattern: { value: /^[6-9]\d{9}$/, message: "Invalid 10-digit number" }
                            })}
                            className={inputStyle(errors.phone)}
                            placeholder="91XXXXXXXX"
                            type="tel"
                        />
                        {errors.phone && <p className={errorText}>{errors.phone.message}</p>}
                    </div>

                    {/* City & State Grid - Stacks on extra small screens */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className={labelStyle}>City</label>
                            <input
                                {...register("city", { required: "Required" })}
                                className={inputStyle(errors.city)}
                                placeholder="City"
                            />
                            {errors.city && <p className={errorText}>{errors.city.message}</p>}
                        </div>
                        <div>
                            <label className={labelStyle}>State</label>
                            <input
                                {...register("state", { required: "Required" })}
                                className={inputStyle(errors.state)}
                                placeholder="State"
                            />
                            {errors.state && <p className={errorText}>{errors.state.message}</p>}
                        </div>
                    </div>

                    {/* Pincode & Landmark Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className={labelStyle}>Pincode</label>
                            <input
                                {...register("pincode", {
                                    required: "Required",
                                    pattern: { value: /^\d{6}$/, message: "6 digits only" }
                                })}
                                className={inputStyle(errors.pincode)}
                                placeholder="000000"
                                type="tel" // Opens numeric keypad on mobile
                            />
                            {errors.pincode && <p className={errorText}>{errors.pincode.message}</p>}
                        </div>
                        <div>
                            <label className={labelStyle}>Landmark</label>
                            <input
                                {...register("landmark")}
                                className={inputStyle(errors.landmark)}
                                placeholder="Optional"
                            />
                        </div>
                    </div>

                    {/* Detailed Address */}
                    <div>
                        <label className={labelStyle}>Detailed Address</label>
                        <textarea
                            {...register("addressLine", {
                                required: "Required",
                                minLength: { value: 10, message: "Min 10 characters" }
                            })}
                            className={`${inputStyle(errors.addressLine)} h-20 py-3 resize-none`}
                            placeholder="Building/Street/Locality"
                        />
                        {errors.addressLine && <p className={errorText}>{errors.addressLine.message}</p>}
                    </div>

                    {/* Address Type Toggle */}
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

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-[#0F172A] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all active:scale-95 disabled:bg-slate-200 mt-4 shrink-0"
                    >
                        {isSubmitting ? (
                            <Loader2 className="animate-spin mx-auto" size={16} />
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                <CheckCircle2 size={16} /> {mode === "add" ? "Save Coordinate" : "Commit Updates"}
                            </span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddressModal;