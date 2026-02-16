import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ChevronLeft, User, MapPin,
    Loader2, Box, Truck, Wallet,
    ArrowDownLeft, LayoutDashboard, RotateCcw,
    XCircle, CheckCircle2
} from "lucide-react";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { useAdminOrderDetails, useUpdateOrderStatus } from "../../hooks/admin/useAdminOrders";

const GlobalLoader = ({ message }) => (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-sm">
        <div className="bg-white px-8 py-6 rounded-xl shadow-xl flex flex-col items-center border border-slate-100">
            <Loader2 className="text-[#7a6af6] animate-spin mb-3" size={30} />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">{message}</p>
        </div>
    </div>
);

const AdminOrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: response, isLoading } = useAdminOrderDetails(id);
    const order = response?.data;
    const { mutate: updateOrderStatus, isPending: isUpdating } = useUpdateOrderStatus();

    const isPrepaid = ['razorpay', 'wallet'].includes(order?.paymentMethod);
    const itemStatusRank = { "Placed": 1, "Shipped": 2, "Delivered": 3, "Cancelled": 4, "Return Requested": 5, "Return Approved": 6, "Returned": 7 };
    const globalStatusRank = { "pending": 1, "confirmed": 2, "shipped": 3, "out_for_delivery": 4, "delivered": 5, "cancelled": 6, "payment_failed": 0 };

    const steps = ['Processing', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered'];
    const currentStepIndex = (() => {
        const s = order?.status?.toLowerCase();
        if (s === 'processing' || s === 'pending' || s === 'placed') return 0;
        if (s === 'confirmed') return 1;
        if (s === 'shipped') return 2;
        if (s === 'out_for_delivery') return 3;
        if (s === 'delivered') return 4;
        return -1;
    })();

    // 🟢 FIXED FINANCIALS: Persist all details even after cancellation
    const financials = useMemo(() => {
        if (!order) return { initialSubtotal: 0, delivery: 0, totalRefunded: 0, net: 0, savings: 0 };

        const masterSubtotal = order.subTotal || 0;
        const delivery = order.deliveryCharge || 0;
        const masterTotal = order.totalAmount || 0;
        const totalDiscount = order.totalDiscount || 0;

        // Check shipment status for shipping refund logic
        const isShippedOrBeyond = ['shipped', 'out_for_delivery', 'delivered', 'returned'].includes(order.status.toLowerCase());
        
        let refundedItemsTotal = 0;
        let cancelledItemsCount = 0;

        order.items.forEach(item => {
            if (['Cancelled', 'Returned'].includes(item.status)) {
                refundedItemsTotal += (item.totalAmount || 0);
                cancelledItemsCount++;
            }
        });

        const isFullyVoided = cancelledItemsCount === order.items.length;

        // Calculate refund based on shipping logic (No refund for shipping if already shipped)
        const finalRefundValue = (isFullyVoided && !isShippedOrBeyond) 
            ? (refundedItemsTotal + delivery) 
            : refundedItemsTotal;

        return {
            initialSubtotal: masterSubtotal,
            delivery: delivery,
            savings: totalDiscount,
            totalRefunded: finalRefundValue,
            // 🟢 FIXED: Always show the Master Total from DB for audit trail
            net: masterTotal 
        };
    }, [order]);

    if (isLoading) return <GlobalLoader message="Accessing Order Terminal..." />;

    const getFriendlyStatus = (status) => {
        const s = status?.toLowerCase();
        if (s === 'pending') return 'Processing';
        if (s === 'payment_failed') return 'Failed';
        return status?.replace(/_/g, ' ');
    };

    const getItemFinancialStatus = (item) => {
        const globalPayment = order?.paymentStatus?.toLowerCase() || 'pending';
        if (item.status === 'Returned') return { label: 'REFUNDED', color: 'text-green-600 bg-green-50 border-green-100' };
        if (item.status === 'Cancelled') return (isPrepaid && (globalPayment === 'paid' || globalPayment === 'refunded')) ? { label: 'REFUNDED', color: 'text-red-500 bg-red-100 border-red-200' } : { label: 'CANCELLED', color: 'text-slate-400 bg-slate-100 border-slate-200' };
        if (globalPayment === 'paid' || globalPayment === 'refunded') return { label: 'PAID', color: 'text-green-600 bg-green-50 border-green-100' };
        return { label: 'PENDING', color: 'text-amber-600 bg-amber-50 border-amber-100' };
    };

    return (
        <div className="h-screen w-full flex bg-[#f1f5f9] p-3 gap-3 font-sans text-slate-800 overflow-hidden">
            <AdminSidebar />
            {isUpdating && <GlobalLoader message="Updating Status..." />}

            <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden gap-4">

                <header className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 bg-slate-50 rounded-lg hover:bg-slate-100 border border-slate-100">
                            <ChevronLeft size={18} className="text-slate-600" />
                        </button>
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-tight text-slate-800 leading-none">Order Management</h2>
                            <p className="text-[9px] font-bold text-[#7a6af6] tracking-[0.2em] mt-2 uppercase">Order ID: {order?.orderNumber}</p>
                        </div>
                    </div>
                    <div className={`px-4 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest ${order?.status === 'payment_failed' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                        {getFriendlyStatus(order?.status)}
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start pb-10">

                        <div className="lg:col-span-8 space-y-4">
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10">
                                <h2 className="text-[10px] font-black uppercase text-[#7a6af6] italic tracking-[0.3em] mb-12 flex items-center gap-2">
                                    <Truck size={14} /> Tracking Status
                                </h2>
                                {['cancelled', 'payment_failed'].includes(order?.status?.toLowerCase()) ? (
                                    <div className="py-10 border-2 border-dashed border-red-100 rounded-3xl flex flex-col items-center justify-center gap-2 text-red-400">
                                        <XCircle size={32} />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Fulfillment Terminated</p>
                                    </div>
                                ) : (
                                    <div className="relative flex justify-between px-2 sm:px-10">
                                        <div className="absolute top-[17px] left-10 right-10 h-[1px] bg-slate-100 z-0" />
                                        <div
                                            className="absolute top-[17px] left-10 h-[1px] bg-[#7a6af6] z-0 transition-all duration-1000"
                                            style={{ width: `${currentStepIndex >= 0 ? (currentStepIndex / 4) * 100 : 0}%` }}
                                        />
                                        {steps.map((step, i) => (
                                            <div key={step} className="relative z-10 flex flex-col items-center gap-4">
                                                <div className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-700 ${i <= currentStepIndex ? 'bg-[#7a6af6] border-[#7a6af6]' : 'bg-white border-slate-200'}`}>
                                                    {i <= currentStepIndex ? <CheckCircle2 size={16} className="text-white" /> : <div className="w-1 h-1 rounded-full bg-slate-200" />}
                                                </div>
                                                <span className={`text-[7px] font-black uppercase tracking-widest ${i <= currentStepIndex ? 'text-slate-800' : 'text-slate-300'}`}>{step}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2">
                                    <Box size={14} className="text-[#7a6af6]" />
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-700">Product Details</h3>
                                </div>
                                <table className="w-full text-left">
                                    <thead className="text-[8px] font-black uppercase tracking-widest text-slate-400 border-b bg-white">
                                        <tr>
                                            <th className="px-6 py-3">Product</th>
                                            <th className="px-6 py-3">Item Status</th>
                                            <th className="px-6 py-3 text-center">Qty</th>
                                            <th className="px-6 py-3 text-right">Settlement</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 bg-white">
                                        {order?.items?.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/30 transition-all">
                                                <td className="px-6 py-4 flex items-center gap-3">
                                                    <div className="w-10 h-14 bg-slate-100 rounded-lg overflow-hidden border border-slate-100 shrink-0 shadow-sm">
                                                        <img src={item.variantId?.images?.[0] || item.productId?.thumbnail} className="w-full h-full object-cover" alt="" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-black text-slate-800 uppercase leading-tight mb-1">{item.productId?.name}</p>
                                                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[8px] font-black text-slate-500 uppercase tracking-tighter">Size: {item.size}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {item.status === 'Return Requested' ? (
                                                        <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3 w-[240px] shadow-sm">
                                                            <div className="flex items-center gap-2 mb-2 text-amber-700">
                                                                <RotateCcw size={12} strokeWidth={3} />
                                                                <p className="text-[9px] font-black uppercase tracking-widest">Return Requested</p>
                                                            </div>
                                                            <p className="text-[9px] font-bold text-slate-600 mb-3 italic">"{item.returnReason || "No reason provided"}"</p>
                                                            <div className="flex gap-2">
                                                                <button onClick={() => updateOrderStatus({ orderId: id, itemId: item._id, itemStatus: 'Return Approved' })} className="flex-1 py-1.5 bg-green-500 text-white rounded-lg text-[8px] font-black uppercase hover:bg-green-600 transition-colors shadow-sm">Approve</button>
                                                                <button onClick={() => updateOrderStatus({ orderId: id, itemId: item._id, itemStatus: 'Return Rejected' })} className="flex-1 py-1.5 bg-red-500 text-white rounded-lg text-[8px] font-black uppercase hover:bg-red-600 transition-colors shadow-sm">Reject</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <select
                                                            value={item.status}
                                                            disabled={['Delivered', 'Returned', 'Cancelled'].includes(item.status)}
                                                            onChange={(e) => updateOrderStatus({ orderId: id, itemId: item._id, itemStatus: e.target.value })}
                                                            className="text-[9px] font-black uppercase tracking-widest bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg outline-none cursor-pointer hover:bg-white disabled:opacity-50"
                                                        >
                                                            <option value="Placed" disabled={itemStatusRank[item.status] > 1}>Confirmed {itemStatusRank[item.status] > 1 && "✓"}</option>
                                                            <option value="Shipped" disabled={itemStatusRank[item.status] > 2}>Shipped {itemStatusRank[item.status] > 2 && "✓"}</option>
                                                            <option value="Delivered" disabled={itemStatusRank[item.status] > 3}>Delivered {itemStatusRank[item.status] > 3 && "✓"}</option>
                                                            <option value="Cancelled">Cancel Item</option>
                                                            {item.status === 'Return Approved' && <option value="Returned">Issue Refund</option>}
                                                        </select>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center text-[10px] font-black text-slate-500">{item.quantity} Qty</td>
                                                <td className="px-6 py-4 text-right">
                                                    <p className="text-[11px] font-black text-slate-800">₹{item.totalAmount?.toLocaleString()}</p>
                                                    <span className={`text-[7px] font-black px-1.5 py-0.5 rounded border uppercase mt-1 inline-block shadow-sm ${getItemFinancialStatus(item).color}`}>{getItemFinancialStatus(item).label}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600 border border-blue-100"><Truck size={16} /></div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-700 mt-0.5">Order Stage</h3>
                                </div>
                                <select
                                    value={order?.status}
                                    disabled={['cancelled', 'returned', 'delivered'].includes(order?.status?.toLowerCase())}
                                    onChange={(e) => updateOrderStatus({ orderId: id, globalStatus: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 text-[10px] font-black uppercase tracking-widest px-4 py-4 rounded-xl outline-none hover:bg-white disabled:opacity-50 shadow-sm"
                                >
                                    {steps.map((s, idx) => (
                                        <option key={s} value={s.toLowerCase().replace(/ /g, '_')} disabled={globalStatusRank[order?.status] > (idx + 1)}>
                                            {idx + 1}. {s} {globalStatusRank[order?.status] > (idx + 1) && "✓"}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 border border-indigo-100"><MapPin size={16} /></div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-700 mt-0.5">Shipping Address</h3>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-inner">
                                    <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight mb-1">{order?.addressId?.fullName}</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed tracking-tighter">
                                        {order?.addressId?.addressLine}, {order?.addressId?.city}, {order?.addressId?.state} — {order?.addressId?.pincode}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-4 lg:sticky lg:top-0 space-y-4">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                                <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                                    <Wallet size={16} className="text-[#7a6af6]" />
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Order Summary</h3>
                                </div>
                                <div className="space-y-4 text-[10px] font-bold uppercase text-slate-500 tracking-tight relative z-10">
                                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Payment Method</p>
                                        <p className="text-[10px] font-black text-slate-700 uppercase tracking-tighter italic">
                                            {order?.paymentMethod === 'cashOnDelivery' ? 'Cash/COD' : order?.paymentMethod === 'wallet' ? 'Wallet' : 'Razorpay'}
                                        </p>
                                    </div>
                                    <div className="pt-2 space-y-3">
                                        <div className="flex justify-between">
                                            <span>Original Subtotal</span>
                                            <span className="text-black">₹{financials.initialSubtotal.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-50 pb-3">
                                            <span>Shipping Fee</span>
                                            <span className="text-black">{financials.delivery > 0 ? `₹${financials.delivery}` : 'FREE'}</span>
                                        </div>

                                        {financials.savings > 0 && (
                                            <div className="text-[9px] text-green-600 font-black italic text-right">
                                                Informational Savings: ₹{financials.savings.toLocaleString()}
                                            </div>
                                        )}

                                        {financials.totalRefunded > 0 && (
                                            <div className="flex justify-between text-[9px] text-green-600 font-black uppercase bg-green-50 p-3 rounded-xl border border-green-100 shadow-sm">
                                                <span className="flex items-center gap-1.5"><ArrowDownLeft size={12} strokeWidth={3} /> Total Refunded</span>
                                                <span className="tracking-tighter">- ₹{financials.totalRefunded.toLocaleString()}</span>
                                            </div>
                                        )}

                                        <div className="pt-4 border-t border-dashed flex flex-col items-end">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                                                {financials.totalRefunded > 0 ? 'Settled Total' : 'Order Total'}
                                            </span>
                                            <span className="text-3xl font-black text-[#7a6af6] tracking-tighter italic leading-none">₹{financials.net.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                <div className="flex items-center gap-3 border-b border-slate-50 pb-3 text-slate-400">
                                    <User size={16} />
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Customer Details</h3>
                                </div>
                                <div>
                                    <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{order?.userId?.name}</p>
                                    <p className="text-[9px] font-bold text-slate-400 mt-1">{order?.userId?.email}</p>
                                </div>
                                <button onClick={() => navigate(`/admin/customers?search=${order?.userId?.email}`)} className="w-full py-3 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center gap-2 group shadow-sm">
                                    <LayoutDashboard size={12} /> View Profile
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminOrderDetail;