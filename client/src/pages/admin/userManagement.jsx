import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Filter, Ban, Users, RefreshCcw, UserCheck, ShieldAlert } from 'lucide-react';

// Redux Actions
import { fetchUsersList, blockUserAction, unblockUserAction } from '../../store/admin/adminUserMgmtSlice';

// Components
import AdminSidebar from '../../components/admin/AdminSidebar';
import UserTable from '../../components/admin/UserTable';
import BlockModal from '../../components/admin/BlockUserModal';

const UserManagement = () => {
    const dispatch = useDispatch();

    // Select state with safe fallbacks
    const { users = [], pagination = {}, loading = false } = useSelector((state) => state.adminUserMgmt || {});
    const { admin } = useSelector((state) => state.adminAuth);

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);

    // Debounced search and fetch
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            const pageToFetch = pagination?.currentPage ?? 1;
            dispatch(fetchUsersList({ page: pageToFetch, search: searchTerm }));
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [dispatch, pagination?.currentPage, searchTerm]);

    const handlePageChange = (newPage) => {
        dispatch(fetchUsersList({ page: newPage, search: searchTerm }));
    };

    const handleUnblock = (userId) => {
        if (window.confirm("Confirm: Unblock this user and restore access?")) {
            dispatch(unblockUserAction(userId));
        }
    };

    return (
        <div className="min-h-screen flex bg-[#f8fafc] font-sans text-[#1e293b] p-3 gap-3">

            {/* REUSABLE SIDEBAR */}
            <AdminSidebar />

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col gap-3 overflow-hidden">

                {/* COMPACT HEADER */}
                <header className="bg-white/70 backdrop-blur-md border border-white rounded-[20px] px-6 py-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        <span>Admin</span>
                        <span>/</span>
                        <span className="text-[#0F172A]">Customers</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                placeholder="Search customers..."
                                className="pl-9 pr-4 py-1.5 bg-slate-100/50 border-transparent focus:bg-white focus:border-slate-200 rounded-lg text-xs outline-none transition-all w-64"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-bold text-[#0F172A] leading-none mb-1">{admin?.name || "Admin"}</p>
                                <p className="text-[9px] text-green-600 font-bold uppercase">Customer Lead</p>
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-[#0F172A] flex items-center justify-center text-white shadow-md">
                                <Users size={16} />
                            </div>
                        </div>
                    </div>
                </header>

                {/* SCROLLABLE CONTENT */}
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">

                    {/* MINI STATS GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <StatsCard
                            title="Total Users"
                            value={pagination?.totalUsers || 0}
                            icon={<Users size={18} />}
                            color="blue"
                        />
                        <StatsCard
                            title="Active Access"
                            value={users.filter(u => !u.isBlocked).length}
                            icon={<UserCheck size={18} />}
                            color="green"
                        />
                        <StatsCard
                            title="Restricted"
                            value={users.filter(u => u.isBlocked).length}
                            icon={<ShieldAlert size={18} />}
                            color="red"
                        />
                    </div>

                    {/* TABLE CONTAINER */}
                    <div className="bg-white border border-slate-100 rounded-[20px] shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-50 flex justify-between items-center">
                            <h2 className="text-xs font-black uppercase tracking-widest text-[#0F172A]">User Management List</h2>
                            <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
                                <Filter size={16} />
                            </button>
                        </div>

                        <div className="p-2">
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
                </div>
            </main>

            {/* BLOCK MODAL */}
            {selectedUser && (
                <BlockModal
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                    onConfirm={(reason) => {
                        dispatch(blockUserAction({ userId: selectedUser._id, reason }));
                        setSelectedUser(null);
                    }}
                />
            )}
        </div>
    );
};

// COMPACT STATS CARD (Matching Dashboard)
const StatsCard = ({ title, value, icon, color }) => {
    const colors = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-green-50 text-green-600",
        red: "bg-red-50 text-red-600",
    };
    return (
        <div className="bg-white border border-slate-100 rounded-[20px] p-4 shadow-sm">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
                    <p className="text-lg font-bold text-[#0F172A]">{value}</p>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;