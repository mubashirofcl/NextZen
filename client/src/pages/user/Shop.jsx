import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, ChevronDown, Plus, SlidersHorizontal, Check } from "lucide-react";
import Header from "../../components/user/Header";
import Footer from "../../components/user/Footer";

import { useProducts } from "../../hooks/user/useProducts";
import { useUserCategories } from "../../hooks/user/useUserCategories";
import { useUserBrands } from "../../hooks/user/useUserBrands";
import { useUserSubCategories } from "../../hooks/user/useUserSubCategories";

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

const Shop = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const [openDropdown, setOpenDropdown] = useState(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState("createdAt_desc");

    const availableSizes = ["S", "M", "L", "XL", "XXL", "FREE", "ONE"];

    const [filters, setFilters] = useState({
        category: searchParams.get("category") || "",
        subcategory: searchParams.get("subcategory") || "",
        brands: searchParams.get("brand") ? searchParams.get("brand").split(",") : [],
        sizes: searchParams.get("size") ? searchParams.get("size").split(",") : [],
        price: { min: 0, max: 20000 },
    });

    const { data, isLoading } = useProducts({
        search,
        page,
        sort,
        limit: 10,
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

    const updateUrlParams = (newFilters) => {
        const params = {};
        if (newFilters.category) params.category = newFilters.category;
        if (newFilters.subcategory) params.subcategory = newFilters.subcategory;
        if (newFilters.brands.length > 0) params.brand = newFilters.brands.join(",");
        if (newFilters.sizes.length > 0) params.size = newFilters.sizes.join(",");
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

    const handleResetAll = () => {
        setSearch("");
        setSort("createdAt_desc");
        setFilters({
            category: "",
            subcategory: "",
            brands: [],
            sizes: [],
            price: { min: 0, max: 20000 },
        });
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
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#7a6af6] mb-3">Archive // Segment 26</p>
                    <h1 className="text-[clamp(2.5rem,8vw,5rem)] font-black uppercase tracking-tighter italic text-white leading-tight">The Archive</h1>
                </header>

                {/* --- FILTER BAR --- */}
                <div className="sticky top-20 z-[50] mb-16">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-6 border border-white/10 py-3 px-6 backdrop-blur-2xl bg-white/[0.03] rounded-[3rem] shadow-2xl">

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="hidden sm:flex items-center gap-2 px-4 border-r border-white/10 mr-2">
                                <SlidersHorizontal size={14} className="text-[#7a6af6]" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Filters</span>
                                {(filters.category || filters.brands.length > 0 || filters.sizes.length > 0 || search) && (
                                    <button onClick={handleResetAll} className="ml-4 text-[9px] font-black uppercase text-[#7a6af6] hover:text-white transition-colors underline underline-offset-4">Reset</button>
                                )}
                            </div>

                            <FilterDropdown label={filters.category ? categories.find(c => c._id === filters.category)?.name : "Collection"} isOpen={openDropdown === 'cat'} onClick={() => toggleDropdown('cat')}>
                                <ul className="space-y-4">
                                    <li onClick={() => { setFilters({ ...filters, category: "", subcategory: "" }); updateUrlParams({ ...filters, category: "", subcategory: "" }); resetPage(); setOpenDropdown(null); }} className="text-[10px] font-black uppercase text-white/20 hover:text-[#7a6af6] cursor-pointer">All Collections</li>
                                    {categories.map(c => (
                                        <li key={c._id} onClick={() => { setFilters({ ...filters, category: c._id, subcategory: "" }); updateUrlParams({ ...filters, category: c._id }); resetPage(); setOpenDropdown(null); }} className={`text-[11px] font-bold uppercase cursor-pointer transition-all ${filters.category === c._id ? "text-[#7a6af6]" : "text-white/60 hover:text-white"}`}>{c.name}</li>
                                    ))}
                                </ul>
                            </FilterDropdown>

                            {filters.category && (
                                <FilterDropdown label={filters.subcategory ? subcategories.find(sc => sc._id === filters.subcategory)?.name : "Type"} isOpen={openDropdown === "sub"} onClick={() => toggleDropdown("sub")}>
                                    <ul className="space-y-4">
                                        {subcategories.map(sc => (
                                            <li key={sc._id} onClick={() => { const f = { ...filters, subcategory: sc._id }; setFilters(f); updateUrlParams(f); resetPage(); setOpenDropdown(null); }} className={`text-[11px] font-bold uppercase cursor-pointer transition-all ${filters.subcategory === sc._id ? "text-[#7a6af6]" : "text-white/60 hover:text-white"}`}>{sc.name}</li>
                                        ))}
                                    </ul>
                                </FilterDropdown>
                            )}

                            <FilterDropdown label="Brand" isOpen={openDropdown === 'brand'} onClick={() => toggleDropdown('brand')}>
                                <div className="space-y-3 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                                    {brands.map(b => (
                                        <label key={b._id} className="flex items-center gap-3 cursor-pointer group py-1">
                                            <div className={`w-4 h-4 border rounded-sm flex items-center justify-center transition-all ${filters.brands.includes(b._id) ? "bg-[#7a6af6] border-[#7a6af6]" : "border-white/20 group-hover:border-[#7a6af6]"}`}>
                                                {filters.brands.includes(b._id) && <Check size={12} className="text-white" />}
                                            </div>
                                            <input type="checkbox" className="hidden" checked={filters.brands.includes(b._id)} onChange={() => {
                                                const newBrands = filters.brands.includes(b._id) ? filters.brands.filter(id => id !== b._id) : [...filters.brands, b._id];
                                                const f = { ...filters, brands: newBrands };
                                                setFilters(f); updateUrlParams(f); resetPage();
                                            }} />
                                            <span className={`text-[10px] font-bold uppercase tracking-tight ${filters.brands.includes(b._id) ? "text-white" : "text-white/40 group-hover:text-white"}`}>{b.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </FilterDropdown>

                            <FilterDropdown label={filters.sizes.length > 0 ? `Size (${filters.sizes.length})` : "Size"} isOpen={openDropdown === 'size'} onClick={() => toggleDropdown('size')}>
                                <div className="grid grid-cols-3 gap-2">
                                    {availableSizes.map(size => (
                                        <button
                                            key={size}
                                            onClick={() => handleSizeToggle(size)}
                                            className={`py-2 text-[10px] font-black border rounded-lg transition-all flex items-center justify-center gap-1 ${filters.sizes.includes(size)
                                                ? "bg-[#7a6af6] border-[#7a6af6] text-white shadow-lg"
                                                : "border-white/10 text-white/40 hover:border-white/30"
                                                }`}
                                        >
                                            {filters.sizes.includes(size) && <Check size={10} />}
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </FilterDropdown>
                        </div>

                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            <FilterDropdown label="Sort" variant="right" isOpen={openDropdown === 'sort'} onClick={() => toggleDropdown('sort')}>
                                <ul className="space-y-4">
                                    {[
                                        { label: "Newest", val: "createdAt_desc" },
                                        { label: "Price: Low-High", val: "price_asc" },
                                        { label: "Price: High-Low", val: "price_desc" },
                                        { label: "Name: A-Z", val: "name_asc" }
                                    ].map((s) => (
                                        <li key={s.val} onClick={() => { setSort(s.val); resetPage(); setOpenDropdown(null); }} className={`text-[11px] font-bold uppercase cursor-pointer transition-all ${sort === s.val ? "text-[#7a6af6]" : "text-white/60 hover:text-white"}`}>
                                            {s.label}
                                        </li>
                                    ))}
                                </ul>
                            </FilterDropdown>

                            <div className="relative flex-1 lg:w-64 group">
                                <input
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); resetPage(); }}
                                    placeholder="Search..."
                                    className="w-full bg-white/5 py-2.5 pl-10 pr-10 rounded-full text-[10px] font-bold uppercase tracking-widest outline-none border border-white/5 focus:border-[#7a6af6]/50 transition-all text-white"
                                />
                                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#7a6af6]" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- GRID --- */}
                <section className="relative z-10">
                    {isLoading ? (
                        <div className="py-40 flex justify-center"><div className="w-10 h-10 border-2 border-[#7a6af6] border-t-transparent rounded-full animate-spin" /></div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-40 border border-dashed border-white/10 rounded-3xl"><p className="text-sm font-black uppercase text-white/20">Archive Segment Empty</p></div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-5 gap-y-10">
                            {products.map((p) => (
                                <ProductCard
                                    key={p._id} id={p._id} name={p.name}
                                    price={p.minSalePrice || p.minPrice}
                                    original={p.minOriginalPrice || p.maxPrice}
                                    img={p.thumbnail}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* --- RESTORED PAGINATION BUTTONS --- */}
                {data?.pagination?.totalPages > 1 && (
                    <div className="flex justify-center items-center gap-8 mt-24 border-t border-white/5 pt-10">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-[#7a6af6] disabled:opacity-0 transition-all px-6 py-2 border border-white/10 rounded-full"
                        >
                            Prev
                        </button>

                        <div className="flex gap-4 text-[10px] font-black tracking-widest items-center text-white/40">
                            <span className="text-[#7a6af6]">{page.toString().padStart(2, '0')}</span>
                            <span className="opacity-10 text-[8px]">/</span>
                            <span>{(data?.pagination?.totalPages || 0).toString().padStart(2, '0')}</span>
                        </div>

                        <button
                            disabled={page === data?.pagination?.totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="text-[10px] font-black uppercase tracking-widest text-white hover:text-[#7a6af6] disabled:opacity-0 transition-all px-6 py-2 border border-white/10 rounded-full"
                        >
                            Next
                        </button>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

const ProductCard = ({ id, name, price, original, img }) => {
    const navigate = useNavigate();
    return (
        <div className="group cursor-pointer" onClick={() => navigate(`/product/${id}`)}>
            <div className="relative aspect-[3/4] mb-4 overflow-hidden rounded-[1.5rem] bg-white/[0.03] border border-white/5 transition-all duration-500 hover:border-[#7a6af6]/40">
                <img src={img} alt={name} className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110 opacity-90 group-hover:opacity-100" />
                <button className="absolute bottom-4 right-4 bg-white text-black p-3.5 rounded-xl shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 hover:bg-[#7a6af6] hover:text-white">
                    <Plus size={16} strokeWidth={3} />
                </button>
            </div>
            <div className="space-y-1.5 px-1">
                <h3 className="text-[12px] font-black uppercase tracking-tight text-white group-hover:text-[#7a6af6] transition-colors italic truncate">{name}</h3>
                <div className="flex items-center gap-3">
                    <span className="text-[15px] font-black text-white italic">₹{price}</span>
                    {original > price && <span className="text-[9px] font-bold text-white/20 line-through">₹{original}</span>}
                </div>
            </div>
        </div>
    );
};

export default Shop;