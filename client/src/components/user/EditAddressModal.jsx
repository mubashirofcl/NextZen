import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Edit3, Loader2, CheckCircle2, ShieldAlert, Home, Briefcase } from 'lucide-react';
import { nxToast } from '../../utils/userToast.jsx';

const EditAddressModal = ({ isOpen, onClose, onUpdate, initialData }) => {
    const [addressType, setAddressType] = useState('Home');
    const [backendError, setBackendError] = useState("");

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm({ mode: "onBlur" });

    useEffect(() => {
        if (isOpen && initialData) {
            reset({
                fullName: initialData.fullName || initialData.name, 
                phone: initialData.phone,
                addressLine: initialData.addressLine,
                city: initialData.city,
                state: initialData.state,
                pincode: initialData.pincode,
                landmark: initialData.landmark || ""
            });
            setAddressType(initialData.addressType || 'Home');
            setBackendError("");
        }
    }, [isOpen, initialData, reset]);

    if (!isOpen) return null;

    const onSubmit = async (data) => {
        setBackendError("");
        try {
            await onUpdate({ ...data, addressType, id: initialData._id });

            nxToast.success(
                "Address updated",
                "Your deployment address has been successfully updated."
            );

            onClose();
        } catch (err) {
            const errorMsg = err.response?.data?.message || "System was unable to process the update.";
            setBackendError(errorMsg);

            nxToast.security(
                "Something Went Wrong",
                errorMsg
            );
        }
    };

    const labelClasses = "text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block";
    const inputClasses = (error) => `w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold border-2 outline-none transition-all ${error ? 'border-red-500' : 'border-transparent focus:border-[#7a6af6]/20'}`;
    const errorText = "text-[9px] text-red-500 font-bold mt-1 uppercase ml-1 tracking-tighter";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0F172A]/60 backdrop-blur-sm transition-all">
            <div className="bg-white w-full max-w-[400px] rounded-2xl shadow-2xl p-8 relative animate-in zoom-in duration-300">

                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-black transition-colors">
                    <X size={20} />
                </button>

                <div className="mb-6">
                    <h3 className="text-xl font-black text-[#0F172A] uppercase tracking-tight">Refine Point</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                        Modify your NEXTZEN deployment data
                    </p>
                </div>

                <div className="flex justify-center mb-8">
                    <div className="w-16 h-16 bg-[#7a6af6] rounded-2xl flex items-center justify-center shadow-xl shadow-[#7a6af6]/20 text-white">
                        <Edit3 size={28} strokeWidth={2.5} />
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {backendError && (
                        <div className="p-3 bg-red-50 border-l-4 border-red-500 text-[9px] font-black text-red-700 uppercase flex items-center gap-3">
                            <ShieldAlert size={16} className="shrink-0" />
                            {backendError}
                        </div>
                    )}

                    <div>
                        <label className={labelClasses}>Recipient Name</label>
                        <input
                            {...register("fullName", { 
                                required: "Name is required",
                                minLength: { value: 2, message: "Minimum 2 characters" },
                                pattern: { value: /^[A-Za-z\s]+$/, message: "Letters only please" }
                            })}
                            className={inputClasses(errors.fullName)}
                            placeholder="Name"
                        />
                        {errors.fullName && <p className={errorText}>{errors.fullName.message}</p>}
                    </div>

                    <div>
                        <label className={labelClasses}>Security Phone</label>
                        <input
                            {...register("phone", { 
                                required: "Phone is required",
                                pattern: { value: /^[6-9]\d{9}$/, message: "Invalid 10-digit number" }
                            })}
                            className={inputClasses(errors.phone)}
                            placeholder="Phone"
                        />
                        {errors.phone && <p className={errorText}>{errors.phone.message}</p>}
                    </div>

                    <div>
                        <label className={labelClasses}>Detailed Address</label>
                        <textarea
                            {...register("addressLine", { 
                                required: "Address is required",
                                minLength: { value: 10, message: "Min 10 characters required" }
                            })}
                            className={`${inputClasses(errors.addressLine)} h-20 py-3 resize-none`}
                            placeholder="Address Line"
                        />
                        {errors.addressLine && <p className={errorText}>{errors.addressLine.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClasses}>City</label>
                            <input 
                                {...register("city", { 
                                    required: "City is required",
                                    pattern: { value: /^[A-Za-z\s]+$/, message: "Letters only" }
                                })} 
                                className={inputClasses(errors.city)} 
                                placeholder="City" 
                            />
                            {errors.city && <p className={errorText}>{errors.city.message}</p>}
                        </div>
                        <div>
                            <label className={labelClasses}>State</label>
                            <input 
                                {...register("state", { 
                                    required: "State is required",
                                    pattern: { value: /^[A-Za-z\s]+$/, message: "Letters only" }
                                })} 
                                className={inputClasses(errors.state)} 
                                placeholder="State" 
                            />
                            {errors.state && <p className={errorText}>{errors.state.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClasses}>Pincode</label>
                            <input 
                                type="number" 
                                {...register("pincode", { 
                                    required: "Required",
                                    pattern: { value: /^\d{6}$/, message: "Must be 6 digits" }
                                })} 
                                className={inputClasses(errors.pincode)} 
                                placeholder="Pincode" 
                            />
                            {errors.pincode && <p className={errorText}>{errors.pincode.message}</p>}
                        </div>
                        <div>
                            <label className={labelClasses}>Landmark</label>
                            <input 
                                {...register("landmark", {
                                    minLength: { value: 3, message: "Min 3 characters" }
                                })} 
                                className={inputClasses(errors.landmark)} 
                                placeholder="Optional" 
                            />
                            {errors.landmark && <p className={errorText}>{errors.landmark.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        {['Home', 'Office'].map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setAddressType(type)}
                                className={`h-12 rounded-xl flex items-center justify-center gap-2 font-black text-[9px] uppercase tracking-widest border-2 transition-all ${addressType === type
                                        ? 'border-[#7a6af6] text-[#7a6af6] bg-[#7a6af6]/5'
                                        : 'border-slate-100 text-slate-400'
                                    }`}
                            >
                                {type === 'Home' ? <Home size={14} /> : <Briefcase size={14} />} {type}
                            </button>
                        ))}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-[#0F172A] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-black active:scale-95 transition-all disabled:opacity-50 mt-4"
                    >
                        {isSubmitting ? (
                            <Loader2 className="animate-spin mx-auto" size={16} />
                        ) : (
                            <div className="flex items-center justify-center gap-2">
                                <CheckCircle2 size={16} /> Commit Updates
                            </div>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditAddressModal;