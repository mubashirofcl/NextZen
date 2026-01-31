import React, { useState, useDeferredValue } from "react";
import { Search, Filter, Users, UserCheck, ShieldAlert, List, Ban, CheckCircle } from "lucide-react";

import AdminSidebar from "../../components/admin/AdminSidebar";
import BlockModal from "../../components/admin/BlockUserModal";
import DataTable from "../../tables/admin/DataTable";
import { adminToast } from "../../utils/adminToast";
import { useAdminUsers, useBlockUser, useUnblockUser } from "../../hooks/admin/useAdminUsers";

const UserManagement = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState(null);

    const deferredSearch = useDeferredValue(searchTerm);

    const { data, isLoading: loading } = useAdminUsers({
        page,
        search: deferredSearch,
        status: statusFilter,
    });

    const users = data?.users ?? [];
    const pagination = {
        page: data?.currentPage || 1,
        pages: data?.totalPages || 1,
        total: data?.totalUsers || 0,
    };

    const blockMutation = useBlockUser();
    const unblockMutation = useUnblockUser();

    const handleUnblock = (userId) => {
        adminToast.confirm("Restore Access?", "Allow the customer to log in again.", () => {
            unblockMutation.mutate(userId, {
                onSuccess: () => adminToast.success("Access Restored Successfully"),
            });
        });
    };

    return (
        <div className="min-h-screen flex bg-[#f8fafc] p-3 gap-3 font-sans">
            <AdminSidebar />
            <main className="flex-1 flex flex-col gap-3 overflow-hidden">
                <header className="bg-white/80 backdrop-blur-md border border-white rounded-[20px] px-6 py-3 flex justify-between items-center shadow-sm">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        Admin / <span className="text-[#0F172A] font-black">Customers</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                placeholder="Search customers..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                className="pl-9 pr-8 py-2 bg-slate-100/50 focus:bg-white rounded-xl text-xs w-64 outline-none transition-all"
                            />
                        </div>
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                                className="appearance-none text-[10px] font-bold uppercase tracking-widest px-4 py-2 pr-8 rounded-xl bg-slate-100/50 outline-none cursor-pointer"
                            >
                                <option value="">All Access</option>
                                <option value="active">Active Only</option>
                                <option value="blocked">Restricted</option>
                            </select>
                            <Filter size={10} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-[#0F172A] flex items-center justify-center text-white shadow-lg"><Users size={16} /></div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <StatsCard title="Total Users" value={pagination.total} icon={<Users size={18} />} color="blue" />
                        <StatsCard title="Active Access" value={users.filter(u => !u.isBlocked).length} icon={<UserCheck size={18} />} color="green" />
                        <StatsCard title="Restricted" value={users.filter(u => u.isBlocked).length} icon={<ShieldAlert size={18} />} color="red" />
                    </div>

                    <div className="bg-white rounded-[20px] shadow-sm overflow-hidden">
                        <div className="p-5 border-b flex justify-between items-center">
                            <h2 className="text-xs font-black uppercase tracking-widest text-[#0F172A]">User Management List</h2>
                            <List size={16} className="text-slate-400" />
                        </div>

                        <DataTable
                            columns={["Customer Details", "Email Address", "Access Status", "Action"]}
                            data={users}
                            loading={loading}
                            pagination={pagination}
                            onPageChange={setPage}
                            emptyText="No customer records found"
                            renderRow={(user) => (
                                <tr key={user._id} className="group hover:bg-slate-50/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#0F172A] font-black text-xs border border-slate-200 group-hover:border-[#0F172A] transition-colors uppercase">{user.name?.charAt(0)}</div>
                                            <div>
                                                <p className="text-xs font-bold text-[#0F172A] uppercase tracking-tight leading-none mb-1">{user.name}</p>
                                                <p className="text-[9px] text-slate-400 font-medium tracking-widest uppercase">ID: {user._id?.slice(-6)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4"><p className="text-xs font-semibold text-slate-500">{user.email}</p></td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter border ${user.isBlocked ? "bg-red-50 text-red-600 border-red-100" : "bg-green-50 text-green-600 border-green-100"}`}>
                                            <div className={`w-1 h-1 rounded-full mr-1.5 ${user.isBlocked ? "bg-red-500" : "bg-green-500"}`} />
                                            {user.isBlocked ? "Restricted" : "Active Access"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {user.isBlocked ? (
                                            <button onClick={() => handleUnblock(user._id)} className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-all active:scale-90" title="Restore"><CheckCircle size={18} strokeWidth={2.5} /></button>
                                        ) : (
                                            <button onClick={() => setSelectedUser(user)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90" title="Revoke"><Ban size={18} strokeWidth={2.5} /></button>
                                        )}
                                    </td>
                                </tr>
                            )}
                        />
                    </div>
                </div>
            </main>

            {selectedUser && (
                <BlockModal
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                    onConfirm={(reason) => {
                        blockMutation.mutate({ userId: selectedUser._id, reason }, {
                            onSuccess: () => { adminToast.success("User Restricted"); setSelectedUser(null); },
                        });
                    }}
                />
            )}
        </div>
    );
};

const StatsCard = ({ title, value, icon, color }) => {
    const colors = { blue: "bg-blue-50 text-blue-600", green: "bg-green-50 text-green-600", red: "bg-red-50 text-red-600" };
    return (
        <div className="bg-white rounded-[20px] p-4 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>{icon}</div>
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
                    <p className="text-lg font-bold text-[#0F172A]">{value}</p>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;