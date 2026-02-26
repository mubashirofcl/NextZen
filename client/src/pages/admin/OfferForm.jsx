import React, { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Save, Loader2, Tag, Layers, Settings2, Info, Percent, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { useOffers } from "../../hooks/admin/useOffers";
import { adminToast } from "../../utils/adminToast";

const OfferForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { createOffer, updateOffer, offerDetail, isPending } = useOffers(id);

    const { register, handleSubmit, reset, watch, setError, formState: { errors } } = useForm({
        mode: "onBlur",
        defaultValues: { applyFor: "PRODUCT", discountType: "PERCENT", isActive: true }
    });

    const isInitialized = useRef(false);
    const startDateValue = watch("startDate");
    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        if (id && offerDetail && !isInitialized.current) {
            reset({
                ...offerDetail,
                startDate: offerDetail.startDate?.split('T')[0],
                endDate: offerDetail.endDate?.split('T')[0]
            });
            isInitialized.current = true;
        }
    }, [offerDetail, id, reset]);

    const onFormSubmit = async (data) => {
        try {
            const cleanData = { ...data, title: data.title.trim() };
            
            if (id) await updateOffer({ id, data: cleanData });
            else await createOffer(cleanData);
            
            adminToast.success(id ? "Offer configuration synchronized successfully" : "New offer rule deployed to store");
            navigate("/admin/offers");
        } catch (err) {
            const msg = err?.response?.data?.message || err.message;

            if (msg.toLowerCase().includes("title") || msg.toLowerCase().includes("exists")) {
                setError("title", { type: "manual", message: "This offer title is already in use" });
                adminToast.error("Please provide a unique title for this offer");
            } else {
                adminToast.error(msg);
            }
        }
    };

    const errorLabel = "text-[8px] font-bold text-red-500 uppercase mt-1 ml-1 flex items-center gap-1";
    const inputBase = "w-full border-2 rounded-[12px] px-4 py-2.5 text-[11px] font-bold outline-none transition-all";
    const inputNormal = `${inputBase} bg-slate-50 border-slate-100 focus:border-[#7a6af6] text-[#0F172A]`;
    const inputError = `${inputBase} bg-red-50 border-red-200 focus:border-red-400 text-red-900`;

    return (
        <div className="min-h-screen flex bg-[#f1f5f9] p-2 gap-2 font-sans relative">
            <AdminSidebar />
            <main className="flex-1 flex flex-col gap-2 h-[calc(100vh-16px)]">
                <header className="bg-white border rounded-[16px] px-6 py-3 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={() => navigate(-1)} className="p-1.5 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all">
                            <ChevronLeft size={18} />
                        </button>
                        <div>
                            <h2 className="text-[12px] font-black uppercase tracking-tight text-[#0F172A]">Offer Rule Forge</h2>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Construct automatic discount parameters</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSubmit(onFormSubmit)}
                        disabled={isPending}
                        className="bg-[#0F172A] text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#7a6af6] transition-all disabled:opacity-50 shadow-lg"
                    >
                        {isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                        {id ? "Sync Changes" : "Deploy Rule"}
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                    <form className="space-y-3 pb-8" onSubmit={(e) => e.preventDefault()}>

                        <div className="bg-white rounded-[20px] p-6 border shadow-sm">
                            <h3 className="text-[10px] font-black text-[#7a6af6] uppercase mb-4 tracking-widest flex items-center gap-2 border-b pb-3">
                                <Tag size={14} /> Rule Identity
                            </h3>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Offer Title *</label>
                                <input
                                    {...register("title", {
                                        required: "Please enter a descriptive title",
                                        maxLength: { value: 40, message: "Title must be under 40 characters" },
                                        validate: {
                                            noOnlySpaces: v => v.trim().length > 0 || "Title cannot be empty",
                                            minLen: v => v.trim().length >= 3 || "Title must be at least 3 characters",
                                            namingConvention: v => /^[A-Za-z0-9 _-]+$/.test(v) || "Only letters, numbers, spaces, _ and - allowed"
                                        }
                                    })}
                                    placeholder="E.G. FESTIVE_DROP_2026"
                                    className={errors.title ? inputError : inputNormal}
                                />
                                {errors.title && <p className={errorLabel}><AlertCircle size={10} /> {errors.title.message}</p>}
                            </div>
                        </div>

                        <div className="bg-white rounded-[20px] p-6 border shadow-sm">
                            <h3 className="text-[10px] font-black text-[#7a6af6] uppercase mb-4 tracking-widest flex items-center gap-2 border-b pb-3">
                                <Layers size={14} /> Scope Configuration
                            </h3>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Entities</label>
                                <select {...register("applyFor")} className={inputNormal}>
                                    <option value="PRODUCT">Specific Products</option>
                                    <option value="CATEGORY">Main Categories</option>
                                    <option value="SUBCATEGORY">Sub-Categories Only</option>
                                    <option value="BRAND">Authority Brands</option>
                                </select>
                            </div>
                        </div>

                        <div className="bg-white rounded-[20px] p-6 border shadow-sm">
                            <h3 className="text-[10px] font-black text-[#7a6af6] uppercase mb-4 tracking-widest flex items-center gap-2 border-b pb-3">
                                <Settings2 size={14} /> Incentive Logic
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Value (%) *</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            {...register("discountValue", {
                                                required: "Discount percentage is required",
                                                min: { value: 1, message: "Discount must be at least 1%" },
                                                max: { value: 90, message: "Discount cannot exceed 90%" },
                                                valueAsNumber: true
                                            })}
                                            className={errors.discountValue ? inputError : inputNormal}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">%</span>
                                    </div>
                                    {errors.discountValue && <p className={errorLabel}><AlertCircle size={10} /> {errors.discountValue.message}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[7px] font-black text-slate-400 uppercase ml-1">Launch</label>
                                        <input
                                            type="date"
                                            min={id ? undefined : today}
                                            {...register("startDate", { required: "Start date is mandatory" })}
                                            className={errors.startDate ? inputError : inputNormal}
                                        />
                                        {errors.startDate && <p className={errorLabel}>{errors.startDate.message}</p>}
                                    </div>
                                    <div>
                                        <label className="text-[7px] font-black text-slate-400 uppercase ml-1">Expiry</label>
                                        <input
                                            type="date"
                                            min={startDateValue || today}
                                            {...register("endDate", {
                                                required: "End date is mandatory",
                                                validate: (v) => v >= startDateValue || "Must expire after launch date"
                                            })}
                                            className={errors.endDate ? inputError : inputNormal}
                                        />
                                        {errors.endDate && <p className={errorLabel}>{errors.endDate.message}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#0F172A] rounded-[20px] p-6 flex justify-between items-center text-white shadow-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#7a6af6]/20 rounded-xl flex items-center justify-center border border-[#7a6af6]/30 backdrop-blur-md">
                                    <Settings2 size={20} className="text-[#7a6af6]" />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest">
                                    Forge Status: <span className={Object.keys(errors).length > 0 ? "text-red-400" : "text-[#7a6af6]"}>
                                        {Object.keys(errors).length > 0 ? "Adjustment Needed" : "Rule Ready"}
                                    </span>
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Live Execution</span>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" {...register("isActive")} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7a6af6]"></div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default OfferForm;