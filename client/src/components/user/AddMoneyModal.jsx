import React, { useState } from 'react';
import { ArrowLeft, Wallet, CheckCircle2, Lock, Loader2, ShieldCheck, AlertCircle, XCircle, RefreshCw } from 'lucide-react';
import { useAddMoney } from '../../hooks/user/useWallet';
import userAxios from '../../api/baseAxios';
import { nxToast } from '../../utils/userToast';
import { loadRazorpayScript } from '../../utils/loadRazorpay';

const presetAmounts = [100, 500, 1000, 2000, 5000];

const AddMoneyModal = ({ isOpen, onClose, currentBalance }) => {
    const [step, setStep] = useState('input');
    const [failReason, setFailReason] = useState("");

    const [selectedPreset, setSelectedPreset] = useState(5000);
    const [customAmount, setCustomAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    
    // 🟢 Validation Error State
    const [validationError, setValidationError] = useState("");
    
    const { mutateAsync: addMoneyMutation } = useAddMoney();

    if (!isOpen) return null;

    const finalAmount = customAmount ? Number(customAmount) : selectedPreset;

    // 🟢 Dynamic Validation Function
    const validateAmount = (amount) => {
        if (!amount && amount !== 0) {
            setValidationError("Please enter an amount.");
            return false;
        }
        if (amount < 1) {
            setValidationError("Minimum amount to add is ₹1.");
            return false;
        }
        if (amount > 100000) {
            setValidationError("Maximum limit per transaction is ₹1,00,000.");
            return false;
        }
        setValidationError("");
        return true;
    };

    const handlePresetClick = (amt) => {
        setSelectedPreset(amt);
        setCustomAmount(''); 
        validateAmount(amt);
    };

    const handleCustomAmountChange = (e) => {
        const val = e.target.value;
        setCustomAmount(val);
        setSelectedPreset(null); 
        validateAmount(Number(val));
    };

    const resetModal = () => {
        setStep('input');
        setFailReason("");
        setIsProcessing(false);
        setValidationError("");
    };

    const fullyCloseModal = () => {
        resetModal();
        onClose();
    };

    const handlePayment = async () => {
        if (!validateAmount(finalAmount)) return;

        try {
            setIsProcessing(true);
            const isLoaded = await loadRazorpayScript();
            if (!isLoaded) {
                setFailReason("Payment Gateway is offline. Please check your connection.");
                setStep('failed');
                return;
            }

            const { data: orderData } = await userAxios.post("/user/payment/create-order", {
                amount: finalAmount
            });

            if (!orderData.success) throw new Error("Init failed");

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: orderData.order.amount,
                currency: "INR",
                name: "Next Zen Store",
                description: "Wallet Funding",
                order_id: orderData.order.id,
                handler: async function (response) {
                    try {
                        await addMoneyMutation({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            amount: finalAmount
                        });
                        setStep('success');
                    } catch (err) {
                        setFailReason("Payment was successful, but verification failed. Contact support.");
                        setStep('failed');
                    } finally {
                        setIsProcessing(false);
                    }
                },
                theme: { color: "#0F172A" }, 
                modal: { 
                    ondismiss: () => {
                        setIsProcessing(false);
                        setFailReason("Transaction was cancelled or interrupted.");
                        setStep('failed');
                    } 
                }
            };
            
            new window.Razorpay(options).open();
        } catch (error) {
            setIsProcessing(false);
            setFailReason("Could not initialize secure gateway.");
            setStep('failed');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-[500px] max-h-[90vh] overflow-y-auto custom-scrollbar relative text-[#0F172A] shadow-2xl rounded-[2rem] border border-slate-100 transition-all">
                
                <div className="p-8">
                    
                    {/* 🟢 STEP 1: INPUT FORM */}
                    {step === 'input' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <button 
                                onClick={fullyCloseModal} 
                                disabled={isProcessing} 
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-[#0F172A] mb-8 transition-colors disabled:opacity-50"
                            >
                                <ArrowLeft size={14} /> Back to Ledger
                            </button>
                            
                            <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-none mb-2 text-[#0F172A]">Fund Wallet</h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-8">Add secure credits to your terminal</p>

                            <div className="bg-[#0F172A] border border-slate-800 rounded-[20px] p-6 flex justify-between items-center mb-8 relative overflow-hidden shadow-xl">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent opacity-100" />
                                <div className="relative z-10">
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60 mb-1 italic">Current Balance</p>
                                    <p className="text-3xl font-black tracking-tighter italic text-white">₹{currentBalance?.toLocaleString() || '0'}</p>
                                </div>
                                <Wallet size={36} strokeWidth={1.5} className="text-white/20 relative z-10" />
                            </div>

                            <div className="mb-6">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Select Amount</p>
                                <div className="grid grid-cols-3 gap-3">
                                    {presetAmounts.map((amt) => (
                                        <button
                                            key={amt}
                                            onClick={() => handlePresetClick(amt)}
                                            className={`py-3 rounded-xl text-[11px] font-black italic tracking-tight border transition-all ${
                                                selectedPreset === amt 
                                                ? 'bg-[#0F172A] border-[#0F172A] text-white shadow-lg shadow-slate-900/20' 
                                                : 'bg-white border-slate-200 text-slate-500 hover:border-[#0F172A] hover:text-[#0F172A]'
                                            }`}
                                        >
                                            ₹ {amt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-8">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Or Enter Custom Amount</p>
                                <input
                                    type="number"
                                    placeholder="Amount in ₹"
                                    value={customAmount}
                                    onChange={handleCustomAmountChange}
                                    className={`w-full bg-slate-50 border rounded-xl px-5 py-4 text-sm font-bold text-[#0F172A] outline-none transition-all placeholder:text-slate-400 placeholder:font-normal ${
                                        validationError ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-200 focus:border-[#0F172A] focus:ring-1 focus:ring-[#0F172A]'
                                    }`}
                                />
                                {/* 🟢 Show Error Message */}
                                {validationError && (
                                    <p className="text-[9px] font-bold text-red-500 uppercase flex items-center gap-1 mt-2 animate-in fade-in slide-in-from-top-1">
                                        <AlertCircle size={10} /> {validationError}
                                    </p>
                                )}
                            </div>

                            <div className="mb-8">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Settlement Protocol</p>
                                <div className="border border-slate-200 bg-slate-50 rounded-xl p-5 flex items-center justify-between cursor-default">
                                    <div className="flex items-center gap-4">
                                        <img src="/Razorpay_logo.png" className="h-4" alt="Razorpay" />
                                        <div>
                                            <p className="font-black text-[10px] uppercase tracking-widest text-[#0F172A]">Razorpay Secure</p>
                                            <p className="text-[8px] text-slate-500 uppercase font-bold mt-0.5">UPI, Cards, NetBanking</p>
                                        </div>
                                    </div>
                                    <CheckCircle2 size={18} className="text-[#3395FF]" />
                                </div>
                            </div>

                            <div className="space-y-3 mb-8 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    <span>Amount to add</span>
                                    <span className="text-[#0F172A]">₹{finalAmount || 0}</span>
                                </div>
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    <span>Processing fee</span>
                                    <span className="text-green-500">FREE</span>
                                </div>
                                <div className="flex justify-between pt-3 border-t border-slate-200 items-end">
                                    <span className="font-black uppercase tracking-widest text-slate-500 text-[10px]">Total Payable</span>
                                    <span className="font-black text-[#0F172A] text-2xl italic leading-none tracking-tighter">₹{finalAmount || 0}</span>
                                </div>
                            </div>

                            <button 
                                onClick={handlePayment} 
                                disabled={isProcessing || !!validationError || !finalAmount}
                                className="w-full py-5 bg-[#0F172A] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-[#1e293b] transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {isProcessing ? <Loader2 className="animate-spin" size={18} /> : `Fund ₹${finalAmount || 0} Securely`}
                            </button>

                            <div className="flex items-center justify-center gap-2 mt-6 text-slate-400 text-[8px] font-black uppercase tracking-[0.2em]">
                                <ShieldCheck size={12} className="text-green-500" /> Handshake Encrypted via Razorpay
                            </div>
                        </div>
                    )}

                    {/* 🟢 STEP 2: SUCCESS SCREEN */}
                    {step === 'success' && (
                        <div className="py-10 flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
                            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 border-8 border-green-100">
                                <CheckCircle2 size={40} className="text-green-500" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-green-500 mb-2">Transaction Verified</p>
                            <h2 className="text-4xl font-black italic tracking-tighter text-[#0F172A] mb-4">₹{finalAmount} Added</h2>
                            <p className="text-xs text-slate-500 mb-10 max-w-[250px] leading-relaxed">
                                The funds have been successfully credited to your digital wallet.
                            </p>
                            <button 
                                onClick={fullyCloseModal} 
                                className="w-full py-5 bg-[#0F172A] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#1e293b] transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98]"
                            >
                                Continue to Ledger
                            </button>
                        </div>
                    )}

                    {/* 🟢 STEP 3: FAILED SCREEN (THEME UPDATED) */}
                    {step === 'failed' && (
                        <div className="py-10 flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
                            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6 border-8 border-red-100/50">
                                <XCircle size={40} className="text-red-500" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500 mb-2">Transaction Failed</p>
                            <h2 className="text-3xl font-black italic tracking-tighter text-[#0F172A] mb-4">Payment Unsuccessful</h2>
                            <p className="text-xs font-bold text-slate-500 mb-10 max-w-[250px] leading-relaxed">
                                {failReason}
                            </p>
                            
                            <div className="grid grid-cols-2 gap-3 w-full">
                                <button 
                                    onClick={fullyCloseModal} 
                                    className="py-4 bg-white border-2 border-slate-200 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:border-slate-300 hover:text-slate-700 transition-all active:scale-[0.98]"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={resetModal} 
                                    className="py-4 bg-[#0F172A] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-[#1e293b] transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98]"
                                >
                                    <RefreshCw size={14} /> Retry Payment
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default AddMoneyModal;