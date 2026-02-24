import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { requestForgotPassword } from "../../api/user/user.api";
import Header from "../../components/user/Header";
import Footer from "../../components/user/Footer";
import { nxToast } from "../../utils/userToast";

const ForgotPassword = () => {
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

    const onSubmit = async (data) => {
        try {
            await requestForgotPassword(data);
            navigate("/verify-otp", { state: { email: data.email, flow: "forgot_password" } });
            nxToast.success("Verification code sent to your Email");
        } catch (err) {
            nxToast.security(err.response?.data?.message || "Error sending code");
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-black/20 font-sans selection:bg-[#7a6af6]/20 mt-20">
            <Header />
            <main className="flex-grow flex items-center justify-center py-12 px-4">
                <div className="max-w-[380px] w-full bg-white border border-gray-100 shadow-[0_15px_40px_rgba(0,0,0,0.04)] rounded-[2rem] p-8 md:p-10 text-center">

                    <div className="w-14 h-14 bg-[#0F172A] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#0F172A]/10 text-white">
                        <ShieldCheck size={24} strokeWidth={2} />
                    </div>

                    <header className="mb-8">
                        <h2 className="text-2xl font-black text-[#0F172A] tracking-tight mb-2">Recovery</h2>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
                            Enter your email for a code
                        </p>
                    </header>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-left">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Email Address</label>
                            <input
                                type="email"
                                placeholder="name@example.com"
                                {...register("email", { required: "Email is required" })}
                                className="w-full h-14 px-5 bg-gray-50 border-none rounded-xl text-xs text-black font-semibold outline-none focus:bg-white focus:ring-4 focus:ring-[#7a6af6]/5 transition-all"
                            />
                            {errors.email && <p className="text-red-500 text-[9px] font-bold mt-1 ml-1 uppercase tracking-tighter italic">{errors.email.message}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-14 bg-[#0F172A] text-white rounded-xl text-[10px] uppercase tracking-[0.3em] font-black shadow-lg hover:bg-black transition-all active:scale-[0.98] disabled:bg-gray-200 mt-2"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : "Send Code"}
                        </button>
                    </form>

                    <button
                        onClick={() => navigate("/login")}
                        className="mt-8 flex items-center justify-center gap-2 mx-auto text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-all group"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Sign In
                    </button>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ForgotPassword;