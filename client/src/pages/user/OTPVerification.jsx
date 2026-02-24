import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Mail, ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import { verifySignupOTP, resendSignupOTP } from '../../api/user/user.api';
import { verifyForgotPasswordOTP, resendForgotPasswordOTP } from '../../api/user/user.api';
import { verifyEmailChange, resendEmailChangeOTP } from '../../api/user/user.api';
import { setUser } from '../../store/user/authSlice';
import Header from '../../components/user/Header';
import Footer from '../../components/user/Footer';
import { nxToast } from '../../utils/userToast';

const OTPVerification = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { email, flow, name, password, referralCode } = location.state || {};

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);

    useEffect(() => {
        if (!email || !flow) {
            nxToast.security('Invalid access session');
            navigate('/login');
        }
    }, [email, flow, navigate]);

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
            return () => clearInterval(interval);
        } else {
            setCanResend(true);
        }
    }, [timer]);

    const handleOtpChange = (index, value) => {
        if (!/^\d?$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`)?.focus();
        }
    };


    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            document.getElementById(`otp-${index - 1}`)?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
        const newOtp = pastedData.split('');
        setOtp([...newOtp, ...Array(6 - newOtp.length).fill('')]);
    };

    const handleVerify = async () => {
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            nxToast.security('Please enter the 6-digit code');
            return;
        }

        setIsVerifying(true);

        try {
            let response;
            if (flow === 'signup') {
                const finalReferralCode = referralCode || localStorage.getItem("pending_referral");

                await verifySignupOTP({
                    email,
                    otp: otpString,
                    name,
                    password,
                    referralCode: finalReferralCode,
                    purpose: "SIGNUP"
                });

                localStorage.removeItem("pending_referral");
                nxToast.success('Account verified successfully!');
                navigate('/login');

            } else if (flow === 'forgot_password') {
                // 🟢 ADD THIS BACK: This was missing in your last version
                await verifyForgotPasswordOTP({
                    email,
                    otp: otpString,
                    purpose: "FORGOT_PASSWORD"
                });

                nxToast.success('Email verified! Set your new password.');
                navigate('/reset-password', { state: { email, otp: otpString } });

            } else if (flow === 'email_change') {
                // 🟢 ADD THIS BACK: For profile email updates
                response = await verifyEmailChange({
                    email,
                    otp: otpString,
                    purpose: "EMAIL_CHANGE"
                });
                dispatch(setUser(response.data.user));
                nxToast.success('Email updated successfully');
                navigate('/profile/info');
            }

        } catch (error) {
            console.error("Verification Error:", error);
            nxToast.security(error.response?.data?.message || 'Invalid verification code');
            setOtp(['', '', '', '', '', '']);
            document.getElementById('otp-0')?.focus();
        } finally {
            setIsVerifying(false);
        }
    };


    const handleResend = async () => {
        if (!canResend) return;
        setIsResending(true);

        try {
            if (flow === 'signup') {
                await resendSignupOTP({ email, purpose: "SIGNUP" });
            } else if (flow === 'forgot_password') {
                await resendForgotPasswordOTP({ email, purpose: "FORGOT_PASSWORD" });
            } else if (flow === 'email_change') {
                await resendEmailChangeOTP({ email, purpose: "EMAIL_CHANGE" });
            }

            nxToast.success('A new code has been sent');
            setTimer(60);
            setCanResend(false);
            setOtp(['', '', '', '', '', '']);
            document.getElementById('otp-0')?.focus();
        } catch (error) {
            nxToast.security(error.response?.data?.message || 'Failed to resend code');
            error("error.response?.data?.message || 'Failed to resend code'")
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-black/20 font-sans selection:bg-[#7a6af6]/20 mt-20">
            <Header />
            <main className="flex-grow flex items-center justify-center py-12 px-4 ">
                <div className="max-w-[400px] w-full bg-white border border-gray-100 shadow-[0_15px_40px_rgba(0,0,0,0.04)] rounded-[2.5rem] p-8 md:p-10 text-center">

                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-400 hover:text-[#0F172A] mb-8 text-[10px] font-black uppercase tracking-[0.2em] transition-all group"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Back
                    </button>

                    <div className="w-16 h-16 bg-[#0F172A] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#0F172A]/10 text-white">
                        <Mail size={28} strokeWidth={2} />
                    </div>

                    <header className="mb-10">
                        <h2 className="text-2xl font-black text-[#0F172A] tracking-tight mb-2 uppercase">Verify Identity</h2>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.15em] leading-relaxed">
                            Code sent to <span className="text-[#7a6af6]">{email}</span>
                        </p>
                    </header>

                    <div className="flex justify-between gap-2 mb-8">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                id={`otp-${index}`}
                                type="text"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={handlePaste}
                                className="w-11 h-14 text-center text-xl font-black bg-gray-300 border-2 border-transparent rounded-xl focus:border-[#7a6af6]/20 focus:bg-white focus:ring-4 focus:ring-[#7a6af6]/5 outline-none transition-all text-[#0F172A]"
                            />
                        ))}
                    </div>

                    <button
                        onClick={handleVerify}
                        disabled={isVerifying}
                        className="w-full h-14 bg-[#0F172A] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.3em] shadow-lg hover:bg-black transition-all active:scale-[0.98] mb-6 flex items-center justify-center"
                    >
                        {isVerifying ? <Loader2 size={18} className="animate-spin" /> : 'Confirm Code'}
                    </button>

                    <div className="pt-4 border-t border-gray-50">
                        {canResend ? (
                            <button
                                onClick={handleResend}
                                disabled={isResending}
                                className="flex items-center justify-center gap-2 mx-auto text-[10px] font-black uppercase tracking-[0.2em] text-[#7a6af6] hover:text-[#5a49d6] transition-all"
                            >
                                <RefreshCw size={14} className={`${isResending ? 'animate-spin' : ''}`} />
                                {isResending ? 'Requesting...' : 'Resend Code'}
                            </button>
                        ) : (
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none">
                                Request new code in <span className="text-[#0F172A]">{timer}s</span>
                            </p>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default OTPVerification;