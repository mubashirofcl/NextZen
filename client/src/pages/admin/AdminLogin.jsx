import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";
import { Star, Twitter, Instagram, Facebook, Shield, Eye, EyeOff } from "lucide-react";
import { useDispatch } from "react-redux";
import { adminLogin } from "../../api/admin/admin.api";
import { fetchAdmin } from "../../store/admin/authSlice";
import { adminToast } from "../../utils/adminToast";

const AdminLogin = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    const [apiError, setApiError] = useState("");
    const [showPass, setShowPass] = useState(false);

    const from =
        location.state?.from?.pathname &&
            location.state.from.pathname !== "/admin/login"
            ? location.state.from.pathname
            : "/admin/dashboard";


    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        mode: "onBlur",
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (data) => {
        setApiError("");
        try {
            await adminLogin(data);
            await dispatch(fetchAdmin()).unwrap();
            adminToast.success("Access Granted. Welcome back to the command center.");
            navigate(from, { replace: true });
        } catch (err) {
            const errorMessage = err.response?.data?.message || "Verification failed. Please check your access keys.";
            setApiError(errorMessage);
            adminToast.error(errorMessage);
        }
    };


    return (
        <div className="flex flex-col min-h-screen bg-white font-sans">
            <main className="flex-grow flex items-center justify-center py-12 px-4 bg-gray-50/50">
                <div className="max-w-[1000px] w-full flex bg-white border border-gray-100 shadow-2xl rounded-2xl overflow-hidden min-h-[600px]">
                    <div className="hidden lg:block lg:w-[45%] relative">
                        <img
                            src="https://images.unsplash.com/photo-1550246140-5119ae4790b8?q=80&w=2070&auto=format&fit=crop"
                            alt="NextZen Admin Hero"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 p-10 flex flex-col justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#0F172A] rounded-lg flex items-center justify-center font-bold text-xl shadow-lg border border-white/20">N</div>
                                <div>
                                    <h1 className="font-bold text-lg leading-none tracking-tight">NEXTZEN</h1>
                                    <p className="text-[10px] opacity-80 uppercase tracking-widest mt-1">Admin Portal</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <p className="text-sm font-medium uppercase tracking-[0.2em]">System Control.</p>
                                <div className="flex gap-3">
                                    {[Star, Twitter, Instagram, Facebook, Shield].map((Icon, i) => (
                                        <div key={i} className="w-9 h-9 border border-white/30 rounded-full flex items-center justify-center backdrop-blur-md cursor-pointer hover:bg-white/20 transition-all">
                                            <Icon size={14} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="w-full lg:w-[55%] p-8 lg:p-12 flex flex-col justify-center">
                        <div className="max-w-sm mx-auto w-full">
                            <div className="text-center mb-10">
                                <h2 className="text-3xl font-bold text-[#0F172A] tracking-tight mb-2">
                                    Admin Access
                                </h2>
                                <p className="text-gray-400 text-sm">Authentication required for dashboard access.</p>
                            </div>
                            {apiError && (
                                <div className="mb-6 p-3 bg-red-50 border-l-2 border-red-500 text-red-700 text-xs rounded-r-md italic animate-pulse">
                                    {apiError}
                                </div>
                            )}
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Corporate Email</label>
                                    <input
                                        type="email"
                                        placeholder="admin@nextzen.com"
                                        autoComplete="email"
                                        {...register("email", {
                                            required: "Email address is required",
                                            maxLength: { value: 64, message: "Email is too long (max 64 characters)" },
                                            pattern: {
                                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                message: "Please enter a valid corporate email format"
                                            }
                                        })}
                                        className={`w-full px-4 py-3.5 bg-gray-50 border rounded-xl text-sm outline-none transition-all focus:ring-1 ${errors.email ? 'border-red-300 ring-red-100' : 'border-transparent focus:ring-gray-300'}`}
                                    />
                                    {errors.email && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tighter italic">! {errors.email.message}</p>}
                                </div>
                                <div className="space-y-1 relative">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Security Key</label>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showPass ? "text" : "password"}
                                            placeholder="••••••••"
                                            autoComplete="current-password"
                                            {...register("password", {
                                                required: "Security key is required",
                                                minLength: { value: 6, message: "Key must be at least 6 characters" },
                                                maxLength: { value: 30, message: "Key must not exceed 30 characters" }
                                            })}
                                            className={`w-full px-4 py-3.5 bg-gray-50 border rounded-xl text-sm outline-none transition-all focus:ring-1 ${errors.password ? 'border-red-300 ring-red-100' : 'border-transparent focus:ring-gray-300'}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPass(!showPass)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tighter italic">! {errors.password.message}</p>}
                                </div>
                                <button
                                    disabled={isSubmitting}
                                    className="w-full bg-[#0F172A] text-white py-4 rounded-xl text-xs uppercase tracking-[0.2em] font-bold shadow-xl hover:bg-black transition-all transform active:scale-[0.98] disabled:bg-gray-400 mt-2"
                                >
                                    {isSubmitting ? "Verifying Credentials..." : "Authorize Login"}
                                </button>
                            </form>
                            <div className="mt-10 text-center">
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-relaxed">
                                    Authorized Personnel Only. <br />
                                    IP logged for security purposes.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminLogin;