import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { X, Camera, AlertCircle, Loader2 } from 'lucide-react';
import { nxToast } from '../../utils/toastProvider';

const EditProfileModal = ({ isOpen, user, onClose, onUpdate }) => {
    const fileInputRef = useRef(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [backendError, setBackendError] = useState("");

    const isGoogleAccount = useMemo(() => {
        if (!user) return false;
        return !!(
            user.googleId ||
            user.authSource === 'google' ||
            user.isGoogleUser === true ||
            user.image?.includes('googleusercontent.com')
        );
    }, [user]);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm({
        mode: "onBlur"
    });

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
    }, [user, isOpen, reset]);

    if (!isOpen) return null;

    if (!user || !user.email) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F172A]/60 backdrop-blur-sm">
                <Loader2 className="animate-spin text-white" size={32} />
            </div>
        );
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setBackendError("Invalid file type. Please select a JPG, PNG, or WebP image.");
            e.target.value = null;
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setBackendError("Image is too large. Maximum size allowed is 5MB.");
            e.target.value = null;
            return;
        }

        setBackendError("");
        const reader = new FileReader();
        reader.onload = () => setPreviewImage(reader.result);
        reader.readAsDataURL(file);
    };

    const onSubmit = async (data) => {
        setBackendError("");
        try {
            const payload = {
                name: data.name.trim(),
                phone: data.phone.trim(),
                email: isGoogleAccount ? user.email : data.email.trim(),

            };

            if (previewImage && previewImage.startsWith('data:image')) {
                payload.profilePicture = previewImage;
            }

            await onUpdate(payload);
        } catch (err) {
            const msg = err.response?.data?.message || "Update failed. Please try again.";
            nxToast.security("Update failed. Please try again.");
            setBackendError(msg);


        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0F172A]/60 backdrop-blur-sm transition-all">
            <div className="bg-white w-full max-w-[400px] rounded-2xl shadow-2xl p-8 relative animate-in zoom-in duration-300">

                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-black transition-colors">
                    <X size={20} />
                </button>

                <div className="mb-6">
                    <h3 className="text-xl font-black text-[#0F172A] uppercase tracking-tight">Edit Profile</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                        {isGoogleAccount ? 'Identity Managed by Google' : 'NEXTZEN Security Management'}
                    </p>
                </div>

                {backendError && (
                    <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 flex items-center gap-3">
                        <AlertCircle size={16} className="text-red-500 shrink-0" />
                        <p className="text-[9px] font-black text-red-700 uppercase leading-tight">{backendError}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Portrait Section */}
                    <div className="flex justify-center mb-4">
                        <div className="relative cursor-pointer group" onClick={() => fileInputRef.current.click()}>
                            <div className="w-24 h-24 rounded-full border-4 border-slate-50 overflow-hidden shadow-lg bg-slate-100">
                                <img
                                    src={previewImage || "https://avatar.iran.liara.run/public/boy"}
                                    className="w-full h-full object-cover group-hover:opacity-75 transition-all"
                                    alt="Preview"
                                />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera size={20} className="text-white drop-shadow-md" />
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Legal Name</label>
                            <input
                                {...register("name", {
                                    required: "Full name is required",
                                    minLength: { value: 2, message: "Name too short" },
                                    pattern: { value: /^[A-Za-z\s]+$/, message: "Only letters allowed" }
                                })}
                                className={`w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold border-2 outline-none transition-all ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-transparent focus:border-[#7a6af6]/20'}`}
                            />
                            {errors.name && <p className="text-[9px] text-red-500 font-bold mt-1 uppercase ml-1 tracking-tighter">{errors.name.message}</p>}
                        </div>

                        {isGoogleAccount ? (
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Verified Email</label>
                                <div className="w-full px-4 py-3 bg-slate-100 rounded-xl text-sm font-bold text-slate-400 border-2 border-transparent cursor-not-allowed italic">
                                    {user?.email}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Identification</label>
                                <input
                                    {...register("email", {
                                        required: "Email is required",
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: "Invalid email format"
                                        }
                                    })}
                                    className={`w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold border-2 outline-none transition-all ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-transparent focus:border-[#7a6af6]/20'}`}
                                />
                                {errors.email && <p className="text-[9px] text-red-500 font-bold mt-1 uppercase ml-1 tracking-tighter">{errors.email.message}</p>}
                            </div>
                        )}

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Security Phone</label>
                            <input
                                {...register("phone", {
                                    required: "Phone number is required",
                                    pattern: { value: /^[6-9]\d{9}$/, message: "Must be a valid 10-digit number" }
                                })}
                                className={`w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold border-2 outline-none transition-all ${errors.phone ? 'border-red-500 focus:border-red-500' : 'border-transparent focus:border-[#7a6af6]/20'}`}
                            />
                            {errors.phone && <p className="text-[9px] text-red-500 font-bold mt-1 uppercase ml-1 tracking-tighter">{errors.phone.message}</p>}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-[#0F172A] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all active:scale-95 disabled:bg-slate-200 mt-4 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Syncing Account...</> : "Commit Changes"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditProfileModal;