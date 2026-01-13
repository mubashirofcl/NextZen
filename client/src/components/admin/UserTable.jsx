import React from "react";
import {
    Ban,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Mail,
    User,
    Info,
} from "lucide-react";

const UserTable = ({
    users,
    loading,
    pagination,
    onPageChange,
    onBlock,
    onUnblock,
}) => {
    return (
        <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold border-b border-slate-100">
                            <th className="px-6 py-4">Customer Details</th>
                            <th className="px-6 py-4">Email Address</th>
                            <th className="px-6 py-4">Access Status</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr>
                                <td colSpan="4" className="py-24 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-6 h-6 border-2 border-slate-200 border-t-[#0F172A] rounded-full animate-spin" />
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Synchronizing...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="py-24 text-center">
                                    <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">No customer records found</p>
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user._id} className="group hover:bg-slate-50/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#0F172A] font-black text-xs border border-slate-200 group-hover:border-[#0F172A] transition-colors">
                                                {user.name?.charAt(0).toUpperCase() || <User size={14} />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-[#0F172A] uppercase tracking-tight leading-none mb-1">{user.name}</p>
                                                <p className="text-[9px] text-slate-400 font-medium tracking-widest">#{user._id?.slice(-6).toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                                            <Mail size={12} className="text-slate-300" />
                                            {user.email}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3 relative group/reason">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter border ${
                                                user.isBlocked ? "bg-red-50 text-red-600 border-red-100" : "bg-green-50 text-green-600 border-green-100"
                                            }`}>
                                                <div className={`w-1 h-1 rounded-full mr-1.5 ${user.isBlocked ? "bg-red-500" : "bg-green-500"}`} />
                                                {user.isBlocked ? "Restricted" : "Active Access"}
                                            </span>

                                            {user.isBlocked && user.blockReason && (
                                                <div className="flex items-center cursor-help text-slate-300 hover:text-red-500 transition-colors">
                                                    <Info size={14} />
                                                    
                                                    {/* NEAT REASON POPOVER */}
                                                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover/reason:block w-48 bg-[#0F172A] text-white p-3 rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-1">
                                                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#7a6af6] mb-1">Restriction Log</p>
                                                        <p className="text-[10px] font-medium leading-relaxed italic">"{user.blockReason}"</p>
                                                        <div className="absolute -bottom-1 left-4 w-2 h-2 bg-[#0F172A] rotate-45" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        {user.isBlocked ? (
                                            <button
                                                onClick={() => onUnblock(user._id)}
                                                className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-all active:scale-90"
                                                title="Restore Access"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => onBlock(user)}
                                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                                                title="Revoke Access"
                                            >
                                                <Ban size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* PAGINATION */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-white mt-auto">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Showing <span className="text-[#0F172A]">{users.length}</span> of <span className="text-[#0F172A]">{pagination.totalUsers || 0}</span>
                </p>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onPageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1 || loading}
                        className="p-2 bg-slate-50 text-slate-400 rounded-lg disabled:opacity-30 border border-slate-200 transition-all hover:bg-slate-100"
                    >
                        <ChevronLeft size={14} />
                    </button>

                    <div className="h-8 w-8 flex items-center justify-center bg-[#0F172A] rounded-lg shadow-md shadow-black/10">
                        <span className="text-[10px] font-black text-white">{pagination.currentPage}</span>
                    </div>

                    <button
                        onClick={() => onPageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.totalPages || loading}
                        className="p-2 bg-slate-50 text-slate-400 rounded-lg disabled:opacity-30 border border-slate-200 transition-all hover:bg-slate-100"
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserTable;