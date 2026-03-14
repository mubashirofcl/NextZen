import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Wallet, ArrowDownLeft, Receipt, History,
    XCircle, RotateCcw, ShoppingBag, PlusCircle, Plus,
    Clock
} from 'lucide-react';
import { useWallet } from '../../hooks/user/useWallet';
import AddMoneyModal from '../../components/user/AddMoneyModal';

const WalletDashboard = () => {
    const { data: wallet, isLoading } = useWallet();
    const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);

    const glassStyle = "bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-2xl";

    const getTransactionIcon = (description) => {
        const desc = description?.toLowerCase() || '';
        if (desc.includes('cancel')) return <XCircle size={14} className="text-red-400" />;
        if (desc.includes('return') || desc.includes('refund')) return <RotateCcw size={14} className="text-blue-400" />;
        if (desc.includes('placement') || desc.includes('purchase')) return <ShoppingBag size={14} className="text-[#7a6af6]" />;
        if (desc.includes('added') || desc.includes('funding')) return <PlusCircle size={14} className="text-green-400" />;
        return <Receipt size={14} className="text-white/40" />;
    };

    const formatDescription = (tx) => {
        const desc = tx.description;
        if (!desc || typeof desc !== 'string' || desc.toLowerCase().includes('undefined') || desc.trim() === "") {
            if (tx.type?.toLowerCase() === 'credit') return "Refund Received";
            return "Payment for Order";
        }
        let cleanText = desc.replace(/_/g, ' ');
        
        if (cleanText.toLowerCase().includes('referral join bonus')) return "Referral Reward Received";
        if (cleanText.toLowerCase().includes('order placement')) return "Payment for Order";
        
        return cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
    };

    const sortedTransactions = useMemo(() => {
        if (!wallet?.transactions) return [];
        return [...wallet.transactions].sort((a, b) => {
            const dateA = new Date(a.date || 0);
            const dateB = new Date(b.date || 0);
            return dateB - dateA;
        });
    }, [wallet?.transactions]);

    // Helper to fix floating point precision to 2 digits
    const formatCurrency = (amount) => {
        return Number(Math.round(amount + "e2") + "e-2").toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    if (isLoading) return (
        <div className="h-[400px] flex flex-col items-center justify-center gap-4">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                <Wallet className="text-[#7a6af6]/40" size={42} />
            </motion.div>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">Loading Wallet Details...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            <div className="flex flex-col gap-2 pb-6 border-b border-white/5">
                <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">
                    My <span className="text-white/20">Wallet</span>
                </h1>
                <p className="text-[9px] text-[#7a6af6] font-black uppercase tracking-[0.4em] italic">
                    Balance & Transaction History
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 relative overflow-hidden group rounded-[2.5rem]">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#7a6af6] to-[#4f46e5] opacity-90 transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute top-0 right-0 p-8 opacity-10"><Wallet size={160} /></div>

                    <div className="relative p-10 h-full flex flex-col justify-between min-h-[240px] text-white">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 italic">Available Balance</p>
                                <h2 className="text-6xl font-black italic tracking-tighter">
                                    ₹{formatCurrency(wallet?.balance || 0)}
                                </h2>
                            </div>

                            <button 
                                onClick={() => setIsAddMoneyOpen(true)}
                                className="bg-white text-[#4f46e5] px-5 py-3 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
                            >
                                <Plus size={16} strokeWidth={3} /> Add Money
                            </button>
                        </div>
                        <div className="flex items-center gap-4 pt-6">
                            <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/10">
                                <p className="text-[10px] font-bold uppercase tracking-widest">Active Wallet</p>
                            </div>
                            <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/10">
                                <p className="text-[10px] font-bold uppercase tracking-widest">Currency: INR (₹)</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`${glassStyle} p-8 flex flex-col justify-center gap-6`}>
                    <div className="space-y-2 group cursor-default">
                        <div className="flex items-center gap-2 text-green-400 group-hover:translate-x-1 transition-transform">
                            <ArrowDownLeft size={16} /><span className="text-[10px] font-black uppercase tracking-widest">Fast Refunds</span>
                        </div>
                        <p className="text-[9px] text-white/30 font-bold uppercase leading-relaxed italic">Refunds for returned items are credited instantly to your wallet.</p>
                    </div>
                    <div className="space-y-2 group cursor-default">
                        <div className="flex items-center gap-2 text-[#7a6af6] group-hover:translate-x-1 transition-transform">
                            <Receipt size={16} /><span className="text-[10px] font-black uppercase tracking-widest">Safe Payments</span>
                        </div>
                        <p className="text-[9px] text-white/30 font-bold uppercase leading-relaxed italic">Every transaction is securely recorded with a permanent time stamp.</p>
                    </div>
                </div>
            </div>

            <div className={`${glassStyle} overflow-hidden flex flex-col`}>
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white italic flex items-center gap-2">
                        <History size={14} className="text-[#7a6af6]" /> Recent Transactions
                    </h3>
                    <span className="px-3 py-1 bg-white/5 rounded-full text-[8px] font-black text-white/40 uppercase tracking-widest border border-white/5">
                        {sortedTransactions.length} Total Records
                    </span>
                </div>

                <div className="max-h-[450px] overflow-y-auto custom-scrollbar overflow-x-hidden relative">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-20 bg-[#0a0a0a] border-b border-white/5">
                            <tr>
                                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-white/30 italic">Description</th>
                                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-white/30 italic">Transaction Type</th>
                                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-white/30 italic text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {sortedTransactions.length > 0 ? (
                                sortedTransactions.map((tx, i) => (
                                    <tr key={tx._id || i} className={`hover:bg-white/[0.02] transition-all group ${tx.type === 'credit' ? 'bg-green-500/[0.01]' : ''}`}>
                                        <td className="px-8 py-5">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    {getTransactionIcon(tx.description)}
                                                    <p className="text-[11px] font-black uppercase italic text-white group-hover:text-[#7a6af6] transition-colors leading-tight">
                                                        {formatDescription(tx)}
                                                    </p>
                                                </div>
                                                <p className="text-[9px] font-bold text-white/20 uppercase flex items-center gap-1.5">
                                                    <Clock size={10} /> 
                                                    {new Date(tx.date).toLocaleDateString('en-GB', { 
                                                        day: '2-digit', month: 'short', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit' 
                                                    })}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-2.5 py-1 rounded-md text-[8px] font-black uppercase border transition-colors ${
                                                tx.type === 'credit' 
                                                ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                                : 'bg-red-50/5 text-white/60 border-white/10'
                                            }`}>
                                                {tx.type === 'credit' ? 'Credit (In)' : 'Debit (Out)'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <span className={`text-sm font-black italic tracking-tighter ${
                                                tx.type === 'credit' ? 'text-green-400' : 'text-white'
                                            }`}>
                                                {tx.type === 'credit' ? '+' : '-'} ₹{formatCurrency(tx.amount || 0)}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-20">
                                            <Receipt size={32} />
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">No transaction history found.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AddMoneyModal 
                isOpen={isAddMoneyOpen} 
                onClose={() => setIsAddMoneyOpen(false)} 
                currentBalance={wallet?.balance || 0} 
            />

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(122, 106, 246, 0.2); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(122, 106, 246, 0.5); }
            `}} />
        </div>
    );
};

export default WalletDashboard;