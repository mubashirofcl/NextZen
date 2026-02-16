import React from 'react';
import { motion } from 'framer-motion';
import {
    Wallet, ArrowUpRight, ArrowDownLeft,
    Clock, Receipt, ShieldCheck, History,
    XCircle, RotateCcw, ShoppingBag
} from 'lucide-react';
import { useWallet } from '../../hooks/user/useWallet';

const WalletDashboard = () => {
    const { data: wallet, isLoading } = useWallet();

    const glassStyle = "bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-2xl";

    // 🟢 Logic to determine the icon based on transaction description
    const getTransactionIcon = (description) => {
        const desc = description?.toLowerCase() || '';
        if (desc.includes('cancel')) return <XCircle size={12} className="text-red-400" />;
        if (desc.includes('return')) return <RotateCcw size={12} className="text-blue-400" />;
        if (desc.includes('order placement') || desc.includes('purchase')) return <ShoppingBag size={12} className="text-[#7a6af6]" />;
        return <Receipt size={12} className="text-white/40" />;
    };

    if (isLoading) return (
        <div className="h-[400px] flex flex-col items-center justify-center gap-4">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
                <Wallet className="text-[#7a6af6]/40" size={42} />
            </motion.div>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">Syncing Ledger...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col gap-2 pb-6 border-b border-white/5">
                <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">
                    Digital <span className="text-white/20">Wallet</span>
                </h1>
                <p className="text-[9px] text-[#7a6af6] font-black uppercase tracking-[0.4em] italic">
                    Terminal // Financial Ledger
                </p>
            </div>

            {/* Balance Card Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 relative overflow-hidden group rounded-[2.5rem]">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#7a6af6] to-[#4f46e5] opacity-90 transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Wallet size={160} />
                    </div>

                    <div className="relative p-10 h-full flex flex-col justify-between min-h-[240px] text-white">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 italic">Current Balance</p>
                                <h2 className="text-6xl font-black italic tracking-tighter">
                                    ₹{wallet?.balance?.toLocaleString() || '0'}
                                </h2>
                            </div>
                            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xl border border-white/10">
                                <ShieldCheck className="text-white" size={24} />
                            </div>
                        </div>

                        <div className="flex items-center gap-4 pt-6">
                            <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
                                <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Status</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest">Active Terminal</p>
                            </div>
                            <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
                                <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Currency</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest">INR // ₹</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`${glassStyle} p-8 flex flex-col justify-center gap-6`}>
                    <div className="space-y-2 group cursor-default">
                        <div className="flex items-center gap-2 text-green-400 group-hover:translate-x-1 transition-transform">
                            <ArrowDownLeft size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Instant Refunds</span>
                        </div>
                        <p className="text-[9px] text-white/30 font-bold uppercase leading-relaxed italic">
                            Cancellations and returns are credited back to your wallet immediately.
                        </p>
                    </div>
                    <div className="space-y-2 group cursor-default">
                        <div className="flex items-center gap-2 text-[#7a6af6] group-hover:translate-x-1 transition-transform">
                            <Receipt size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">One-Click Pay</span>
                        </div>
                        <p className="text-[9px] text-white/30 font-bold uppercase leading-relaxed italic">
                            Use your balance at checkout for the fastest possible transaction.
                        </p>
                    </div>
                </div>
            </div>

            {/* Transaction History Section */}
            <div className={`${glassStyle} overflow-hidden flex flex-col`}>
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white italic flex items-center gap-2">
                        <History size={14} className="text-[#7a6af6]" /> Transaction History
                    </h3>
                    <span className="px-3 py-1 bg-white/5 rounded-full text-[8px] font-black text-white/40 uppercase tracking-widest border border-white/5">
                        {wallet?.transactions?.length || 0} Events Logged
                    </span>
                </div>

                <div className="max-h-[450px] overflow-y-auto custom-scrollbar overflow-x-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-20 bg-[#0a0a0a] border-b border-white/5">
                            <tr>
                                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-white/30 italic">Details</th>
                                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-white/30 italic">Type</th>
                                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-white/30 italic text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {wallet?.transactions?.length > 0 ? (
                                [...wallet.transactions].reverse().map((tx, i) => (
                                    <tr key={i} className="hover:bg-white/[0.02] transition-all group">
                                        <td className="px-8 py-5">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    {getTransactionIcon(tx.description)}
                                                    <p className="text-[11px] font-black uppercase italic text-white group-hover:text-[#7a6af6] transition-colors leading-tight">
                                                        {tx.description}
                                                    </p>
                                                </div>
                                                <p className="text-[9px] font-bold text-white/20 uppercase tracking-tighter flex items-center gap-1.5">
                                                    <Clock size={10} />
                                                    {new Date(tx.date).toLocaleDateString('en-GB', {
                                                        day: '2-digit', month: 'short', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border transition-colors ${tx.type === 'credit'
                                                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                }`}>
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <span className={`text-sm font-black italic tracking-tighter ${tx.type === 'credit' ? 'text-green-400' : 'text-white'
                                                }`}>
                                                {tx.type === 'credit' ? '+' : '-'} ₹{tx.amount.toLocaleString()}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-20">
                                            <Receipt size={32} />
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">
                                                No movement detected in ledger.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(122, 106, 246, 0.2);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(122, 106, 246, 0.5);
                }
            `}} />
        </div>
    );
};

export default WalletDashboard;