import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Package, ShieldCheck, FileText } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

const OrderSuccessPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();

    const glassStyle = "bg-gradient-to-br from-white/[0.10] to-transparent backdrop-blur-2xl border border-white/10 shadow-2xl rounded-[2rem]";

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0, scale: 0.9, y: 20 },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen mt-12 text-white flex flex-col font-sans selection:bg-[#7a6af6]/30 overflow-hidden">
            <Header />

            <main className="flex-1 flex items-center justify-center w-full px-6 pt-20 pb-10 relative">

                {/* Background Animated Orbs */}
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#7a6af6] rounded-full blur-[120px] pointer-events-none"
                />

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className={`${glassStyle} max-w-[420px] w-full p-8 text-center space-y-8 relative overflow-hidden`}
                >
                    {/* Scanning Animation Effect */}
                    <motion.div
                        initial={{ top: "-100%" }}
                        animate={{ top: "100%" }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 w-full h-20 bg-gradient-to-b from-transparent via-[#7a6af6]/10 to-transparent pointer-events-none z-20"
                    />

                    {/* Checkmark Animation */}
                    <motion.div variants={itemVariants} className="relative mx-auto w-20 h-20 flex items-center justify-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1.5, opacity: 0 }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="absolute inset-0 border-2 border-[#7a6af6] rounded-full"
                        />
                        <CheckCircle2 size={64} className="text-[#02faa7] relative z-10 drop-shadow-[0_0_15px_rgba(2,250,167,0.4)]" />
                    </motion.div>

                    {/* Typography Segments */}
                    <div className="space-y-3 relative z-10">
                        <motion.p variants={itemVariants} className="text-[9px] font-black uppercase tracking-[0.6em] text-[#7a6af6] italic">
                            Transaction // Verified
                        </motion.p>
                        <motion.h1 variants={itemVariants} className="text-4xl font-black uppercase tracking-tighter italic leading-none">
                            Success
                        </motion.h1>

                        <motion.div variants={itemVariants} className="space-y-4 pt-2">
                            <div className="inline-block px-4 py-1.5 bg-white/5 border border-white/10 rounded-xl">
                                <p className="text-[10px] text-white/50 font-black uppercase tracking-widest">
                                    Manifest: <span className="text-white">#{orderId?.slice(-8).toUpperCase() || 'MANIFEST-X'}</span>
                                </p>
                            </div>
                            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest leading-relaxed max-w-[280px] mx-auto italic">
                                Encryption confirmed. The logistics protocol for your payload has been initialized.
                            </p>
                        </motion.div>
                    </div>

                    {/* Action Grid */}
                    <motion.div variants={itemVariants} className="grid grid-cols-1 gap-2 pt-4 relative z-10">
                        <button
                            onClick={() => navigate(`/profile/orders/${orderId}`)}
                            className="w-full py-4 bg-[#7a6af6] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-white hover:text-black transition-all duration-300 shadow-xl shadow-[#7a6af6]/20 group"
                        >
                            <FileText size={14} className="group-hover:rotate-12 transition-transform" /> View Manifest
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => navigate('/profile/orders')}
                                className="py-3.5 bg-white/5 border border-white/10 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-white/10 transition-all group"
                            >
                                <Package size={14} className="group-hover:scale-110 transition-transform" /> Archive
                            </button>
                            <button
                                onClick={() => navigate('/shop')}
                                className="py-3.5 bg-white/5 border border-white/10 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-white/10 transition-all group"
                            >
                                Shop <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </motion.div>

                    {/* Security Footer */}
                    <motion.div variants={itemVariants} className="pt-2 flex justify-center items-center gap-2 opacity-30 text-[8px] font-black uppercase tracking-[0.5em] italic">
                        <ShieldCheck size={12} className="text-[#02faa7]" /> Terminal Secured
                    </motion.div>
                </motion.div >
            </main >

            <Footer />
        </div >
    );
};

export default OrderSuccessPage;