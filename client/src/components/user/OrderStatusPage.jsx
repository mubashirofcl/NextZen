import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, ArrowRight, Package, ShieldCheck, FileText, RefreshCw, ShoppingBag, Loader2 } from 'lucide-react';
import Header from '../../components/user/Header';
import Footer from '../../components/user/Footer';
import userAxios from '../../api/baseAxios';
import { nxToast } from '../../utils/userToast';
import { loadRazorpayScript } from '../../utils/loadRazorpay';

const OrderStatusPage = ({ type = 'success' }) => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [fetchedOrder, setFetchedOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(type === 'failed' && !location.state);

    const { error, orderPayload, totalAmount } = location.state || {};

    const isSuccess = type === 'success';
    const themeColor = isSuccess ? "#7a6af6" : "#ef4444";
    const statusLabel = isSuccess ? "Confirmed" : "Failed";

    useEffect(() => {
        if (!isSuccess && !totalAmount && orderId) {
            const fetchFailedOrder = async () => {
                try {
                    setIsLoading(true);
                    const { data } = await userAxios.get(`/users/orders/${orderId}`);
                    if (data.success) {
                        setFetchedOrder(data.order);
                    } else {
                        navigate('/profile/orders', { replace: true });
                    }
                } catch (err) {
                    navigate('/profile/orders', { replace: true });
                } finally {
                    setIsLoading(false);
                }
            };
            fetchFailedOrder();
        }
    }, [isSuccess, totalAmount, orderId, navigate]);

    const actualTotalAmount = totalAmount || fetchedOrder?.totalAmount;
    const actualError = error || "The bank was unable to authorize this transaction.";

    const handleRetry = async () => {
        try {
            if (!actualTotalAmount) {
                nxToast.error("Session Expired", "Please restart from your order history.");
                return navigate('/profile/orders');
            }

            const isLoaded = await loadRazorpayScript();
            if (!isLoaded) return nxToast.error("Gateway Offline");

            const { data: sessionData } = await userAxios.post("/user/payment/create-order", {
                amount: actualTotalAmount,
                orderId: orderId,
                isRetry: true
            });

            if (!sessionData.success) return nxToast.error("Could not refresh session");

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: sessionData.order.amount,
                currency: "INR",
                name: "Next Zen Store",
                description: "Re-attempting Payment",
                order_id: sessionData.order.id,
                handler: async function (response) {
                    try {
                        const verifyRes = await userAxios.post("/user/payment/verify-payment", response);
                        if (verifyRes.data.success) {
                            await userAxios.patch(`/users/orders/${orderId}/complete-retry`, {
                                paymentInfo: response,
                                newRazorpayOrderId: sessionData.order.id
                            });

                            nxToast.success("Success", "Payment confirmed successfully.");
                            navigate(`/checkout/success/${orderId}`, { replace: true });
                        }
                    } catch (err) {
                        nxToast.error("Sync Error", "Contact Support.");
                    }
                },
                theme: { color: themeColor },
                modal: { ondismiss: () => nxToast.security("Retry Cancelled") }
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            nxToast.error("Gateway Error", "Failed to initialize retry.");
        }
    };

    const glassStyle = "bg-gradient-to-br from-white/[0.10] to-transparent backdrop-blur-2xl border border-white/10 shadow-2xl rounded-[2rem]";

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <Loader2 className="animate-spin text-red-500" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen mt-12 text-white flex flex-col font-sans selection:bg-[#7a6af6]/30 overflow-hidden">
            <Header />
            <main className="flex-1 flex items-center justify-center w-full px-6 pt-20 pb-10 relative">

                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none"
                    style={{ backgroundColor: themeColor }}
                />

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`${glassStyle} max-w-[420px] w-full p-8 text-center space-y-8 relative overflow-hidden`}>

                    <motion.div
                        initial={{ top: "-100%" }} animate={{ top: "100%" }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 w-full h-20 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none z-20"
                    />

                    <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
                        <motion.div
                            initial={{ scale: 0 }} animate={{ scale: 1.5, opacity: 0 }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="absolute inset-0 border-2 rounded-full"
                            style={{ borderColor: themeColor }}
                        />
                        {isSuccess ?
                            <CheckCircle2 size={64} className="text-[#02faa7] relative z-10 drop-shadow-[0_0_15px_rgba(2,250,167,0.4)]" /> :
                            <XCircle size={64} className="text-red-500 relative z-10 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]" />
                        }
                    </div>

                    <div className="space-y-3 relative z-10">
                        <p className="text-[9px] font-black uppercase tracking-[0.6em] italic" style={{ color: isSuccess ? themeColor : '#f87171' }}>
                            Order // {statusLabel}
                        </p>
                        <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-none">
                            {isSuccess ? 'Success' : 'Failed'}
                        </h1>

                        <div className="space-y-4 pt-2">
                            <div className="inline-block px-4 py-1.5 bg-white/5 border border-white/10 rounded-xl">
                                <p className="text-[10px] text-white/50 font-black uppercase tracking-widest">
                                    Order ID: <span className="text-white">#{orderId?.slice(-8).toUpperCase() || 'ORDER-ID'}</span>
                                </p>
                            </div>
                            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest leading-relaxed max-w-[280px] mx-auto italic">
                                {isSuccess ? 'Payment confirmed. We are now preparing your items for shipping.' : actualError}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 pt-4 relative z-10">
                        {isSuccess ? (
                            <button onClick={() => navigate(`/profile/orders/${orderId}`)} className="w-full py-4 bg-[#7a6af6] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-2 hover:bg-white hover:text-black transition-all group shadow-xl">
                                <FileText size={14} className="group-hover:rotate-12 transition-transform" /> View Order Details
                            </button>
                        ) : (
                            <button onClick={handleRetry} className="w-full py-4 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-white hover:text-red-600 transition-all group shadow-xl">
                                <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-700" /> Try Payment Again
                            </button>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => navigate('/profile/orders')} className="py-3.5 bg-white/5 border border-white/10 text-white rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-white/10 transition-all group">
                                {isSuccess ? <Package size={14} /> : <ShoppingBag size={14} />} {isSuccess ? 'My Orders' : 'My Cart'}
                            </button>
                            <button onClick={() => navigate('/shop')} className="py-3.5 bg-white/5 border border-white/10 text-white rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-white/10 transition-all">
                                Shop More <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="pt-2 flex justify-center items-center gap-2 opacity-30 text-[8px] font-black uppercase tracking-[0.5em] italic">
                        <ShieldCheck size={12} className={isSuccess ? "text-[#02faa7]" : "text-red-500"} /> Secure Checkout
                    </div>
                </motion.div>
            </main>
            <Footer />
        </div>
    );
};

export default OrderStatusPage;