import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Star, Twitter, Instagram, Facebook, Tag, ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { requestSignupOTP } from "../../api/user/user.api";
import { nxToast } from "../../utils/userToast";
import TOAST_MESSAGES from "../../utils/toastMessages";

const UserSignup = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [showPass, setShowPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const [serverError, setServerError] = useState("");

    const urlReferralCode = searchParams.get("ref") || "";

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting }
    } = useForm({
        mode: "onBlur",
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
            referralCode: urlReferralCode
        }
    });

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const ref = params.get("ref");
        if (ref) {
            localStorage.setItem("pending_referral", ref);
        }
    }, []);

    const handleGoogleSignIn = () => {
        const params = new URLSearchParams(window.location.search);
        let ref = params.get("ref") || localStorage.getItem("pending_referral");

        const backendBaseUrl = `${import.meta.env.VITE_API_URL}/auth/google`;
        const finalUrl = ref ? `${backendBaseUrl}?ref=${ref}` : backendBaseUrl;

        window.location.href = finalUrl;
    };

    const onSubmit = async (data) => {
        setServerError("");
        try {
            await requestSignupOTP({
                email: data.email,
                purpose: "SIGNUP"
            });

            nxToast.success(TOAST_MESSAGES.VERIFICATION.OTP_SENT.title, TOAST_MESSAGES.VERIFICATION.OTP_SENT.message);

            navigate("/verify-otp", {
                state: {
                    flow: "signup",
                    name: data.name,
                    email: data.email,
                    password: data.password,
                    referralCode: data.referralCode || localStorage.getItem("pending_referral")
                },
                replace: true
            });
        } catch (err) {
            const errorMsg = err.response?.data?.message || TOAST_MESSAGES.AUTH.SIGNUP_INTERRUPTED.message;
            setServerError(errorMsg);
            nxToast.security(TOAST_MESSAGES.AUTH.SIGNUP_INTERRUPTED.title, errorMsg);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-black/20 font-sans">
            <main className="flex-grow flex items-center justify-center py-8 px-4 text-black">
                <div className="max-w-[900px] w-full flex bg-white/60 shadow-2xl rounded-2xl overflow-hidden min-h-[580px]">

                    <div className="hidden lg:block lg:w-[42%] relative">
                        <img
                            src="https://images.unsplash.com/photo-1675079506207-668db5bb2e80?q=80&w=2070&auto=format&fit=crop"
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
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight mb-1">Create Account</h2>
                                <p className="text-black text-xs font-medium">Join the NEXTZEN community today.</p>
                            </div>

                            {serverError && (
                                <div className="mb-4 p-2.5 bg-red-50 border-l-2 border-red-500 text-red-700 text-[11px] rounded-r-md italic">
                                    {serverError}
                                </div>
                            )}

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Full Name</label>
                                    <input
                                        type="text"
                                        placeholder="Enter your name"
                                        {...register("name", {
                                            required: "Name is required",
                                            minLength: { value: 3, message: "Name is too short" },
                                            maxLength: { value: 30, message: "Name is too long" },
                                            pattern: { value: /^[a-zA-Z\s]*$/, message: "Only letters allowed" }
                                        })}
                                        className={`w-full px-3.5 py-2.5 bg-gray-50 rounded-xl text-xs outline-none transition-all border ${errors.name ? 'border-red-300' : 'border-transparent focus:ring-1 focus:ring-gray-300'}`}
                                    />
                                    {errors.name && <p className="text-[9px] text-red-500 font-medium mt-0.5 uppercase tracking-tighter">! {errors.name.message}</p>}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Email Address</label>
                                    <input
                                        type="email"
                                        placeholder="john@example.com"
                                        {...register("email", {
                                            required: "Email is required",
                                            pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Invalid email format" },
                                            maxLength: { value: 50, message: "Email is too long" }
                                        })}
                                        className={`w-full px-3.5 py-2.5 bg-gray-50 rounded-xl text-xs outline-none transition-all border ${errors.email ? 'border-red-300' : 'border-transparent focus:ring-1 focus:ring-gray-300'}`}
                                    />
                                    {errors.email && <p className="text-[9px] text-red-500 font-medium mt-0.5 uppercase tracking-tighter">! {errors.email.message}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1 relative">
                                        <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPass ? "text" : "password"}
                                                placeholder="••••••••"
                                                {...register("password", {
                                                    required: "Required",
                                                    minLength: { value: 6, message: "Min 6 chars" },
                                                    maxLength: { value: 20, message: "Max 20 chars" }
                                                })}
                                                className={`w-full px-3.5 py-2.5 bg-gray-50 rounded-xl text-xs outline-none transition-all border ${errors.password ? 'border-red-300' : 'border-transparent focus:ring-1 focus:ring-gray-300'}`}
                                            />
                                            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                        {errors.password && <p className="text-[9px] text-red-500 font-medium mt-0.5 uppercase tracking-tighter">! {errors.password.message}</p>}
                                    </div>

                                    <div className="space-y-1 relative">
                                        <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Confirm</label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPass ? "text" : "password"}
                                                placeholder="••••••••"
                                                {...register("confirmPassword", {
                                                    required: "Required",
                                                    validate: v => v === watch("password") || "Mismatch"
                                                })}
                                                className={`w-full px-3.5 py-2.5 bg-gray-50 rounded-xl text-xs outline-none transition-all border ${errors.confirmPassword ? 'border-red-300' : 'border-transparent focus:ring-1 focus:ring-gray-300'}`}
                                            />
                                            <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                {showConfirmPass ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                        {errors.confirmPassword && <p className="text-[9px] text-red-500 font-medium mt-0.5 uppercase tracking-tighter">! {errors.confirmPassword.message}</p>}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Referral Code (Optional)</label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                            <Tag size={12} />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="GIFT-100"
                                            {...register("referralCode", {
                                                maxLength: { value: 15, message: "Code too long" }
                                            })}
                                            className={`w-full pl-9 pr-3.5 py-2.5 border-none rounded-xl text-xs outline-none focus:ring-1 transition-all ${urlReferralCode ? 'bg-indigo-50/50 ring-1 ring-indigo-200' : 'bg-gray-50 focus:ring-gray-300'}`}
                                        />
                                        {urlReferralCode && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-indigo-500 uppercase tracking-tighter animate-pulse">
                                                Link Applied
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[8px] text-gray-400 font-medium uppercase italic">Earn rewards on your first deployment.</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-[#0F172A] text-white py-3.5 rounded-xl text-[10px] uppercase tracking-[0.2em] font-bold shadow-lg hover:bg-black transition-all active:scale-[0.98] disabled:bg-gray-400 mt-2 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? "Processing..." : <>Sign Up <ArrowRight size={14} /></>}
                                </button>
                            </form>

                            <div className="relative my-5">
                                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-100"></span></div>
                                <div className="relative flex justify-center text-[9px] uppercase tracking-widest font-bold">
                                    <span className="bg-white px-3 text-gray-500">Or continue with</span>
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

                            <p className="mt-6 text-center text-[10px] text-gray-500 uppercase tracking-wide">
                                Have an account? <button onClick={() => navigate("/login")} className="text-[#0F172A] font-bold hover:underline ml-1">Sign In</button>
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserSignup;