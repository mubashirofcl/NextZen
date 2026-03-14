import React, { useState, useEffect, useCallback } from 'react';
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
import TOAST_MESSAGES from '../../utils/toastMessages';

const OTP_COOLDOWN = 60; // seconds

const OTPVerification = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { email, flow, name, password, referralCode } = location.state || {};
    const storageKey = `otp_expiry_${email}_${flow}`;

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [timer, setTimer] = useState(0);
    const [canResend, setCanResend] = useState(false);

    // 🟢 Function to set a fresh 60s timestamp in storage
    const startNewTimer = useCallback(() => {
        const expiry = Date.now() + OTP_COOLDOWN * 1000;
        localStorage.setItem(storageKey, expiry.toString());
        setTimer(OTP_COOLDOWN);
        setCanResend(false);
    }, [storageKey]);

    // 🟢 Initialization: Check storage on load/refresh
    useEffect(() => {
        if (!email || !flow) return;

        const targetTime = localStorage.getItem(storageKey);
        if (targetTime) {
            const remaining = Math.ceil((parseInt(targetTime) - Date.now()) / 1000);
            if (remaining > 0) {
                setTimer(remaining);
                setCanResend(false);
            } else {
                setCanResend(true);
                setTimer(0);
            }
        } else {
            // First time landing on page, start the first timer
            startNewTimer();
        }
    }, [email, flow, storageKey, startNewTimer]);

    // Redirect if session is invalid
    useEffect(() => {
        if (!email || !flow) {
            nxToast.security(TOAST_MESSAGES.AUTH.ACCESS_DENIED.title, TOAST_MESSAGES.AUTH.ACCESS_DENIED.message);
            navigate('/login', { replace: true });
        }
    }, [email, flow, navigate]);

    // 🟢 Ticking Logic
    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => {
                    if (prev <= 1) {
                        setCanResend(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
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
            nxToast.security(TOAST_MESSAGES.VERIFICATION.MISSING_OTP.title, TOAST_MESSAGES.VERIFICATION.MISSING_OTP.message);
            return;
        }

        setIsVerifying(true);
        try {
            if (flow === 'signup') {
                const finalReferralCode = referralCode || localStorage.getItem("pending_referral");
                await verifySignupOTP({
                    email, otp: otpString, name, password,
                    referralCode: finalReferralCode, purpose: "SIGNUP"
                });
                localStorage.removeItem("pending_referral");
                localStorage.removeItem(storageKey); // Clear timer
                nxToast.success(TOAST_MESSAGES.VERIFICATION.ACCOUNT_VERIFIED.title, TOAST_MESSAGES.VERIFICATION.ACCOUNT_VERIFIED.message);
                navigate('/login', { replace: true });
            } else if (flow === 'forgot_password') {
                await verifyForgotPasswordOTP({ email, otp: otpString, purpose: "FORGOT_PASSWORD" });
                localStorage.removeItem(storageKey); // Clear timer
                nxToast.success(TOAST_MESSAGES.VERIFICATION.PASSWORD_SET.title, TOAST_MESSAGES.VERIFICATION.PASSWORD_SET.message);
                navigate('/reset-password', { state: { email, otp: otpString }, replace: true });
            } else if (flow === 'email_change') {
                const response = await verifyEmailChange({ email, otp: otpString, purpose: "EMAIL_CHANGE" });
                localStorage.removeItem(storageKey); // Clear timer
                dispatch(setUser(response.data.user));
                nxToast.success(TOAST_MESSAGES.VERIFICATION.EMAIL_UPDATED.title, TOAST_MESSAGES.VERIFICATION.EMAIL_UPDATED.message);
                navigate('/profile/info', { replace: true });
            }
        } catch (error) {
            nxToast.security(TOAST_MESSAGES.VERIFICATION.INVALID_OTP.title, error.response?.data?.message || TOAST_MESSAGES.VERIFICATION.INVALID_OTP.message);
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
            if (flow === 'signup') await resendSignupOTP({ email, purpose: "SIGNUP" });
            else if (flow === 'forgot_password') await resendForgotPasswordOTP({ email, purpose: "FORGOT_PASSWORD" });
            else if (flow === 'email_change') await resendEmailChangeOTP({ email, purpose: "EMAIL_CHANGE" });

            nxToast.success(TOAST_MESSAGES.VERIFICATION.OTP_SENT.title, TOAST_MESSAGES.VERIFICATION.OTP_SENT.message);
            
            // 🟢 FORCE NEW STORAGE TIMESTAMP
            startNewTimer();
            
            setOtp(['', '', '', '', '', '']);
            document.getElementById('otp-0')?.focus();
        } catch (error) {
            nxToast.security(TOAST_MESSAGES.VERIFICATION.RESEND_FAILED.title, error.response?.data?.message || TOAST_MESSAGES.VERIFICATION.RESEND_FAILED.message);
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
                                key={index} id={`otp-${index}`} type="text"
                                className="w-11 h-14 text-center text-xl font-black bg-gray-300 border-2 border-transparent rounded-xl focus:border-[#7a6af6]/20 focus:bg-white focus:ring-4 focus:ring-[#7a6af6]/5 outline-none transition-all text-[#0F172A]"
                                maxLength={1} value={digit}
                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={handlePaste}
                            />
                        ))}
                    </div>
                    <button
                        onClick={handleVerify} disabled={isVerifying}
                        className="w-full h-14 bg-[#0F172A] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.3em] shadow-lg hover:bg-black transition-all active:scale-[0.98] mb-6 flex items-center justify-center"
                    >
                        {isVerifying ? <Loader2 size={18} className="animate-spin" /> : 'Confirm Code'}
                    </button>
                    <div className="pt-4 border-t border-gray-50">
                        {canResend ? (
                            <button
                                onClick={handleResend} disabled={isResending}
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