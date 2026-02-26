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
                mode === "add" ? "Address Saved" : "Address Updated",
                mode === "add" ? "New delivery address added successfully." : "Your address details have been updated."
            );
            onClose();
        } catch (err) {
            const msg = err.response?.data?.message || "System error. Try again.";
            setBackendError(msg);
            nxToast.security("Security Alert", msg);
        }
    };

    const labelStyle = "text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block";
    const inputStyle = (err) => `
        w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold border-2 outline-none transition-all
        ${err ? "border-red-500 bg-red-50" : "border-transparent focus:border-[#7a6af6]/20 focus:bg-white"}
    `;
    const errorText = "text-[9px] text-red-500 font-bold mt-1 uppercase ml-1 tracking-tighter";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-[#0F172A]/60 backdrop-blur-sm transition-all">
            <div className="bg-white w-[95%] sm:w-full max-w-[420px] rounded-2xl shadow-2xl p-5 md:p-8 relative animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">

                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-black transition-colors z-10">
                    <X size={20} />
                </button>

                <div className="mb-4 md:mb-6 text-center md:text-left shrink-0">
                    <h3 className="text-xl font-black text-[#0F172A] uppercase tracking-tight">
                        {mode === "add" ? "Add New Address" : "Edit Address"}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                        {mode === "add" ? "Save a new delivery destination" : "Modify your existing shipping details"}
                    </p>
                </div>

                <div className="flex justify-center mb-6 shrink-0">
                    <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shadow-xl text-white ${mode === 'add' ? 'bg-[#0F172A] shadow-[#0F172A]/10' : 'bg-[#7a6af6] shadow-[#7a6af6]/20'}`}>
                        {mode === "add" ? <MapPin size={24} md:size={28} strokeWidth={2.5} /> : <Edit3 size={24} md:size={28} strokeWidth={2.5} />}
                    </div>
                </div>

                {backendError && (
                    <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 flex items-center gap-3 shrink-0">
                        <ShieldAlert size={16} className="text-red-500 shrink-0" />
                        <p className="text-[9px] font-black text-red-700 uppercase leading-tight">{backendError}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit(submitHandler)} className="text-black space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1 pb-2">

                    <div>
                        <label className={labelStyle}>Receiver's Name</label>
                        <input
                            {...register("fullName", {
                                required: "Please provide a receiver name",
                                minLength: { value: 3, message: "Name must be at least 3 characters" },
                                maxLength: { value: 40, message: "Name cannot exceed 40 characters" },
                                pattern: { value: /^[A-Za-z\s]+$/, message: "Please use letters only" }
                            })}
                            className={inputStyle(errors.fullName)}
                            placeholder="e.g. John Doe"
                        />
                        {errors.fullName && <p className={errorText}>{errors.fullName.message}</p>}
                    </div>

                    <div>
                        <label className={labelStyle}>Contact Number</label>
                        <input
                            {...register("phone", {
                                required: "A valid contact number is required",
                                pattern: { value: /^[6-9]\d{9}$/, message: "Please enter a valid 10-digit number" }
                            })}
                            className={inputStyle(errors.phone)}
                            placeholder="10-digit mobile number"
                            type="tel"
                        />
                        {errors.phone && <p className={errorText}>{errors.phone.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className={labelStyle}>City</label>
                            <input
                                {...register("city", {
                                    required: "City name is required",
                                    maxLength: { value: 30, message: "City name too long" },
                                    pattern: { value: /^[A-Za-z\s]+$/, message: "Invalid city name" }
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
                                    required: "State name is required",
                                    maxLength: { value: 30, message: "State name too long" },
                                    pattern: { value: /^[A-Za-z\s]+$/, message: "Invalid state name" }
                                })}
                                className={inputStyle(errors.state)}
                                placeholder="State"
                            />
                            {errors.state && <p className={errorText}>{errors.state.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className={labelStyle}>Pincode</label>
                            <input
                                {...register("pincode", {
                                    required: "Postal code is required",
                                    pattern: { value: /^\d{6}$/, message: "Must be a 6-digit code" }
                                })}
                                className={inputStyle(errors.pincode)}
                                placeholder="6-digit code"
                                type="tel"
                            />
                            {errors.pincode && <p className={errorText}>{errors.pincode.message}</p>}
                        </div>
                        <div>
                            <label className={labelStyle}>Landmark</label>
                            <input
                                {...register("landmark", {
                                    maxLength: { value: 50, message: "Max 50 characters allowed" }
                                })}
                                className={inputStyle(errors.landmark)}
                                placeholder="Famous nearby spot"
                            />
                            {errors.landmark && <p className={errorText}>{errors.landmark.message}</p>}
                        </div>
                    </div>

                    <div>
                        <label className={labelStyle}>Street Address</label>
                        <textarea
                            {...register("addressLine", {
                                required: "Full address details are required",
                                minLength: { value: 10, message: "Please provide more detail (min 10 chars)" },
                                maxLength: { value: 200, message: "Address is too long (max 200 chars)" }
                            })}
                            className={`${inputStyle(errors.addressLine)} h-20 py-3 resize-none`}
                            placeholder="Building, Street, and Locality details"
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
                                    : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
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
                        className="w-full py-4 bg-[#0F172A] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all active:scale-[0.98] disabled:bg-slate-200 mt-4 shrink-0 flex items-center justify-center"
                    >
                        {isSubmitting ? (
                            <Loader2 className="animate-spin" size={16} />
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                <CheckCircle2 size={16} /> {mode === "add" ? "Save Destination" : "Confirm Changes"}
                            </span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddressModal;