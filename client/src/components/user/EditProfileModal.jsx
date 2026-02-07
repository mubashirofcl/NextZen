import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Camera, AlertCircle, Loader2 } from 'lucide-react';
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
            setBackendError("Invalid file type. Use JPG, PNG or WebP.");
            e.target.value = null;
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setBackendError("Image must be under 5MB.");
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

            if (previewImage?.startsWith('data:image')) {
                payload.profilePicture = previewImage;
            }

            await onUpdate(payload);
        } catch (err) {
            nxToast.security("Profile update failed");
            setBackendError(err.response?.data?.message || "Update failed");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0F172A]/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-[400px] rounded-2xl shadow-2xl p-8 relative">

                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-black">
                    <X size={20} />
                </button>

                <div className="mb-6">
                    <h3 className="text-xl font-black uppercase">Edit Profile</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        {isGoogleAccount ? 'Google Managed Account' : 'NEXTZEN Account'}
                    </p>
                </div>

                {backendError && (
                    <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 flex items-center gap-3">
                        <AlertCircle size={16} className="text-red-500" />
                        <p className="text-[9px] font-black text-red-700 uppercase">{backendError}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Avatar */}
                    <div className="flex justify-center text-black">
                        <div
                            className="relative cursor-pointer group"
                            onClick={() => fileInputRef.current.click()}
                        >
                            <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100">
                                <img
                                    src={previewImage || "https://avatar.iran.liara.run/public/boy"}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <Camera className="absolute inset-0 m-auto text-white opacity-0 group-hover:opacity-100" />
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                        </div>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400">Name</label>
                        <input
                            {...register("name", {
                                required: "Name is required",
                                minLength: { value: 2, message: "Too short" }
                            })}
                            className="w-full px-4 py-3 text-black bg-slate-50 rounded-xl font-bold"
                        />
                        {errors.name && <p className="text-[9px] text-red-500">{errors.name.message}</p>}
                    </div>

                    {/* Email */}
                    {isGoogleAccount ? (
                        <div>
                            <label className="text-[10px] font-bold uppercase text-slate-400">Email</label>
                            <div className="px-4 py-3 bg-slate-100 rounded-xl text-slate-400 font-bold italic">
                                {user.email}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label className="text-[10px] font-bold uppercase text-slate-400">Email</label>
                            <input
                                {...register("email", { required: "Email required" })}
                                className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold"
                            />
                            {errors.email && <p className="text-[9px] text-red-500">{errors.email.message}</p>}
                        </div>
                    )}

                    {/* Phone */}
                    <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400">Phone</label>
                        <input
                            {...register("phone", {
                                required: "Phone required",
                                pattern: { value: /^[6-9]\d{9}$/, message: "Invalid phone" }
                            })}
                            className="w-full px-4 py-3 text-black bg-slate-50 rounded-xl font-bold"
                        />
                        {errors.phone && <p className="text-[9px] text-red-500">{errors.phone.message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-black text-white rounded-xl font-black uppercase"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : "Save Changes"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditProfileModal;
