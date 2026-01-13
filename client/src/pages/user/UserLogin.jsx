import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Star, Twitter, Instagram, Facebook, ArrowRight } from "lucide-react";
import { useDispatch } from "react-redux";

import { userLogin } from "../../api/user/user.api";
import { fetchUser } from "../../store/user/authSlice";
import BlockedModal from "../../components/admin/BlockedModal";
import { nxToast } from "../../utils/userToast";

const UserLogin = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    const [showPass, setShowPass] = useState(false);
    const [apiError, setApiError] = useState("");
    const [showBlockedModal, setShowBlockedModal] = useState(false);
    const [blockedReason, setBlockedReason] = useState("");

    const from = location.state?.from?.pathname || "/";

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        defaultValues: { email: "", password: "" },
    });

    const handleGoogleSignIn = () => {
        window.location.href = "http://localhost:5000/api/auth/google";
    };

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get("blocked") === "true") {
            setBlockedReason(params.get("reason") || "Your account has been restricted.");
            setShowBlockedModal(true);
        }
    }, [location.search]);


    const onSubmit = async (data) => {
        setApiError("");
        try {
            await userLogin({ email: data.email, password: data.password });
            await dispatch(fetchUser()).unwrap();

            if (!showBlockedModal) {
                navigate(from, { replace: true });
                nxToast.success(
                    "Welcome Back!",
                    "Successfully signed in. Happy shopping at NEXTZEN!"
                );
            }
        } catch (loginErr) {
            const res = loginErr.response;
            if (res?.status === 403 && res.data?.blocked) {
                setBlockedReason(res.data.reason || "Your account has been restricted.");
                setShowBlockedModal(true);
                return;
            }
            setApiError(res?.data?.message || "Invalid email or password");
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-black/20 font-sans">
            <main className="flex-grow flex items-center justify-center py-8 px-4 ">

                <div className="max-w-[900px] w-full flex bg-white/60 shadow-2xl rounded-2xl overflow-hidden min-h-[580px]">

                    <div className="hidden lg:block lg:w-[42%] relative">
                        <img
                            src="https://images.unsplash.com/photo-1675079505988-96936a80efb3?q=80&w=2070&auto=format&fit=crop"
                            alt="NextZen Lifestyle"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20 p-8 flex flex-col justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-[#0F172A] rounded-lg flex items-center justify-center font-bold text-lg shadow-lg">N</div>
                                <div>
                                    <h1 className="font-bold text-md leading-none tracking-tight text-white uppercase">NEXTZEN</h1>
                                    <p className="text-[9px] opacity-80 uppercase tracking-widest mt-1">Premium Apparel</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-xs font-medium tracking-wide uppercase">Quality Redefined.</p>
                                <div className="flex gap-2.5">
                                    {[Star, Twitter, Instagram, Facebook].map((Icon, i) => (
                                        <div key={i} className="w-8 h-8 border border-white/30 rounded-full flex items-center justify-center backdrop-blur-md cursor-pointer hover:bg-white/20 transition-all">
                                            <Icon size={12} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full lg:w-[58%] p-8 lg:px-10 flex flex-col justify-center bg-white/40">
                        <div className="max-w-xs mx-auto w-full">

                            <div className="text-center mb-10">
                                <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight mb-1">Welcome Back</h2>
                                <p className="text-gray text-xs font-medium">Please sign in to your account.</p>
                            </div>

                            {apiError && (
                                <div className="mb-6 p-2.5 bg-red-50 border-l-2 border-red-500 text-red-700 text-[11px] rounded-r-md italic">
                                    {apiError}
                                </div>
                            )}

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold uppercase tracking-widest text-gray">Email Address</label>
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        {...register("email", { required: "Email required", pattern: /^\S+@\S+$/i })}
                                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-xs outline-none focus:ring-1 focus:ring-gray-300 transition-all"
                                    />
                                    {errors.email && <p className="text-[9px] text-red-500 font-medium uppercase mt-1">{errors.email.message}</p>}
                                </div>

                                <div className="space-y-1.5 relative">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[9px] font-bold uppercase tracking-widest text-gray">Password</label>

                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showPass ? "text" : "password"}
                                            placeholder="••••••••"
                                            {...register("password", { required: "Password is required", minLength: { value: 6, message: "Min 6 chars" } })}
                                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-xs outline-none focus:ring-1 focus:ring-gray-300 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPass(!showPass)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="text-[9px] text-red-500 font-medium uppercase mt-1">{errors.password.message}</p>}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => navigate("/forgot-password")}
                                    className="text-[9px] font-bold text-black-300 hover:text-[#7a6af6] float-right mb-8 uppercase tracking-widest transition-colors"
                                >
                                    Forgot Password?
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-[#0F172A] text-white py-4 rounded-xl text-[10px] uppercase tracking-[0.2em] font-bold shadow-lg hover:bg-black transition-all active:scale-[0.98] disabled:bg-gray-400 mt-4 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? "Processing..." : <>Sign In <ArrowRight size={14} /></>}
                                </button>
                            </form>

                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-100"></span></div>
                                <div className="relative flex justify-center text-[9px] uppercase tracking-widest font-bold">
                                    <span className="bg-white px-3 text-gray">Or continue with</span>
                                </div>
                            </div>

                            <button
                                onClick={handleGoogleSignIn}
                                type="button"
                                className="w-full flex items-center justify-center gap-2.5 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl text-[10px] uppercase tracking-[0.1em] font-bold hover:bg-gray-50 transition-all shadow-sm"
                            >
                                <svg width="14" height="14" viewBox="0 0 18 18">
                                    <path d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.91c1.7-1.56 2.69-3.87 2.69-6.62z" fill="#4285F4" />
                                    <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.8.54-1.83.86-3.05.86-2.34 0-4.33-1.58-5.03-3.7H.95v2.3A8.99 8.99 0 0 0 9 18z" fill="#34A853" />
                                    <path d="M3.97 10.71a5.41 5.41 0 0 1 0-3.42V4.99H.95a8.99 8.99 0 0 0 0 8.01l3.02-2.29z" fill="#FBBC05" />
                                    <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15 2.45A8.96 8.96 0 0 0 9 0 8.99 8.99 0 0 0 .95 4.99l3.02 2.3c.7-2.12 2.69-3.7 5.03-3.7z" fill="#EA4335" />
                                </svg>
                                Google
                            </button>

                            <p className="mt-8 text-center text-[10px] text-gray-500 uppercase tracking-wide">
                                New user? <button onClick={() => navigate("/signup")} className="text-[#0F172A] font-bold hover:underline ml-1">Join NextZen</button>
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <BlockedModal
                open={showBlockedModal}
                reason={blockedReason}
                onClose={() => setShowBlockedModal(false)}
            />
        </div>
    );
};

export default UserLogin;