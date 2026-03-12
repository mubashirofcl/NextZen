import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import {
    FileDown, FileSpreadsheet, Filter, ShoppingBag,
    Banknote, Tag, Percent, ArrowRight, Calendar, Loader2, TrendingUp,
    Truck,
    Box
} from 'lucide-react';
import { downloadPDF, downloadExcel } from '../../utils/reportGenerator';
import AdminSidebar from "../../components/admin/AdminSidebar";
import { getSalesReport } from '../../api/admin/admin.api';

const SalesReportPage = () => {
    const navigate = useNavigate();
    const [filter, setFilter] = useState('today');
    const [customDates, setCustomDates] = useState({ start: '', end: '' });

    const today = new Date().toISOString().split('T')[0];

    const { data: response, isLoading } = useQuery({
        queryKey: ['salesReport', filter, customDates],
        queryFn: async () => {
            const params = { range: filter };
            if (filter === 'custom') {
                if (!customDates.start || !customDates.end) return null;
                params.startDate = customDates.start;
                params.endDate = customDates.end;
            }
            const { data } = await getSalesReport(params);

            return data.data[0] || {
                salesCount: 0,
                totalOrderAmount: 0,
                productRevenue: 0,
                totalDeliveryFees: 0,
                productDiscount: 0,
                couponDiscount: 0,
                recentOrders: [],
                chartData: []
            };
        },
        placeholderData: (previousData) => previousData,
        enabled: filter !== 'custom' || (!!customDates.start && !!customDates.end)
    });

    const report = response || {
        salesCount: 0,
        totalOrderAmount: 0,
        productRevenue: 0,
        totalDeliveryFees: 0,
        productDiscount: 0,
        couponDiscount: 0,
        recentOrders: [],
        chartData: []
    };

    if (isLoading) return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-[#f1f5f9]">
            <Loader2 className="text-[#7a6af6] animate-spin mb-4" size={40} />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic">Syncing Ledger...</p>
        </div>
    );

    return (
        <div className="h-screen w-full flex bg-[#f1f5f9] p-3 gap-3 font-sans text-slate-800 overflow-hidden">
            <AdminSidebar />

            <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden gap-4">
                <header className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap justify-between items-center shadow-sm shrink-0 gap-4">
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-tight text-slate-800 leading-none italic">Sales Ledger</h2>
                        <p className="text-[9px] font-bold text-[#7a6af6] tracking-[0.2em] mt-2 uppercase">Financial Audit Module</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        {filter === 'custom' && (
                            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-right-2">
                                <input
                                    type="date"
                                    max={today}
                                    className="bg-transparent text-[9px] font-black uppercase p-1 outline-none cursor-pointer"
                                    onChange={(e) => setCustomDates(prev => ({ ...prev, start: e.target.value }))}
                                />
                                <span className="text-slate-300 font-bold">-</span>
                                <input
                                    type="date"
                                    max={today}
                                    className="bg-transparent text-[9px] font-black uppercase p-1 outline-none cursor-pointer"
                                    onChange={(e) => setCustomDates(prev => ({ ...prev, end: e.target.value }))}
                                />
                            </div>
                        )}

                        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
                            {['today', 'thisWeek', 'thisMonth', 'thisYear', 'custom'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-white text-[#7a6af6] shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {f === 'today' ? 'Today' : f === 'thisWeek' ? 'Weekly' : f === 'thisMonth' ? 'Monthly' : f === 'thisYear' ? 'Yearly' : 'Custom'}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 pb-10">

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <StatCard
                            title="Total Orders"
                            value={report.salesCount}
                            sub="Paid Transactions"
                            icon={<ShoppingBag size={18} />}
                            color="text-purple-600 bg-purple-50"
                        />
                        <StatCard
                            title="Product Sales"
                            value={report.productRevenue}
                            sub="Goods Revenue"
                            isPrice
                            icon={<Box size={18} />}
                            color="text-blue-600 bg-blue-50"
                        />
                        <StatCard
                            title="Shipping Fees"
                            value={report.totalDeliveryFees}
                            sub="Logistics Income"
                            isPrice
                            icon={<Truck size={18} />}
                            color="text-amber-600 bg-amber-50"
                        />
                        <StatCard
                            title="Net Revenue"
                            value={report.totalOrderAmount}
                            sub="Total Earnings"
                            isPrice
                            icon={<Banknote size={18} />}
                            color="text-green-600 bg-green-50"
                        />
                        <StatCard
                            title="Total Savings"
                            value={report.productDiscount + report.couponDiscount}
                            sub="Price Deductions"
                            isPrice
                            icon={<Tag size={18} />}
                            color="text-red-600 bg-red-50"
                        />
                    </div>

                    <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="flex justify-between items-center mb-10">
                            <h2 className="text-[10px] font-black uppercase text-[#7a6af6] italic tracking-[0.3em] flex items-center gap-2">
                                <TrendingUp size={14} /> Revenue Momentum
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => downloadExcel(report, filter)}
                                    className="p-2 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors text-slate-400"
                                    title="Export to Excel"
                                >
                                    <FileSpreadsheet size={16} />
                                </button>
                                <button
                                    onClick={() => downloadPDF(report, filter, customDates)}
                                    className="p-2 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors text-red-400"
                                    title="Download PDF Report"
                                >
                                    <FileDown size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={report.chartData}>
                                    <defs>
                                        <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#7a6af6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#7a6af6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '1rem' }}
                                        itemStyle={{ fontSize: '12px', fontWeight: '900', color: '#7a6af6' }}
                                        formatter={(value) => `₹${Number(value).toFixed(2)}`}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="amount"
                                        stroke="#7a6af6"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorAmt)"
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-700">Financial Audit Logs</h3>
                            <span className="text-[8px] font-black bg-slate-800 text-white px-3 py-1 rounded-full uppercase italic tracking-widest">Real-time</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[700px]">
                                <thead className="text-[8px] font-black uppercase tracking-widest text-slate-400 border-b bg-white">
                                    <tr>
                                        <th className="px-8 py-4">Receipt #</th>
                                        <th className="px-8 py-4">Customer</th>
                                        <th className="px-8 py-4">Settled Amount</th>
                                        <th className="px-8 py-4">Date</th>
                                        <th className="px-8 py-4 text-center">Status</th>
                                        <th className="px-8 py-4 text-right">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {report.recentOrders.length > 0 ? report.recentOrders.map((order) => (
                                        <tr key={order.mongoId} className="hover:bg-slate-50/50 transition-all group">
                                            <td className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-tighter italic">#{order.orderNumber}</td>
                                            <td className="px-8 py-5 text-[11px] font-black text-slate-800 uppercase tracking-tight">{order.customer}</td>
                                            <td className="px-8 py-5 text-[11px] font-black text-slate-900 tracking-tight italic">
                                                ₹{Number(order.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(order.date).toLocaleDateString()}</td>
                                            <td className="px-8 py-5 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter border ${order.status?.toLowerCase() === 'returned'
                                                    ? 'bg-red-50 text-red-600 border-red-100'
                                                    : order.status?.toLowerCase() === 'cancelled'
                                                        ? 'bg-slate-50 text-slate-400 border-slate-200'
                                                        : 'bg-green-50 text-green-600 border-green-100'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button
                                                    onClick={() => navigate(`/admin/orders/${order.mongoId}`)}
                                                    className="p-2 bg-slate-50 rounded-lg hover:bg-[#7a6af6] hover:text-white transition-all text-slate-400 border border-slate-100 shadow-sm"
                                                >
                                                    <ArrowRight size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="6" className="px-8 py-20 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] italic">No sales found for this period</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

const StatCard = ({ title, value, sub, icon, isPrice, color }) => (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group">
        <div className="flex justify-between items-start relative z-10">
            <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                <h3 className="text-xl font-black text-slate-800 tracking-tighter italic leading-tight">
                    {isPrice ? `₹${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value}
                </h3>
                <p className="text-[7px] font-black uppercase mt-1.5 flex items-center gap-1">
                    <span className="text-green-500 italic font-black">↗</span>
                    <span className="text-slate-400 tracking-widest">{sub}</span>
                </p>
            </div>
            <div className={`p-2.5 rounded-xl border border-slate-50 shadow-sm ${color}`}>{icon}</div>
        </div>
        <div className="absolute -bottom-2 -right-2 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
            {React.cloneElement(icon, { size: 100 })}
        </div>
    </div>
);

export default SalesReportPage;