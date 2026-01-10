import React from "react";
import { useSelector } from "react-redux";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { Search, User, Wallet, ShoppingBag, Users, Package, ArrowUpRight, TrendingUp } from "lucide-react";

const AdminDashboard = () => {
    const { admin } = useSelector((state) => state.adminAuth);

    const statsData = [
        { title: "Total Revenue", value: "₹4,58,900", icon: <Wallet size={18} />, color: "blue", trend: "+12.5%" },
        { title: "Total Orders", value: "1,248", icon: <ShoppingBag size={18} />, color: "green", trend: "+8.2%" },
        { title: "Active Users", value: "8,942", icon: <Users size={18} />, color: "purple", trend: "+14.1%" },
        { title: "Product Stock", value: "482", icon: <Package size={18} />, color: "orange", trend: "12 Low Stock" },
    ];

    const recentOrders = [
        { id: "#ORD-7421", customer: "Rahul Sharma", product: "Oversized Black Tee", amount: "₹1,299", status: "Delivered" },
        { id: "#ORD-7422", customer: "Sneha Kapoor", product: "Vintage Hoodie", amount: "₹2,499", status: "Processing" },
        { id: "#ORD-7423", customer: "Amit Patel", product: "Slim Fit Chinos", amount: "₹1,899", status: "Shipped" },
        { id: "#ORD-7424", customer: "Priya Nair", product: "Cargo Joggers", amount: "₹2,199", status: "Pending" },
        { id: "#ORD-7425", customer: "Vikram Singh", product: "Denim Jacket", amount: "₹3,299", status: "Cancelled" },
    ];

    const topCategories = [
        { name: "Oversized T-Shirts", sales: "₹1,45,000", share: 45 },
        { name: "Hoodies & Sweats", sales: "₹98,000", share: 30 },
        { name: "Accessories", sales: "₹42,000", share: 15 },
        { name: "Bottomwear", sales: "₹28,000", share: 10 },
    ];

    return (
        <div className="min-h-screen flex bg-[#f8fafc] font-sans text-[#1e293b] p-3 gap-3">
            <AdminSidebar />

            <main className="flex-1 flex flex-col gap-3 overflow-hidden">
                {/* COMPACT HEADER */}
                <header className="bg-white/70 backdrop-blur-md border border-white rounded-[20px] px-6 py-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        <span>Admin</span>
                        <span>/</span>
                        <span className="text-[#0F172A] font-black">Dashboard</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                placeholder="Search analytics..."
                                className="pl-9 pr-4 py-1.5 bg-slate-100/50 border-transparent focus:bg-white focus:border-slate-200 rounded-lg text-xs outline-none transition-all w-48"
                            />
                        </div>
                        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-bold text-[#0F172A] leading-none mb-1">{admin?.name || "Admin"}</p>
                                <p className="text-[9px] text-green-600 font-bold uppercase tracking-tighter">Active Now</p>
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-[#0F172A] flex items-center justify-center text-white shadow-md">
                                <User size={16} />
                            </div>
                        </div>
                    </div>
                </header>

                {/* SCROLLABLE CONTENT */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                    
                    {/* STATS CARDS GRID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {statsData.map((stat, i) => (
                            <div key={i} className="bg-white border border-slate-100 rounded-[22px] p-4 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center 
                                        ${stat.color === 'blue' ? 'bg-blue-50 text-blue-600' : 
                                          stat.color === 'green' ? 'bg-green-50 text-green-600' : 
                                          stat.color === 'purple' ? 'bg-purple-50 text-purple-600' : 'bg-orange-50 text-orange-600'}`}>
                                        {stat.icon}
                                    </div>
                                    <div className="flex items-center text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                                        <TrendingUp size={10} className="mr-1" /> {stat.trend}
                                    </div>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.title}</p>
                                <p className="text-xl font-black text-[#0F172A] tracking-tight">{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                        {/* RECENT TRANSACTIONS POD */}
                        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[24px] shadow-sm p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xs font-black uppercase tracking-widest text-[#0F172A]">Recent Transactions</h2>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Latest user activity</p>
                                </div>
                                <button className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-1">
                                    Full Report <ArrowUpRight size={12}/>
                                </button>
                            </div>

                            <div className="space-y-4">
                                {recentOrders.map((order) => (
                                    <div key={order.id} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0 group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[9px] font-black text-slate-400 group-hover:bg-[#0F172A] group-hover:text-white transition-colors">
                                                {order.id.split('-')[1]}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-[#0F172A] uppercase tracking-tight">{order.customer}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">{order.product}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-[#0F172A] mb-1">{order.amount}</p>
                                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter border ${
                                                order.status === 'Delivered' ? 'bg-green-50 text-green-600 border-green-100' : 
                                                order.status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-100' : 
                                                'bg-orange-50 text-orange-600 border-orange-100'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CATEGORY SHARE POD */}
                        <div className="bg-white border border-slate-100 rounded-[24px] shadow-sm p-6 flex flex-col">
                            <h2 className="text-xs font-black uppercase tracking-widest text-[#0F172A] mb-1">Sales by Category</h2>
                            <p className="text-[9px] text-slate-400 font-bold uppercase mb-6">Market Distribution</p>
                            
                            <div className="flex-1 space-y-5">
                                {topCategories.map((cat, i) => (
                                    <div key={i} className="group">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{cat.name}</span>
                                            <span className="text-[10px] font-black text-[#0F172A]">{cat.share}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-1000 bg-[#0F172A]`} 
                                                style={{ width: `${cat.share}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[9px] text-slate-400 font-bold uppercase leading-relaxed">
                                    Categories are performing <span className="text-green-600">14% better</span> than last month.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;