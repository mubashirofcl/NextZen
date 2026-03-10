import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import {
    ShoppingBag, Banknote, Users, Package,
    Clock, AlertCircle, TrendingUp, ChevronRight, Loader2,
    Medal, BarChart3, Star, ShieldCheck
} from 'lucide-react';
import AdminSidebar from "../../components/admin/AdminSidebar";
import { getDashboardStats } from "../../api/admin/admin.api";

const COLORS = {
    delivered: '#22c55e',
    pending: '#eab308',
    cancelled: '#eb2525',
    shipped: '#a855f7',
    out_for_delivery: '#3b82f6',
    confirmed: '#2563eb',
    returned: '#64748b',
    'Return Requested': '#f43f5e',
    'return_pending': '#f43f5e'
};

const AdminDashboard = () => {
    const navigate = useNavigate();

    const { data: response, isLoading, isError } = useQuery({
        queryKey: ['dashboardStats'],
        queryFn: async () => {
            const result = await getDashboardStats();
            return result.data;
        },
        retry: false,
    });

    const stats = response || {
        totals: { totalRevenue: 0, totalOrders: 0 },
        statusDistribution: [],
        recentOrders: [],
        returnRequests: [],
        topProducts: [],
        topBrands: []
    };

    if (isLoading) return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-[#F8FAFC]">
            <div className="relative flex items-center justify-center mb-4">
                <div className="absolute w-16 h-16 border-4 border-[#7a6af6]/20 border-t-[#7a6af6] rounded-full animate-spin"></div>
                <Loader2 className="text-[#7a6af6] animate-pulse" size={32} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic animate-pulse">Syncing NextZen Core...</p>
        </div>
    );

    if (isError) return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-[#F8FAFC]">
            <AlertCircle className="text-red-400 mb-2" size={32} />
            <p className="text-[10px] font-black uppercase text-slate-400">Ledger Connection Failed</p>
            <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#7a6af6] transition-all">Retry Handshake</button>
        </div>
    );

    return (
        <div className="h-screen w-full flex bg-[#f8fafc] p-3 gap-3 font-sans text-slate-800 overflow-hidden">
            <AdminSidebar />

            <main className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 pb-10">

                <header className="w-full bg-white border border-slate-100 px-6 py-4 rounded-2xl shadow-sm flex justify-between items-center animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                            <ShieldCheck size={18} className="text-[#7a6af6]" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">
                                Command <span className="text-[#7a6af6]">Center</span>
                            </h2>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">
                                System Status: <span className="text-green-500">Operational</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 pl-3 pr-2 py-1.5 rounded-full border border-slate-100">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">SUPER ADMIN</span>
                        <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in zoom-in-95 duration-700 delay-100">
                    <StatCard 
                        title="Total Revenue" 
                        value={`₹${Number(stats.totals?.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                        icon={<Banknote className="text-green-600" />} 
                        color="bg-green-50" 
                        trend="Gross platform volume" 
                    />
                    <StatCard title="Total Orders" value={stats.totals?.totalOrders || 0} icon={<ShoppingBag className="text-blue-600" />} color="bg-blue-50" trend="Fulfilled transactions" />
                    <StatCard title="Active Users" value="32" icon={<Users className="text-purple-600" />} color="bg-purple-50" trend="Registered accounts" />
                    <StatCard title="Listed Products" value="16" icon={<Package className="text-orange-600" />} color="bg-orange-50" trend="Active inventory" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
                    <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-transform hover:scale-[1.01]">
                        <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-6 italic">
                            <Clock size={14} className="text-blue-500" /> Logistics Distribution
                        </h3>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.statusDistribution || []}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="count"
                                        nameKey="_id"
                                        animationBegin={200}
                                        animationDuration={1500}
                                    >
                                        {(stats.statusDistribution || []).map((entry) => (
                                            <Cell key={entry._id} fill={COLORS[entry._id] || '#cbd5e1'} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: '900' }} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col max-h-[350px]">
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 italic">
                                <AlertCircle size={14} className="text-red-500" /> Pending Returns
                            </h3>
                            <span className="bg-red-100 text-red-600 text-[9px] px-3 py-1 rounded-full font-black italic uppercase tracking-wider">
                                {stats.returnRequests?.length || 0} Open Tickets
                            </span>
                        </div>
                        <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                            {(stats.returnRequests || []).length > 0 ? (
                                stats.returnRequests.map((req, i) => (
                                    <div
                                        key={req.mongoId}
                                        className="p-4 bg-red-50/30 rounded-xl border border-red-50 flex justify-between items-center group hover:bg-red-50 transition-all animate-in slide-in-from-right-4 duration-500"
                                        style={{ animationDelay: `${i * 100}ms` }}
                                    >
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 italic uppercase">#{req.orderId} • {req.customer}</p>
                                            <p className="text-xs font-black text-slate-800 italic uppercase">{req.productName}</p>
                                            <p className="text-[9px] text-red-500 font-bold uppercase tracking-tight italic">Reason: {req.reason}</p>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/admin/orders/${req.orderId}`)}
                                            className="text-[10px] font-black uppercase text-slate-400 group-hover:text-red-500 flex items-center gap-1 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm"
                                        >
                                            Review <ChevronRight size={12} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center py-10 text-slate-300">
                                    <Star size={24} className="mb-2 opacity-20" />
                                    <p className="text-center text-[10px] font-black uppercase tracking-widest italic opacity-50">Clear Registry: No Pending Tasks</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-[400px]">
                        <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-6 italic shrink-0">
                            <Medal size={14} className="text-yellow-500" /> Best Performing Stock
                        </h3>
                        <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                            {(stats.topProducts || []).map((product, index) => (
                                <div key={product._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <span className="text-[10px] font-black text-slate-200 group-hover:text-[#7a6af6] w-4">0{index + 1}</span>
                                        <img src={product.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-50 shadow-sm transition-transform group-hover:scale-105" />
                                        <div>
                                            <p className="text-[11px] font-black uppercase italic leading-none text-slate-800">{product.name}</p>
                                            <p className="text-[9px] font-bold text-slate-400 mt-1.5 uppercase tracking-tighter italic">{product.totalSold} Units Dispatched</p>
                                        </div>
                                    </div>
                                    <p className="text-xs font-black text-[#7a6af6] italic">₹{Number(product.revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </div>
                            ))}
                            {(stats.topProducts || []).length === 0 && <p className="text-center py-20 text-[10px] font-black text-slate-300 uppercase italic">No sales activity recorded</p>}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-[400px]">
                        <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-6 italic shrink-0">
                            <BarChart3 size={14} className="text-[#7a6af6]" /> Brand Analytics
                        </h3>
                        <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
                            {(stats.topBrands || []).map((brand, index) => (
                                <div key={index} className="space-y-2.5">
                                    <div className="flex justify-between items-end px-1">
                                        <span className="text-[10px] font-black uppercase italic text-slate-700 tracking-tight">{brand._id || "Generic"}</span>
                                        <span className="text-[9px] font-black text-slate-400 uppercase italic">{brand.salesCount} Sales</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                        <div
                                            className="h-full bg-gradient-to-r from-[#7a6af6] to-[#9a8ff8] rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${(brand.salesCount / (stats.topBrands[0]?.salesCount || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                            {(stats.topBrands || []).length === 0 && <p className="text-center py-20 text-[10px] font-black text-slate-300 uppercase italic">Awaiting brand data</p>}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-400 italic">
                    <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/20 flex justify-between items-center">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-700">Audit Log: Recent Transactions</h3>
                        <button onClick={() => navigate('/admin/orders')} className="text-[8px] font-black uppercase text-[#7a6af6] hover:underline tracking-[0.2em] border border-[#7a6af6]/20 px-3 py-1 rounded-full">Archive View</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[600px]">
                            <thead className="bg-slate-50/50 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                                <tr>
                                    <th className="px-8 py-4">Receipt #</th>
                                    <th className="px-8 py-4">Customer</th>
                                    <th className="px-8 py-4 text-right">Settlement</th>
                                    <th className="px-8 py-4 text-center">Protocol Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {(stats.recentOrders || []).map((order) => (
                                    <tr key={order.orderId} className="text-xs hover:bg-slate-50/30 transition-all group">
                                        <td className="px-8 py-4 font-black text-slate-400 uppercase tracking-tighter">#{order.orderId}</td>
                                        <td className="px-8 py-4 font-black text-slate-800 uppercase tracking-tight">{order.customer}</td>
                                        <td className="px-8 py-4 font-black text-[#0f172a] text-right tracking-tight">₹{Number(order.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className="px-8 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border shadow-sm ${order.status === 'pending' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                                    order.status === 'delivered' ? 'bg-green-50 text-green-600 border-green-100' :
                                                        'bg-slate-50 text-slate-400 border-slate-100'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

const StatCard = ({ title, value, icon, color, trend }) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm group hover:shadow-md transition-all relative overflow-hidden">
        <div className="flex justify-between items-start mb-4 relative z-10">
            <div className={`p-2.5 rounded-xl ${color} shadow-sm group-hover:scale-110 transition-transform duration-500`}>{icon}</div>
            <TrendingUp className="text-slate-200 group-hover:text-[#7a6af6] transition-colors" size={16} />
        </div>
        <div className="relative z-10">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic leading-none">{title}</p>
            <h3 className="text-2xl font-black text-slate-900 mt-2 mb-1 italic tracking-tighter leading-none">{value}</h3>
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tight italic leading-none mt-1">{trend}</p>
        </div>
        <div className="absolute -right-4 -bottom-4 w-12 h-12 bg-slate-50 rounded-full opacity-0 group-hover:opacity-100 group-hover:scale-[3] transition-all duration-700 pointer-events-none"></div>
    </div>
);

export default AdminDashboard;