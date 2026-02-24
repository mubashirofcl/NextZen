import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Loader2 } from "lucide-react";
import { resetPassword } from "../../api/user/user.api";
import Header from "../../components/user/Header";
import Footer from "../../components/user/Footer";
import { nxToast } from "../../utils/userToast";

const ResetPassword = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [showPass, setShowPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting }
    } = useForm({
        defaultValues: { password: "", confirmPassword: "" }
    });

    useEffect(() => {
        if (!state?.email || !state?.otp) {
            navigate("/forgot-password");
        }
    }, [state, navigate]);

    const onSubmit = async (data) => {
        try {
            await resetPassword({
                email: state.email,
                otp: state.otp,
                password: data.password,
            });

            navigate("/login", {
                state: { message: "Security updated. Please sign in." },
            });

            nxToast.success(
                "Password Updated Successfully.",
                "Please Sing in Using New Password"
            );
        } catch (err) {
            nxToast.security(err.response?.data?.message || "Failed to update password.");
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-black/20 font-sans selection:bg-[#7a6af6]/20 mt-20">
            <Header />
            <main className="flex-grow flex items-center justify-center py-12 px-4">
                <div className="max-w-[380px] w-full bg-white border border-gray-100 shadow-[0_15px_40px_rgba(0,0,0,0.04)] rounded-[2rem] p-8 md:p-10 text-center transition-all">

                    <div className="w-14 h-14 bg-[#0F172A] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#0F172A]/10 text-white">
                        <Lock size={24} strokeWidth={2} />
                    </div>

                    <header className="mb-8">
                        <h2 className="text-2xl font-black text-[#0F172A] tracking-tight mb-2">New Password</h2>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Define your new access</p>
                    </header>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">New Password</label>
                            <div className="relative">
                                <input
                                    type={showPass ? "text" : "password"}
                                    placeholder="••••••••"
                                    {...register("password", { required: "Required", minLength: { value: 6, message: "Min 6 chars" } })}
                                    className="w-full h-14 px-5 text-black bg-gray-50 border-none rounded-xl text-xs font-semibold outline-none focus:bg-white focus:ring-4 focus:ring-[#7a6af6]/5 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#7a6af6]"
                                >
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Confirm Password</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPass ? "text" : "password"} 
                                    placeholder="••••••••"
                                    {...register("confirmPassword", {
                                        validate: v => v === watch('password') || "Passwords do not match"
                                    })}
                                    className="w-full h-14 px-5 text-black bg-gray-50 border-none rounded-xl text-xs font-semibold outline-none focus:bg-white focus:ring-4 focus:ring-[#7a6af6]/5 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPass(!showConfirmPass)} 
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#7a6af6]"
                                >
                                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="text-red-500 text-[9px] font-bold mt-1 ml-1 uppercase italic tracking-tighter">
                                    {errors.confirmPassword.message}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-14 bg-[#0F172A] text-white rounded-xl text-[10px] uppercase tracking-[0.3em] font-black shadow-lg hover:bg-black transition-all active:scale-[0.98] disabled:bg-gray-200 mt-2"
                        >
                            {isSubmitting ? (
                                <Loader2 className="animate-spin w-4 h-4 mx-auto" />
                            ) : (
                                "Update Password"
                            )}
                        </button>
                    </form>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ResetPassword;