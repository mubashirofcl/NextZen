import React, { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ChevronLeft, Save, Loader2, Ticket,
    ClipboardList, Calendar, Settings2, ShieldCheck, Info
} from "lucide-react";
import { useForm } from "react-hook-form";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { useCoupons } from "../../hooks/admin/useCoupons";

const GlobalLoader = ({ message }) => (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/70 backdrop-blur-md cursor-wait">
        <div className="bg-white p-8 rounded-[24px] shadow-2xl flex flex-col items-center border border-slate-100 animate-in zoom-in duration-200">
            <Loader2 className="text-[#7a6af6] animate-spin mb-4" size={36} />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0F172A]">{message}</p>
        </div>
    </div>
);

const ErrorMsg = ({ message }) => (
    <p className="text-[9px] font-bold text-red-500 uppercase mt-1 ml-1 animate-in fade-in slide-in-from-top-1 flex items-center gap-1">
        <Info size={10} /> {message}
    </p>
);

const CouponForm = () => {
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const navigate = useNavigate();
    const { createCoupon, updateCoupon, couponDetail, isLoadingDetail, isPending } = useCoupons(id);

    const isInitialized = useRef(false);
    const todayStr = new Date().toISOString().split('T')[0];

    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
        mode: "onBlur",
        defaultValues: {
            code: "",
            discountType: "PERCENT",
            discountValue: "",
            description: "",
            maxDiscount: "",
            minPurchaseAmt: "",
            usageLimit: "",
            usagePerUser: 1,
            isActive: true,
            startDate: todayStr,
            endDate: ""
        }
    });

    const discountType = watch("discountType");
    const startDate = watch("startDate");

    useEffect(() => {
        if (isEditMode && couponDetail && !isInitialized.current) {
            reset({
                ...couponDetail,
                startDate: couponDetail.startDate?.split('T')[0],
                endDate: couponDetail.endDate?.split('T')[0]
            });
            isInitialized.current = true;
        }
    }, [couponDetail, isEditMode, reset]);

    const onFormSubmit = async (data) => {
        const payload = {
            ...data,
            code: data.code.toUpperCase().trim(),
            discountValue: Number(data.discountValue),
            maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : null,
            minPurchaseAmt: Number(data.minPurchaseAmt),
            usageLimit: Number(data.usageLimit),
            usagePerUser: Number(data.usagePerUser)
        };

        if (id) {
            await updateCoupon({ id, data: payload });
        } else {
            await createCoupon(payload);
        }
    };

    return (
        <div className="min-h-screen flex bg-[#f1f5f9] p-2 gap-2 items-start font-sans relative">
            {(isPending || (isEditMode && isLoadingDetail)) && (
                <GlobalLoader message={isEditMode ? "Updating voucher records..." : "Creating your new promotion..."} />
            )}

            <AdminSidebar />

            <main className={`flex-1 flex flex-col gap-2 h-[calc(100vh-16px)] transition-all ${isPending ? 'blur-sm pointer-events-none' : ''}`}>
                <header className="bg-white border rounded-[16px] px-6 py-3 flex justify-between items-center shadow-sm shrink-0">
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={() => navigate(-1)} className="p-1.5 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all">
                            <ChevronLeft size={18} />
                        </button>
                        <div>
                            <h2 className="text-[12px] font-black uppercase tracking-tight text-[#0F172A]">Promotion Forge</h2>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{id ? 'Modifying active voucher' : 'Creating new store incentive'}</p>
                        </div>
                    </div>
                    <button onClick={handleSubmit(onFormSubmit)} className="bg-[#0F172A] text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#7a6af6] transition-all">
                        {isPending ? <Loader2 className="animate-spin" size={12} /> : <Save size={12} />}
                        {isEditMode ? "Save Changes" : "Activate Coupon"}
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                    <form className="space-y-3 pb-8" onSubmit={(e) => e.preventDefault()}>

                        <div className="bg-white rounded-[20px] p-6 border shadow-sm">
                            <div className="flex items-center gap-2 mb-5 border-b pb-3 text-[#7a6af6]">
                                <ClipboardList size={16} />
                                <h3 className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Promotion Identity</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Internal Description (Label) *</label>
                                    <input 
                                        {...register("description", { 
                                            required: "Please enter a description for this offer",
                                            maxLength: { value: 50, message: "Description is too long (max 50 characters)" },
                                            validate: value => value.trim().length >= 5 || "Description must be at least 5 characters long"
                                        })} 
                                        placeholder="e.g. Summer Flash Sale 2026" 
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-[12px] px-4 py-2.5 text-[11px] font-bold text-[#0F172A] outline-none focus:border-[#7a6af6] transition-all" 
                                    />
                                    {errors.description && <ErrorMsg message={errors.description.message} />}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Customer Promo Code *</label>
                                    <input 
                                        {...register("code", { 
                                            required: "A unique promo code is required", 
                                            minLength: { value: 3, message: "The code must be at least 3 characters" },
                                            maxLength: { value: 12, message: "The code must not exceed 12 characters" },
                                            pattern: { value: /^[A-Z0-9]+$/i, message: "Only letters and numbers are allowed" }
                                        })} 
                                        placeholder="e.g. SUMMER50" 
                                        className="w-full bg-white border-2 border-slate-100 rounded-[12px] px-4 py-2.5 text-[11px] font-bold text-[#0F172A] uppercase outline-none focus:border-[#7a6af6] transition-all" 
                                    />
                                    {errors.code && <ErrorMsg message={errors.code.message} />}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[20px] p-6 border shadow-sm">
                            <div className="flex items-center gap-2 mb-5 border-b pb-3 text-[#7a6af6]">
                                <Settings2 size={16} />
                                <h3 className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Incentive Rules</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Discount Type</label>
                                    <select {...register("discountType")} className="w-full bg-white border-2 border-slate-100 rounded-[12px] px-3 py-2.5 text-[11px] font-bold text-[#0F172A] outline-none cursor-pointer">
                                        <option value="PERCENT">Percentage (%)</option>
                                        <option value="FLAT">Flat Amount (₹)</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Value ({discountType === 'PERCENT' ? '%' : '₹'}) *</label>
                                    <input 
                                        type="number" 
                                        {...register("discountValue", { 
                                            required: "Please specify the discount amount", 
                                            min: { value: 1, message: "Minimum value is 1" }, 
                                            max: discountType === 'PERCENT' ? { value: 80, message: "Maximum discount is 80%" } : { value: 5000, message: "Maximum flat discount is ₹5000" }
                                        })} 
                                        placeholder="e.g. 15"
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-[12px] px-4 py-2.5 text-[11px] font-bold outline-none focus:border-[#7a6af6]" 
                                    />
                                    {errors.discountValue && <ErrorMsg message={errors.discountValue.message} />}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Max Savings Cap (₹)</label>
                                    <input 
                                        type="number" 
                                        {...register("maxDiscount", {
                                            min: { value: 1, message: "Must be at least ₹1" },
                                            max: { value: 10000, message: "Savings cap cannot exceed ₹10000" }
                                        })} 
                                        disabled={discountType === 'FLAT'} 
                                        placeholder={discountType === 'FLAT' ? 'Not needed for flat discount' : 'e.g. 500'} 
                                        className="w-full bg-white border-2 border-slate-100 rounded-[12px] px-4 py-2.5 text-[11px] font-bold disabled:bg-slate-50 disabled:text-slate-300 transition-all outline-none focus:border-[#7a6af6]" 
                                    />
                                    {errors.maxDiscount && <ErrorMsg message={errors.maxDiscount.message} />}
                                    <p className="text-[7px] text-slate-400 font-bold uppercase mt-1 ml-1">Protects your margins on large orders</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[20px] p-6 border shadow-sm">
                            <div className="flex items-center gap-2 mb-5 border-b pb-3 text-[#7a6af6]">
                                <ShieldCheck size={16} />
                                <h3 className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Usage Guardrails</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Min. Order Value (₹) *</label>
                                    <input 
                                        type="number" 
                                        {...register("minPurchaseAmt", { 
                                            required: "Minimum order value is required",
                                            min: { value: 0, message: "Cannot be a negative number" },
                                            max: { value: 50000, message: "Maximum limit is ₹50000" }
                                        })} 
                                        placeholder="e.g. 999"
                                        className="w-full bg-white border-2 border-slate-100 rounded-[12px] px-4 py-2.5 text-[11px] font-bold outline-none focus:border-[#7a6af6]" 
                                    />
                                    {errors.minPurchaseAmt && <ErrorMsg message={errors.minPurchaseAmt.message} />}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Uses Per Customer *</label>
                                    <input 
                                        type="number" 
                                        {...register("usagePerUser", { 
                                            required: "Usage per user is required", 
                                            min: { value: 1, message: "Minimum is 1 use" },
                                            max: { value: 5, message: "Maximum allowed is 5 uses" }
                                        })} 
                                        placeholder="e.g. 1"
                                        className="w-full bg-white border-2 border-slate-100 rounded-[12px] px-4 py-2.5 text-[11px] font-bold outline-none focus:border-[#7a6af6]" 
                                    />
                                    {errors.usagePerUser && <ErrorMsg message={errors.usagePerUser.message} />}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Total Store Usage Limit *</label>
                                    <input 
                                        type="number" 
                                        {...register("usageLimit", { 
                                            required: "Overall usage limit is required", 
                                            min: { value: 1, message: "Minimum is 1 total use" },
                                            max: { value: 10000, message: "Maximum is 10000 total uses" }
                                        })} 
                                        placeholder="e.g. 100"
                                        className="w-full bg-white border-2 border-slate-100 rounded-[12px] px-4 py-2.5 text-[11px] font-bold outline-none focus:border-[#7a6af6]" 
                                    />
                                    {errors.usageLimit && <ErrorMsg message={errors.usageLimit.message} />}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[20px] p-6 border shadow-sm">
                            <div className="flex items-center gap-2 mb-5 border-b pb-3 text-[#7a6af6]">
                                <Calendar size={16} />
                                <h3 className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Campaign Timeline</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Launch Date *</label>
                                    <input 
                                        type="date" 
                                        min={!isEditMode ? todayStr : undefined} 
                                        {...register("startDate", { required: "Please select a start date" })} 
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-[12px] px-4 py-2.5 text-[11px] font-bold text-[#0F172A] outline-none focus:border-[#7a6af6]" 
                                    />
                                    {errors.startDate && <ErrorMsg message={errors.startDate.message} />}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Expiry Date *</label>
                                    <input 
                                        type="date" 
                                        min={startDate || todayStr}
                                        {...register("endDate", { 
                                            required: "Please select an end date", 
                                            validate: value => value >= startDate || "The expiry date cannot be set before the launch date" 
                                        })} 
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-[12px] px-4 py-2.5 text-[11px] font-bold text-[#0F172A] outline-none focus:border-[#7a6af6]" 
                                    />
                                    {errors.endDate && <ErrorMsg message={errors.endDate.message} />}
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#0F172A] rounded-[20px] p-6 shadow-xl flex flex-col md:flex-row justify-between items-center text-white gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/10">
                                    <Ticket size={20} className="text-[#7a6af6]" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest">Promotion Logic Verified</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase">Ensure configuration aligns with profit margins</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Campaign Active</span>
                                    <input type="checkbox" {...register("isActive")} className="w-10 h-5 accent-[#7a6af6] cursor-pointer" />
                                </div>
                                <button type="button" onClick={handleSubmit(onFormSubmit)} disabled={isPending} className="bg-[#7a6af6] px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#6c5ce7] shadow-lg shadow-[#7a6af6]/20 transition-all active:scale-95 disabled:opacity-50">
                                    {isEditMode ? 'Update Voucher' : 'Activate Campaign'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default CouponForm;