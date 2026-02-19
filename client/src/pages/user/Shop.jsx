import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, ChevronDown, SlidersHorizontal, Check, Heart, Loader2, X, Percent, Tag } from "lucide-react";
import { useSelector } from "react-redux";

import Header from "../../components/user/Header";
import Footer from "../../components/user/Footer";

import { useProducts } from "../../hooks/user/useProducts";
import { useUserCategories } from "../../hooks/user/useUserCategories";
import { useUserBrands } from "../../hooks/user/useUserBrands";
import { useUserSubCategories } from "../../hooks/user/useUserSubCategories";
import { useWishlist } from '../../hooks/user/useWishlist';
import { nxToast } from "../../utils/userToast";

const FilterDropdown = ({ label, children, isOpen, onClick, variant = "default" }) => {
    return (
        <div className="relative">
            <button
                onClick={onClick}
                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] py-2.5 px-5 rounded-full border transition-all duration-300 ${isOpen
                    ? "bg-[#7a6af6] border-[#7a6af6] text-white shadow-[0_0_20px_rgba(122,106,246,0.3)]"
                    : "border-white/10 text-white/60 hover:border-[#7a6af6]/50 hover:text-white bg-white/5"
                    }`}
            >
                {label} <ChevronDown size={12} className={`transition-transform duration-500 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[60]" onClick={onClick} />
                    <div className={`absolute top-full mt-4 z-[70] min-w-[240px] bg-[#0F172A]/95 backdrop-blur-3xl border border-white/10 p-6 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-top-2 duration-300 ${variant === "right" ? "right-0" : "left-0"}`}>
                        {children}
                    </div>
                </>
            )}
        </div>
    );
};

const ProductCard = ({ product }) => {
    const navigate = useNavigate();
    const { isAuthenticated } = useSelector((state) => state.userAuth);
    const { toggleWishlist, isInWishlist, isPending } = useWishlist();

    const pId = product._id?.toString();
    const vId = product.variants?.[0]?._id || product.variants?.[0] || pId;
    const isWishlisted = isInWishlist(pId);

    // Dynamic Logic: Determine if an offer is active
    const activeDiscount = Number(product.discountValue || 0);
    const hasOffer = activeDiscount > 0;

    const handleWishlistToggle = (e) => {
        e.stopPropagation();
        if (!isAuthenticated) return nxToast.security("Access Denied", "Please login to archive items.");
        toggleWishlist(pId, vId);
    };

    return (
        <div className="group cursor-pointer" onClick={() => navigate(`/product/${pId}`)}>
            <div className="relative aspect-[3/4] mb-4 overflow-hidden rounded-[1.5rem] bg-white/[0.03] border border-white/5 transition-all duration-500 hover:border-[#7a6af6]/40">
                <img src={product.thumbnail} alt={product.name} className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110 opacity-90 group-hover:opacity-100" />
                
                {/* 🟢 OFFER BADGE - HIGH VISIBILITY */}
                {hasOffer && (
                    <div className="absolute top-4 left-4 z-20 animate-in slide-in-from-left-2 duration-500">
                        <div className="bg-[#7a6af6] text-white px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-[0_0_20px_rgba(122,106,246,0.5)] border border-white/20">
                            <Percent size={10} strokeWidth={4} />
                            <span className="text-[9px] font-black italic tracking-tighter">
                                {activeDiscount}% DROP
                            </span>
                        </div>
                    </div>
                )}

                <button
                    onClick={handleWishlistToggle}
                    disabled={isPending}
                    className={`absolute top-4 right-4 p-2.5 rounded-xl backdrop-blur-md border transition-all duration-500 z-20 shadow-xl
                        ${isWishlisted ? "bg-[#7a6af6] border-[#7a6af6] text-white scale-110" : "bg-black/20 border-white/10 text-white hover:bg-white hover:text-black opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"}`}
                >
                    {isPending ? <Loader2 size={16} className="animate-spin" /> : <Heart size={16} strokeWidth={3} fill={isWishlisted ? "currentColor" : "none"} />}
                </button>
            </div>
            
            <div className="space-y-1 px-1">
                <div className="flex justify-between items-start gap-2">
                    <h3 className="text-[11px] font-black uppercase tracking-tight text-white group-hover:text-[#7a6af6] transition-colors italic truncate flex-1">
                        {product.name}
                    </h3>
                </div>
                
                <div className="flex items-center gap-3">
                    <span className={`text-[14px] font-black italic ${hasOffer ? 'text-[#7a6af6]' : 'text-white'}`}>
                        ₹{product.minSalePrice?.toLocaleString() || product.minPrice?.toLocaleString()}
                    </span>
                    {hasOffer && (
                        <span className="text-[9px] font-bold text-white/20 line-through decoration-white/20 decoration-1">
                            ₹{product.minOriginalPrice?.toLocaleString()}
                        </span>
                    )}
                </div>
                
                {/* Secondary Indicator if specific campaign is active */}
                {hasOffer && (
                    <p className="text-[7px] font-black uppercase tracking-[0.2em] text-[#7a6af6]/60 italic">
                        Limited Time Manifest
                    </p>
                )}
            </div>
        </div>
    );
};

const Shop = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [openDropdown, setOpenDropdown] = useState(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState(searchParams.get("sort") || "createdAt_desc");

    const availableSizes = ["S", "M", "L", "XL", "XXL", "FREE", "ONE"];

    const [filters, setFilters] = useState({
        category: searchParams.get("category") || "",
        subcategory: searchParams.get("subcategory") || "",
        brands: searchParams.get("brand") ? searchParams.get("brand").split(",") : [],
        sizes: searchParams.get("size") ? searchParams.get("size").split(",") : [],
        price: { min: 0, max: 20000 },
    });

    const { data, isLoading } = useProducts({
        search, page, sort, limit: 10, 
        category: filters.category,
        subcategory: filters.subcategory,
        brand: filters.brands,
        size: filters.sizes,
        minPrice: filters.price.min,
        maxPrice: filters.price.max,
    });

    const { data: categories = [] } = useUserCategories();
    const { data: brands = [] } = useUserBrands();
    const { data: subcategories = [] } = useUserSubCategories(filters.category);

    const products = data?.products || [];

    const resetPage = () => setPage(1);
    const toggleDropdown = (id) => setOpenDropdown(openDropdown === id ? null : id);

    const updateUrlParams = (newFilters, newSort = sort) => {
        const params = new URLSearchParams();
        if (newFilters.category) params.set("category", newFilters.category);
        if (newFilters.subcategory) params.set("subcategory", newFilters.subcategory);
        if (newFilters.brands.length > 0) params.set("brand", newFilters.brands.join(","));
        if (newFilters.sizes.length > 0) params.set("size", newFilters.sizes.join(","));
        if (newSort !== "createdAt_desc") params.set("sort", newSort);
        setSearchParams(params);
    };

    const handleSizeToggle = (size) => {
        const newSizes = filters.sizes.includes(size)
            ? filters.sizes.filter(s => s !== size)
            : [...filters.sizes, size];

        const updatedFilters = { ...filters, sizes: newSizes };
        setFilters(updatedFilters);
        updateUrlParams(updatedFilters);
        resetPage();
    };

    const handleBrandToggle = (brandId) => {
        const newBrands = filters.brands.includes(brandId)
            ? filters.brands.filter(id => id !== brandId)
            : [...filters.brands, brandId];

        const updatedFilters = { ...filters, brands: newBrands };
        setFilters(updatedFilters);
        updateUrlParams(updatedFilters);
        resetPage();
    };

    const handleResetAll = () => {
        setSearch("");
        setSort("createdAt_desc");
        const resetFilters = { category: "", subcategory: "", brands: [], sizes: [], price: { min: 0, max: 20000 } };
        setFilters(resetFilters);
        setSearchParams({});
        resetPage();
    };

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [page]);

    return (
        <div className="min-h-screen mt-20 selection:bg-[#7a6af6]/30 overflow-x-hidden">
            <Header />

            <main className="max-w-[1440px] mx-auto px-6 md:px-10 pt-10 relative z-10 pb-32">
                <header className="mb-10 text-left">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#7a6af6] mb-3">Archive // Registry</p>
                    <h1 className="text-[clamp(2.5rem,8vw,5rem)] font-black uppercase tracking-tighter italic text-white leading-tight">The Archive</h1>
                </header>

                {/* Filter Bar */}
                <div className="sticky top-20 z-[50] mb-16">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-6 border border-white/10 py-3 px-6 backdrop-blur-2xl bg-white/[0.03] rounded-[3rem] shadow-2xl">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="hidden sm:flex items-center gap-2 px-4 border-r border-white/10 mr-2">
                                <SlidersHorizontal size={14} className="text-[#7a6af6]" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Filters</span>
                                {(filters.category || filters.brands.length > 0 || filters.sizes.length > 0 || search) && (
                                    <button onClick={handleResetAll} className="ml-4 p-1 rounded-full bg-red-500/10 text-red-500 transition-all hover:bg-red-500 hover:text-white"><X size={10} /></button>
                                )}
                            </div>

                            <FilterDropdown label={filters.category ? categories.find(c => c._id === filters.category)?.name : "Collection"} isOpen={openDropdown === 'cat'} onClick={() => toggleDropdown('cat')}>
                                <ul className="space-y-4">
                                    <li onClick={() => { const f = { ...filters, category: "", subcategory: "" }; setFilters(f); updateUrlParams(f); resetPage(); setOpenDropdown(null); }} className="text-[10px] font-black uppercase text-white/20 hover:text-[#7a6af6] cursor-pointer">All Collections</li>
                                    {categories.map(c => (
                                        <li key={c._id} onClick={() => { const f = { ...filters, category: c._id, subcategory: "" }; setFilters(f); updateUrlParams(f); resetPage(); setOpenDropdown(null); }} className={`text-[11px] font-bold uppercase cursor-pointer transition-all ${filters.category === c._id ? "text-[#7a6af6]" : "text-white/60 hover:text-white"}`}>{c.name}</li>
                                    ))}
                                </ul>
                            </FilterDropdown>

                            {filters.category && subcategories.length > 0 && (
                                <FilterDropdown label={filters.subcategory ? subcategories.find(sc => sc._id === filters.subcategory)?.name : "Type"} isOpen={openDropdown === "sub"} onClick={() => toggleDropdown("sub")}>
                                    <ul className="space-y-4">
                                        <li onClick={() => { const f = { ...filters, subcategory: "" }; setFilters(f); updateUrlParams(f); resetPage(); setOpenDropdown(null); }} className="text-[10px] font-black uppercase text-white/20 hover:text-[#7a6af6] cursor-pointer">All Types</li>
                                        {subcategories.map(sc => (
                                            <li key={sc._id} onClick={() => { const f = { ...filters, subcategory: sc._id }; setFilters(f); updateUrlParams(f); resetPage(); setOpenDropdown(null); }} className={`text-[11px] font-bold uppercase cursor-pointer transition-all ${filters.subcategory === sc._id ? "text-[#7a6af6]" : "text-white/60 hover:text-white"}`}>{sc.name}</li>
                                        ))}
                                    </ul>
                                </FilterDropdown>
                            )}

                            <FilterDropdown label={filters.brands.length > 0 ? `Brand (${filters.brands.length})` : "Brand"} isOpen={openDropdown === 'brand'} onClick={() => toggleDropdown('brand')}>
                                <div className="space-y-3 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                                    {brands.map(b => (
                                        <label key={b._id} className="flex items-center gap-3 cursor-pointer group py-1">
                                            <div className={`w-4 h-4 border rounded-sm flex items-center justify-center transition-all ${filters.brands.includes(b._id) ? "bg-[#7a6af6] border-[#7a6af6]" : "border-white/20 group-hover:border-[#7a6af6]"}`}>
                                                {filters.brands.includes(b._id) && <Check size={12} className="text-white" />}
                                            </div>
                                            <input type="checkbox" className="hidden" checked={filters.brands.includes(b._id)} onChange={() => handleBrandToggle(b._id)} />
                                            <span className={`text-[10px] font-bold uppercase tracking-tight ${filters.brands.includes(b._id) ? "text-white" : "text-white/40 group-hover:text-white"}`}>{b.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </FilterDropdown>

                            <FilterDropdown label={filters.sizes.length > 0 ? `Size (${filters.sizes.length})` : "Size"} isOpen={openDropdown === 'size'} onClick={() => toggleDropdown('size')}>
                                <div className="grid grid-cols-3 gap-2">
                                    {availableSizes.map(size => (
                                        <button key={size} onClick={() => handleSizeToggle(size)} className={`py-2 text-[10px] font-black border rounded-lg transition-all ${filters.sizes.includes(size) ? "bg-[#7a6af6] border-[#7a6af6] text-white" : "border-white/10 text-white/40 hover:border-white/30"}`}>{size}</button>
                                    ))}
                                </div>
                            </FilterDropdown>
                        </div>

                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            <div className="relative w-full lg:w-64 group">
                                <input
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); resetPage(); }}
                                    placeholder="Search Registry..."
                                    className="w-full bg-white/5 py-2.5 pl-10 pr-10 rounded-full text-[10px] font-bold uppercase tracking-widest outline-none border border-white/5 focus:border-[#7a6af6]/50 transition-all text-white"
                                />
                                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#7a6af6]" />
                            </div>
                            <FilterDropdown label="Sort" variant="right" isOpen={openDropdown === 'sort'} onClick={() => toggleDropdown('sort')}>
                                <ul className="space-y-4">
                                    {[
                                        { label: "Newest", val: "createdAt_desc" },
                                        { label: "Price: Low-High", val: "price_asc" },
                                        { label: "Price: High-Low", val: "price_desc" },
                                        { label: "Name: A-Z", val: "name_asc" }
                                    ].map((s) => (
                                        <li key={s.val} onClick={() => { setSort(s.val); updateUrlParams(filters, s.val); setOpenDropdown(null); }} className={`text-[11px] font-bold uppercase cursor-pointer transition-all ${sort === s.val ? "text-[#7a6af6]" : "text-white/60 hover:text-white"}`}>{s.label}</li>
                                    ))}
                                </ul>
                            </FilterDropdown>
                        </div>
                    </div>
                </div>

                {/* Product Grid */}
                <section className="relative z-10 min-h-[400px]">
                    {isLoading ? (
                        <div className="py-40 flex justify-center"><Loader2 size={40} className="text-[#7a6af6] animate-spin" /></div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-40 border border-dashed border-white/10 rounded-3xl"><p className="text-sm font-black uppercase text-white/20 tracking-[0.2em]">Segment Registry Empty</p></div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-5 gap-y-12">
                            {products.map((p) => (
                                <ProductCard key={p._id} product={p} />
                            ))}
                        </div>
                    )}
                </section>

                {/* Pagination */}
                {data?.pagination?.totalPages > 1 && (
                    <div className="flex justify-center items-center gap-8 mt-24 border-t border-white/5 pt-10">
                        <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-8 py-3 border border-white/10 rounded-full text-[10px] font-black uppercase text-white/30 hover:text-[#7a6af6] transition-all disabled:opacity-0">Prev</button>
                        <div className="flex gap-2">
                            {[...Array(data.pagination.totalPages)].map((_, i) => (
                                <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 rounded-full text-[10px] font-black transition-all ${page === i + 1 ? "bg-[#7a6af6] text-white" : "text-white/20 hover:text-white"}`}>{i + 1}</button>
                            ))}
                        </div>
                        <button disabled={page === data.pagination.totalPages} onClick={() => setPage(p => p + 1)} className="px-8 py-3 border border-white/10 rounded-full text-[10px] font-black uppercase text-white hover:text-[#7a6af6] transition-all disabled:opacity-0">Next</button>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default Shop;