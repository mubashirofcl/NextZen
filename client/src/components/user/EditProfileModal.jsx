import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Camera, AlertCircle, Loader2, Info } from 'lucide-react';
import { nxToast } from '../../utils/userToast';

const EditProfileModal = ({ isOpen, user, onClose, onUpdate }) => {
    const fileInputRef = useRef(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [backendError, setBackendError] = useState("");

    const isGoogleAccount = !!user?.googleId;

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors, isSubmitting }
    } = useForm({ mode: "onBlur" });

    useEffect(() => {
        if (isOpen && user) {
            setBackendError("");
            reset({
                name: user.name || "",
                email: user.email || "",
                phone: user.phone || ""
            });
            setPreviewImage(user.profilePicture || user.image || null);
        }
    }, [isOpen, user, reset]);

    if (!isOpen) return null;

    if (!user || !user.email) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F172A]/60 backdrop-blur-sm ">
                <Loader2 className="animate-spin text-white" size={32} />
            </div>
        );
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setBackendError("Please use a standard image format (JPG, PNG, or WebP).");
            nxToast.error("Format Error", "The selected file type is not supported.");
            e.target.value = null;
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setBackendError("The image is too large. Please select a file smaller than 2MB.");
            nxToast.warn("File Size Alert", "Profile images should be under 2MB for best performance.");
            e.target.value = null;
            return;
        }

        setBackendError("");
        const reader = new FileReader();
        reader.onload = () => setPreviewImage(reader.result);
        reader.readAsDataURL(file);
        nxToast.success("Success", "Photo prepared for update.");
    };

    const onSubmit = async (data) => {
        setBackendError("");
        try {
            const payload = {
                name: data.name.trim(),
                phone: data.phone.trim(),
                email: isGoogleAccount ? user.email : data.email.trim(),
            };

            if (previewImage?.startsWith('data:image')) {
                payload.profilePicture = previewImage;
            }

            await onUpdate(payload);

            nxToast.success("Update Complete");
            onClose();
        } catch (err) {
            const serverMessage = err.response?.data?.message || err.message || "Internal system error.";

            console.log("Captured Message:", serverMessage); 

            setBackendError(serverMessage);

            const lowerMsg = serverMessage.toLowerCase();

            if (lowerMsg.includes("email")) {
                setError("email", {
                    type: "manual",
                    message: serverMessage
                }, { shouldFocus: true });
            }
            else if (lowerMsg.includes("phone")) {
                setError("phone", {
                    type: "manual",
                    message: serverMessage
                }, { shouldFocus: true });
            }
            nxToast.error("Update Blocked", serverMessage);
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0F172A]/60 backdrop-blur-sm text-black">
            <div className="bg-white w-full max-w-[400px] rounded-2xl shadow-2xl p-8 relative animate-in zoom-in duration-300">

                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-black transition-colors">
                    <X size={20} />
                </button>

                <div className="mb-6">
                    <h3 className="text-xl font-black uppercase tracking-tight">Edit Profile</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                        {isGoogleAccount ? 'Google Managed Account' : 'NEXTZEN Security Protocol'}
                    </p>
                </div>

                {backendError && (
                    <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 flex items-center gap-3">
                        <AlertCircle size={16} className="text-red-500 shrink-0" />
                        <p className="text-[9px] font-black text-red-700 uppercase leading-tight">{backendError}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="flex justify-center">
                        <div
                            className="relative cursor-pointer group"
                            onClick={() => fileInputRef.current.click()}
                        >
                            <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-50 shadow-inner group-hover:border-[#7a6af6] transition-all">
                                <img
                                    src={previewImage || "https://avatar.iran.liara.run/public/boy"}
                                    alt="Preview"
                                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                />
                            </div>
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera size={20} />
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                name="profileImage"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-1 block">Full Name</label>
                        <input
                            {...register("name", {
                                required: "Please enter your name",
                                minLength: { value: 3, message: "Name must be at least 3 characters" },
                                maxLength: { value: 30, message: "Name cannot exceed 30 characters" },
                                pattern: { value: /^[a-zA-Z\s]*$/, message: "Only letters and spaces are allowed" }
                            })}
                            placeholder="e.g. John Doe"
                            className={`w-full px-4 py-3 text-black bg-slate-50 border-2 rounded-xl text-sm font-bold outline-none transition-all ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-transparent focus:border-[#7a6af6]/20 focus:bg-white'}`}
                        />
                        {errors.name && <p className="text-[9px] text-red-500 font-bold uppercase mt-1 ml-1 flex items-center gap-1"><Info size={10} /> {errors.name.message}</p>}
                    </div>

                    {!isGoogleAccount ? (
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-1 block">Email Address</label>
                            <input
                                {...register("email", {
                                    required: "Email is required",
                                    pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Invalid email format" },
                                    maxLength: { value: 50, message: "Email too long" }
                                })}
                                placeholder="john@example.com"
                                className={`w-full px-4 py-3 text-black bg-slate-50 border-2 rounded-xl text-sm font-bold outline-none transition-all ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-transparent focus:border-[#7a6af6]/20 focus:bg-white'}`}
                            />
                            {errors.email && <p className="text-[9px] text-red-500 font-bold uppercase mt-1 ml-1 flex items-center gap-1"><Info size={10} /> {errors.email.message}</p>}
                        </div>
                    ) : (
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-1 block">Primary Email</label>
                            <div className="px-4 py-3 bg-slate-100 rounded-xl text-slate-400 text-sm font-bold italic border-2 border-transparent">
                                {user.email}
                            </div>
                            <p className="text-[7px] text-slate-400 uppercase font-black tracking-tighter mt-1.5 ml-1 italic">Managed via your Google identity settings</p>
                        </div>
                    )}

                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-1 block">Mobile Number</label>
                        <input
                            {...register("phone", {
                                required: "Phone number is required",
                                pattern: { value: /^[6-9]\d{9}$/, message: "Please enter a valid 10-digit number" }
                            })}
                            placeholder="10-digit number"
                            type="tel"
                            className={`w-full px-4 py-3 text-black bg-slate-50 border-2 rounded-xl text-sm font-bold outline-none transition-all ${errors.phone ? 'border-red-500 focus:border-red-500' : 'border-transparent focus:border-[#7a6af6]/20 focus:bg-white'}`}
                        />
                        {errors.phone && <p className="text-[9px] text-red-500 font-bold uppercase mt-1 ml-1 flex items-center gap-1"><Info size={10} /> {errors.phone.message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-[#0F172A] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Save Profile Details"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditProfileModal;