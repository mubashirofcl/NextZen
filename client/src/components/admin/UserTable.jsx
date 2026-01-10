import React from 'react';
import { Ban, CheckCircle, ChevronLeft, ChevronRight, Mail, User } from 'lucide-react';

const UserTable = ({ users, loading, pagination, onPageChange, onBlock, onUnblock }) => {
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
                                        <div className="w-8 h-8 border-2 border-slate-200 border-t-[#0F172A] rounded-full animate-spin"></div>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Fetching Records...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="py-24 text-center">
                                    <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">No matching customers found</p>
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user._id} className="group hover:bg-slate-50/30 transition-colors">
                                    <td className="px-6 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-[#0F172A] font-black text-xs border border-slate-200 group-hover:border-[#0F172A] transition-colors">
                                                {user.name?.charAt(0) || <User size={14}/>}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-[#0F172A] uppercase tracking-tight leading-none mb-1">{user.name}</p>
                                                <p className="text-[9px] text-slate-400 font-medium">ID: {user._id?.slice(-8).toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                                            <Mail size={12} className="text-slate-300" />
                                            {user.email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <div className="flex items-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-tighter ${
                                                user.isBlocked 
                                                ? 'bg-red-50 text-red-600 border border-red-100' 
                                                : 'bg-green-50 text-green-600 border border-green-100'
                                            }`}>
                                                <div className={`w-1 h-1 rounded-full mr-1.5 ${user.isBlocked ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                                {user.isBlocked ? 'Restricted' : 'Active Access'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3.5 text-right">
                                        {user.isBlocked ? (
                                            <button
                                                onClick={() => onUnblock(user._id)}
                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all active:scale-90"
                                                title="Restore Access"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => onBlock(user)}
                                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all active:scale-90"
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

            <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-white">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Showing <span className="text-[#0F172A]">{users.length}</span> of <span className="text-[#0F172A]">{pagination.totalUsers || 0}</span> Customers
                </p>
                
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onPageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1 || loading}
                        className="p-2 text-slate-400 bg-slate-50 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-all border border-slate-200"
                    >
                        <ChevronLeft size={14} />
                    </button>
                    
                    <div className="px-3 py-1 bg-[#0F172A] rounded-lg shadow-md">
                        <span className="text-[10px] font-black text-white">{pagination.currentPage}</span>
                    </div>

                    <button
                        onClick={() => onPageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.totalPages || loading}
                        className="p-2 text-slate-400 bg-slate-50 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-all border border-slate-200"
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserTable;