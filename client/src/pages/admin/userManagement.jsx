import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Search, Filter, Users, UserCheck, ShieldAlert, List } from "lucide-react";

import AdminSidebar from "../../components/admin/AdminSidebar";
import UserTable from "../../components/admin/UserTable";
import BlockModal from "../../components/admin/BlockUserModal";
import { adminToast } from "../../utils/adminToast";

import {
    useAdminUsers,
    useBlockUser,
    useUnblockUser,
} from "../../hooks/admin/useAdminUsers";

const UserManagement = () => {

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState(null);
    const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 400);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data, isLoading } = useAdminUsers({
        page,
        search: debouncedSearch,
        status: statusFilter,
    });

    const users = data?.users ?? [];
    const pagination = data ?? {};
    const loading = isLoading;

    const blockMutation = useBlockUser();
    const unblockMutation = useUnblockUser();

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    const handleUnblock = (userId) => {
        adminToast.confirm(
            "Restore Access?",
            "This will allow the customer to log in again.",
            () => {
                unblockMutation.mutate(userId, {
                    onSuccess: () => adminToast.success("Access Restored SuccessFully"),
                    onError: () => adminToast.warn("Update Failed"),
                });
            }
        );
    };

    return (
        <div className="min-h-screen flex bg-[#f8fafc] p-3 gap-3">
            <AdminSidebar />

            <main className="flex-1 flex flex-col gap-3 overflow-hidden">
                {/* HEADER */}
                <header className="bg-white/80 backdrop-blur-md border border-white rounded-[20px] px-6 py-3 flex justify-between items-center shadow-sm">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        Admin / <span className="text-[#0F172A] font-black">Customers</span>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* SEARCH */}
                        <div className="relative group">
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#7a6af6]"
                                size={14}
                            />
                            <input
                                type="text"
                                placeholder="Search customers..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setPage(1);
                                }}
                                className="pl-9 pr-8 py-2 bg-slate-100/50 focus:bg-white rounded-xl text-xs w-64 outline-none transition-all"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => {
                                        setSearchTerm("");
                                        setPage(1);
                                    }}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-slate-200 rounded-lg text-[10px]"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* FILTER */}
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setPage(1);
                                }}
                                className="appearance-none text-[10px] font-bold uppercase tracking-widest px-4 py-2 pr-8 rounded-xl bg-slate-100/50"
                            >
                                <option value="">All Access</option>
                                <option value="active">Active Only</option>
                                <option value="blocked">Restricted</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <Filter size={10} />
                            </div>
                        </div>

                        <div className="w-9 h-9 rounded-xl bg-[#0F172A] flex items-center justify-center text-white">
                            <Users size={16} />
                        </div>
                    </div>
                </header>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto space-y-3">
                    {/* STATS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <StatsCard
                            title="Total Users"
                            value={pagination.totalUsers || 0}
                            icon={<Users size={18} />}
                            color="blue"
                        />
                        <StatsCard
                            title="Active Access"
                            value={users.filter((u) => !u.isBlocked).length}
                            icon={<UserCheck size={18} />}
                            color="green"
                        />
                        <StatsCard
                            title="Restricted"
                            value={users.filter((u) => u.isBlocked).length}
                            icon={<ShieldAlert size={18} />}
                            color="red"
                        />
                    </div>

                    {/* TABLE */}
                    <div className="bg-white rounded-[20px] shadow-sm overflow-hidden">
                        <div className="p-5 border-b flex justify-between">
                            <h2 className="text-xs font-black uppercase tracking-widest">
                                User Management List
                            </h2>
                            <List size={16} className="text-slate-400" />
                        </div>

                        <UserTable
                            users={users}
                            loading={loading}
                            pagination={pagination}
                            onPageChange={handlePageChange}
                            onBlock={(user) => setSelectedUser(user)}
                            onUnblock={handleUnblock}
                        />
                    </div>
                </div>
            </main>

            {/* BLOCK MODAL */}
            {selectedUser && (
                <BlockModal
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                    onConfirm={(reason) => {
                        blockMutation.mutate(
                            { userId: selectedUser._id, reason },
                            {
                                onSuccess: () => {
                                    adminToast.success("User Restricted");
                                    setSelectedUser(null);
                                },
                                onError: () => adminToast.warn("Action Failed"),
                            }
                        );
                    }}
                />
            )}
        </div>
    );
};

const StatsCard = ({ title, value, icon, color }) => {
    const colors = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-green-50 text-green-600",
        red: "bg-red-50 text-red-600",
    };

    return (
        <div className="bg-white rounded-[20px] p-4">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {title}
                    </p>
                    <p className="text-lg font-bold">{value}</p>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
