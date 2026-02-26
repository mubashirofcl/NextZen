import React, { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ChevronLeft, Save, ListChecks, Loader2, Layout,
    Activity, ClipboardList, Trash2, Ruler, Maximize, BoxSelect, Percent, Plus
} from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";

import AdminSidebar from "../../components/admin/AdminSidebar";
import VariantCard from "../../components/admin/VariantCard";
import { adminToast } from "../../utils/adminToast";
import { useProductDetails, useCreateProduct, useUpdateProduct } from "../../hooks/admin/useAdminProducts";
import { useAdminCategoriesSelection, useAdminSubCategories } from "../../hooks/admin/useAdminCategories";
import { useAdminBrandsSelection } from "../../hooks/admin/useAdminBrands";
import { useOffers } from "../../hooks/admin/useOffers";

const GlobalLoader = ({ message }) => (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/70 backdrop-blur-md cursor-wait">
        <div className="bg-white p-8 rounded-[24px] shadow-2xl flex flex-col items-center border border-slate-100 animate-in zoom-in duration-200">
            <Loader2 className="text-[#7a6af6] animate-spin mb-4" size={36} />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0F172A]">{message}</p>
        </div>
    </div>
);

const ProductForm = () => {
    const queryClient = useQueryClient();
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const navigate = useNavigate();

    const { data: productData, isLoading: isProductLoading } = useProductDetails(id);
    const { data: categoryOptions } = useAdminCategoriesSelection({ level: 1 });
    const { data: brandOptions } = useAdminBrandsSelection();

    const { offers } = useOffers();
    const productOffers = offers?.filter(o => o.applyFor === "PRODUCT" && o.isActive) || [];

    const createMutation = useCreateProduct();
    const updateMutation = useUpdateProduct();
    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm({
        mode: "onBlur",
        defaultValues: {
            name: "", brandId: "", categoryId: "", subcategoryId: "", description: "",
            offerId: "",
            sizeType: "STANDARD", highlights: [""], isFeatured: false, isActive: true,
            variants: []
        }
    });

    const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({ control, name: "variants" });
    const { fields: highlightFields, append: appendHighlight, remove: removeHighlight } = useFieldArray({ control, name: "highlights" });

    const selectedCategoryId = watch("categoryId");
    const sizeType = watch("sizeType");
    const { data: subCategoryData, isLoading: isSubLoading } = useAdminSubCategories({ parentId: selectedCategoryId, isActive: true });

    const isInitialized = useRef(false);

    useEffect(() => {
        if (isEditMode && productData && !isInitialized.current) {
            const normalizedSubId = typeof productData.subcategoryId === 'object'
                ? productData.subcategoryId?._id
                : productData.subcategoryId;

            const normalizedOfferId = typeof productData.offerId === 'object'
                ? productData.offerId?._id
                : productData.offerId;

            reset({
                ...productData,
                subcategoryId: normalizedSubId || "",
                offerId: normalizedOfferId || "",
                variants: productData.variants || [],
                highlights: productData.highlights || [""]
            });

            isInitialized.current = true;
        } else if (!isEditMode && !isInitialized.current) {
            appendVariant({
                color: "Default", hex: "#000000", images: [],
                sizes: ["S", "M", "L", "XL", "XXL"].map(s => ({ size: s, stock: "", originalPrice: "", salePrice: "", isActive: true }))
            });
            isInitialized.current = true;
        }
    }, [productData, isEditMode, reset, appendVariant]);

    useEffect(() => {
        if (isEditMode && productData && subCategoryData?.length > 0) {
            const targetId = typeof productData.subcategoryId === 'object'
                ? productData.subcategoryId?._id
                : productData.subcategoryId;

            if (targetId) {
                const timer = setTimeout(() => {
                    setValue("subcategoryId", targetId);
                }, 200);
                return () => clearTimeout(timer);
            }
        }
    }, [subCategoryData, productData, isEditMode, setValue]);

    useEffect(() => {
        if (isEditMode && !isInitialized.current) return;
        const currentVariants = watch("variants");
        if (!currentVariants || currentVariants.length === 0) return;
        const hasData = currentVariants[0]?.sizes?.some(s => s.stock !== "" && s.stock != null);
        if (isEditMode && hasData) return;

        const templates = {
            STANDARD: ["S", "M", "L", "XL", "XXL"].map(s => ({ size: s, stock: "", originalPrice: "", salePrice: "", isActive: true })),
            FREE_SIZE: [{ size: "FREE", stock: "", originalPrice: "", salePrice: "", isActive: true }],
            NO_SIZE: [{ size: "ONE", stock: "", originalPrice: "", salePrice: "", isActive: true }]
        };
        const target = templates[sizeType] || templates.STANDARD;
        const currentFirstSize = currentVariants[0]?.sizes?.[0]?.size;
        const needsUpdate = (sizeType === "STANDARD" && (currentFirstSize === "FREE" || currentFirstSize === "ONE")) || (sizeType === "FREE_SIZE" && currentFirstSize !== "FREE") || (sizeType === "NO_SIZE" && currentFirstSize !== "ONE");

        if (needsUpdate) {
            setValue("variants", currentVariants.map(v => ({ ...v, sizes: target })), { shouldDirty: true });
        }
    }, [sizeType, isEditMode, watch, setValue]);

    const onFormSubmit = async (payload) => {
        if (isSubmitting) return;

        const variantsArray = Array.isArray(payload.variants) ? payload.variants : [];
        const highlightsArray = Array.isArray(payload.highlights) ? payload.highlights : [];

        if (variantsArray.length === 0) {
            adminToast.warn("Information Missing", "At least one colorway variant is required for deployment.");
            return;
        }

        const cleanedPayload = {
            ...payload,
            highlights: highlightsArray.filter(h => h && h.trim() !== ""),
            offerId: payload.offerId === "" ? null : payload.offerId,
            variants: variantsArray.map(v => {
                const cleanV = { ...v };
                if (!cleanV._id || cleanV._id === "") delete cleanV._id;
                cleanV.sizes = Array.isArray(v.sizes) ? v.sizes : [];
                return cleanV;
            })
        };

        try {
            isEditMode
                ? await updateMutation.mutateAsync({ id, ...cleanedPayload })
                : await createMutation.mutateAsync(cleanedPayload);

            adminToast.success("Success", `The product has been ${isEditMode ? 'updated' : 'deployed'} successfully.`);
            navigate("/admin/products");
        } catch (err) {
            const errorMessage = err.response?.data?.message || "Internal system error occurred during sync.";
            adminToast.error("Execution Error", errorMessage);
        }
    };

    const getNewVariantSizes = () => {
        if (sizeType === "FREE_SIZE") return [{ size: "FREE", stock: "", originalPrice: "", salePrice: "", isActive: true }];
        if (sizeType === "NO_SIZE") return [{ size: "ONE", stock: "", originalPrice: "", salePrice: "", isActive: true }];
        return ["S", "M", "L", "XL", "XXL"].map(s => ({ size: s, stock: "", originalPrice: "", salePrice: "", isActive: true }));
    };

    return (
        <div className="min-h-screen flex bg-[#f1f5f9] p-2 gap-2 items-start font-sans relative">
            {(isSubmitting || isProductLoading) && <GlobalLoader message="Synchronizing with Vault..." />}
            <AdminSidebar />

            <main className={`flex-1 flex flex-col gap-2 h-[calc(100vh-16px)] transition-all ${isSubmitting ? 'blur-sm pointer-events-none' : ''}`}>
                <header className="bg-white border rounded-[16px] px-6 py-3 flex justify-between items-center shadow-sm shrink-0">
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={() => navigate(-1)} className="p-1.5 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all"><ChevronLeft size={18} /></button>
                        <h2 className="text-[12px] font-black uppercase tracking-tight text-[#0F172A]">Deployment Console</h2>
                    </div>
                    <button onClick={handleSubmit(onFormSubmit)} className="bg-[#0F172A] text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:shadow-lg transition-all">
                        {isSubmitting ? <Loader2 className="animate-spin" size={12} /> : <Save size={12} />} {isEditMode ? "Update Product" : "Launch Product"}
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                    <form className="space-y-3 pb-8" onSubmit={(e) => e.preventDefault()}>

                        <div className="bg-white rounded-[20px] p-6 border shadow-sm">
                            <div className="flex items-center gap-2 mb-5 border-b pb-3 text-[#7a6af6]">
                                <ClipboardList size={16} />
                                <h3 className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Primary Identity</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <InputField 
                                    label="Product Name *" 
                                    register={register("name", { 
                                        required: "Please provide a name for the product",
                                        minLength: { value: 3, message: "Product name must be at least 3 characters" },
                                        maxLength: { value: 60, message: "Product name must be under 60 characters" }
                                    })} 
                                    error={errors.name} 
                                />
                                <SelectField 
                                    label="Authority Brand *" 
                                    register={register("brandId", { required: "Please select an associated brand" })} 
                                    options={brandOptions?.items || brandOptions || []} 
                                    placeholder="Select Brand" 
                                    error={errors.brandId} 
                                />
                                <div className="grid grid-cols-2 gap-3 md:col-span-2">
                                    <SelectField 
                                        label="Core Category *" 
                                        register={register("categoryId", { required: "A core category is mandatory" })} 
                                        options={categoryOptions?.items || categoryOptions || []} 
                                        placeholder="Select Category" 
                                        error={errors.categoryId}
                                    />
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Sub-Category *</label>
                                        <select 
                                            {...register("subcategoryId", { required: "A sub-category is required" })} 
                                            disabled={!selectedCategoryId || isSubLoading} 
                                            className={`w-full bg-white border-2 rounded-[12px] px-3 py-2.5 text-[11px] font-bold text-[#0F172A] outline-none shadow-sm transition-all ${errors.subcategoryId ? 'border-red-500 ring-2 ring-red-50' : 'border-slate-100 focus:border-[#7a6af6]'}`}
                                        >
                                            <option value="">{isSubLoading ? "Synchronizing..." : "Select Sub-Category"}</option>
                                            {subCategoryData?.map(opt => <option key={opt._id} value={opt._id}>{opt.name}</option>)}
                                        </select>
                                        {errors.subcategoryId && <p className="text-[9px] text-red-500 font-bold mt-1 uppercase italic tracking-tighter">! {errors.subcategoryId.message}</p>}
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Description *</label>
                                    <textarea 
                                        {...register("description", { 
                                            required: "A product description is necessary",
                                            minLength: { value: 20, message: "Description must provide at least 20 characters of detail" },
                                            maxLength: { value: 800, message: "Description limit is 800 characters" }
                                        })} 
                                        className={`w-full bg-slate-50 border-2 rounded-[12px] p-4 text-xs font-bold text-[#0F172A] h-24 outline-none transition-all ${errors.description ? 'border-red-500 ring-2 ring-red-50' : 'border-slate-100 focus:border-[#7a6af6]'}`} 
                                    />
                                    {errors.description && <p className="text-[9px] text-red-500 font-bold mt-1 uppercase italic tracking-tighter">! {errors.description.message}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[20px] p-6 border shadow-sm space-y-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center px-1 border-b pb-3">
                                    <div className="flex items-center gap-2">
                                        <ListChecks size={16} className="text-[#7a6af6]" />
                                        <h3 className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Key Highlights</h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => appendHighlight("")}
                                        className="flex items-center gap-1.5 text-[9px] font-black text-white bg-[#7a6af6] px-4 py-1.5 rounded-xl hover:shadow-lg transition-all"
                                    >
                                        <Plus size={12} /> Add Point
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {highlightFields.map((field, index) => (
                                        <div key={field.id} className="group flex items-center gap-2 bg-slate-50 p-2 rounded-[12px] border border-slate-100 hover:border-[#7a6af6] transition-all">
                                            <div className="w-6 h-6 flex-shrink-0 bg-[#0F172A] text-white rounded-lg flex items-center justify-center text-[9px] font-black">
                                                {index + 1}
                                            </div>
                                            <input
                                                {...register(`highlights.${index}`, { 
                                                    required: "Field cannot be left empty",
                                                    maxLength: { value: 100, message: "Bullet point too long" }
                                                })}
                                                placeholder="Enter highlight feature..."
                                                className="flex-1 bg-transparent py-1.5 text-[11px] font-bold text-[#0F172A] outline-none placeholder:text-slate-300"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeHighlight(index)}
                                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                {highlightFields.length === 0 && (
                                    <p className="text-[9px] text-center text-slate-400 font-bold uppercase italic py-4">No highlights defined for this deployment.</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t pt-6">
                                <ToggleField label="Featured Showcase" register={register("isFeatured")} icon={<Activity size={14} />} />
                                <ToggleField label="Visibility Status" register={register("isActive")} icon={<Layout size={14} />} />
                            </div>
                        </div>

                        <div className="bg-white rounded-[20px] p-6 border shadow-sm">
                            <div className="flex items-center gap-2 mb-5 border-b pb-3 text-[#7a6af6]">
                                <Percent size={16} />
                                <h3 className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Incentive Strategy</h3>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Direct Product Offer</label>
                                <div className="relative group">
                                    <select
                                        {...register("offerId")}
                                        className="w-full bg-white border-2 border-slate-100 rounded-[12px] px-3 py-2.5 text-[11px] font-bold text-[#0F172A] outline-none focus:border-[#7a6af6] appearance-none cursor-pointer transition-all"
                                    >
                                        <option value="">No Direct Promotion (Inherit from Hierarchy)</option>
                                        {productOffers.map(offer => (
                                            <option key={offer._id} value={offer._id}>
                                                {offer.title} — {offer.discountValue}% OFF
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                        <Percent size={12} strokeWidth={3} />
                                    </div>
                                </div>
                                <p className="text-[8px] text-slate-400 font-bold uppercase mt-1.5 ml-1 leading-relaxed italic">
                                    Note: Direct offers override Subcategory and Category level discounts.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-[20px] p-4 border shadow-sm">
                            <label className="text-[9px] font-black text-[#0F172A] uppercase ml-1 mb-3 block tracking-widest">Inventory Sizing Mode</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[{ id: "STANDARD", label: "Multi-Size", icon: <Ruler size={14} /> }, { id: "FREE_SIZE", label: "Free Size", icon: <Maximize size={14} /> }, { id: "NO_SIZE", label: "Fixed Size", icon: <BoxSelect size={14} /> }].map((mode) => (
                                    <button key={mode.id} type="button" onClick={() => setValue("sizeType", mode.id)} className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${sizeType === mode.id ? 'border-[#7a6af6] bg-purple-50' : 'border-slate-100 hover:bg-slate-50'}`}>
                                        <span className={sizeType === mode.id ? 'text-[#7a6af6]' : 'text-slate-400'}>{mode.icon}</span>
                                        <span className="text-[10px] font-black text-[#0F172A] uppercase">{mode.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-between items-center px-6 py-3 bg-[#0F172A] rounded-[16px] text-white">
                            <h3 className="text-[10px] font-black uppercase">Configuration Matrix</h3>
                            <button type="button" onClick={() => appendVariant({ color: "New Color", hex: "#000000", images: [], sizes: getNewVariantSizes() })} className="px-4 py-1.5 bg-[#7a6af6] rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[#6858e0] transition-colors">+ Add Colorway</button>
                        </div>

                        {variantFields.map((field, index) => (
                            <VariantCard key={field.id} index={index} register={register} watch={watch} onRemove={() => removeVariant(index)} setValue={setValue} errors={errors} />
                        ))}

                        <div className="bg-white rounded-[20px] p-6 shadow-sm border border-slate-200">
                            <div className="flex items-center gap-2 mb-5 border-b border-slate-50 pb-3">
                                <div className="w-8 h-8 bg-[#0F172A] text-white rounded-lg flex items-center justify-center shadow-md"><Layout size={14} /></div>
                                <h3 className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Stock Summary</h3>
                            </div>

                            <div className="border border-slate-100 rounded-[16px] overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b">
                                        <tr><th className="px-6 py-3">Swatch</th><th className="px-6 py-3 text-center">Inv. Units</th><th className="px-6 py-3 text-right">Action</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {variantFields.map((field, idx) => {
                                            const v = watch(`variants.${idx}`);
                                            const totalStock = v?.sizes?.reduce((a, b) => a + Number(b.stock || 0), 0);
                                            return (
                                                <tr key={field.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-3 flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg border-2 border-white shadow-sm" style={{ backgroundColor: v?.hex || '#000' }} />
                                                        <span className="text-[10px] font-black text-[#0F172A] uppercase">{v?.color || "Unnamed"}</span>
                                                    </td>
                                                    <td className="px-6 py-3 text-center">
                                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${totalStock > 0 ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"}`}>{totalStock || 0} Units</span>
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        <button type="button" onClick={() => removeVariant(idx)} className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg transition-all"><Trash2 size={14} /></button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

const InputField = ({ label, register, error }) => (
    <div className="space-y-1.5">
        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
        <input {...register} className={`w-full bg-white border-2 rounded-[12px] px-4 py-2.5 text-[11px] font-bold text-[#0F172A] outline-none shadow-sm transition-all ${error ? 'border-red-500 ring-2 ring-red-50' : 'border-slate-100 focus:border-[#7a6af6]'}`} />
        {error && <p className="text-[9px] text-red-500 font-bold mt-1 uppercase italic tracking-tighter">! {error.message}</p>}
    </div>
);

const SelectField = ({ label, register, options, placeholder, error }) => (
    <div className="space-y-1.5">
        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
        <select {...register} className={`w-full bg-white border-2 rounded-[12px] px-3 py-2.5 text-[11px] font-bold text-[#0F172A] outline-none cursor-pointer transition-all ${error ? 'border-red-500 ring-2 ring-red-50' : 'border-slate-100 focus:border-[#7a6af6]'}`}>
            <option value="">{placeholder}</option>
            {options?.map(opt => <option key={opt._id} value={opt._id}>{opt.name}</option>)}
        </select>
        {error && <p className="text-[9px] text-red-500 font-bold mt-1 uppercase italic tracking-tighter">! {error.message}</p>}
    </div>
);

const ToggleField = ({ label, register, icon }) => (
    <div className="flex items-center justify-between p-4 bg-white rounded-[16px] border border-slate-100 group hover:shadow-md transition-all">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 text-slate-400 group-hover:text-[#7a6af6] rounded-xl transition-all shadow-sm">{icon}</div>
            <span className="text-[10px] font-black text-[#0F172A] uppercase tracking-tight">{label}</span>
        </div>
        <input type="checkbox" {...register} className="w-10 h-5 accent-[#7a6af6] cursor-pointer" />
    </div>
);

export default ProductForm;