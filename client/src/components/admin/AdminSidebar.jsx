import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutAdmin } from "../../store/admin/authSlice";
import { LayoutDashboard, ShoppingBag, Users, Wallet, Tag, Settings, BarChart3, Package, ChevronDown, LogOut, TicketPercent, MessageSquare, FileText } from "lucide-react";

const AdminSidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    const [openMenus, setOpenMenus] = useState({
        products: location.pathname.includes("/admin/products") || location.pathname.includes("/admin/category"),
        orders: location.pathname.includes("/admin/orders"),
    });

    const toggleMenu = (menu) => setOpenMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));

    const handleLogout = async () => {
        await dispatch(logoutAdmin()).unwrap();
        navigate("/admin/login");
    };

    const isActive = (path) => location.pathname === path;

    return (
        <aside className="w-60 bg-[#0F172A] text-slate-400 flex flex-col rounded-[20px] shadow-2xl overflow-hidden shrink-0 h-[calc(100vh-24px)]">
            <div className="p-5 flex items-center gap-2 border-b border-slate-800/50 cursor-pointer" onClick={() => navigate('/admin/dashboard')}>
                <div className="w-8 h-8 bg-[#0F172A] rounded-lg flex items-center justify-center text-white font-bold text-base shadow-lg border border-slate-700">N</div>
                <span className="text-white font-black tracking-tight text-base uppercase">NEXTZEN</span>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                <NavItem icon={<LayoutDashboard size={16} />} label="Dashboard" active={isActive("/admin/dashboard")} onClick={() => navigate("/admin/dashboard")} />

                <DropdownItem
                    icon={<Package size={16} />}
                    label="Products"
                    isOpen={openMenus.products}
                    onClick={() => toggleMenu("products")}
                    subItems={[
                        { label: "All Products", path: "/admin/products" },
                        { label: "Add Product", path: "/admin/products/add" },
                        { label: "Categories", path: "/admin/category" },
                        { label: "Brand", path: "/admin/brand" }
                    ]}
                    navigate={navigate}
                    currentPath={location.pathname}
                />

                <NavItem icon={<Users size={16} />} label="Customers" active={isActive("/admin/customers")} onClick={() => navigate("/admin/customers")} />
                <NavItem icon={<Wallet size={16} />} label="Wallet & Payments" />
                <NavItem icon={<TicketPercent size={16} />} label="Promotions" />
                <NavItem icon={<MessageSquare size={16} />} label="Support Chat" />
                <NavItem icon={<FileText size={16} />} label="CMS" />
                <NavItem icon={<BarChart3 size={16} />} label="Reports" />
                <NavItem icon={<Settings size={16} />} label="Settings" />
            </nav>

            <div onClick={handleLogout} className="m-3 p-3 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:text-white cursor-pointer transition-all flex items-center gap-3 hover:bg-red-500/10 text-slate-400 border border-transparent hover:border-red-500/20">
                <LogOut size={16} /> Logout
            </div>
        </aside>
    );
};

const NavItem = ({ icon, label, active, onClick }) => (
    <div onClick={onClick} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${active ? 'bg-slate-800 text-white shadow-lg' : 'hover:bg-slate-800/40 hover:text-white'}`}>
        {icon}
        <span className="text-xs font-medium">{label}</span>
    </div>
);

const DropdownItem = ({ icon, label, isOpen, onClick, subItems, navigate, currentPath }) => (
    <div className="space-y-1">
        <div onClick={onClick} className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all hover:bg-slate-800/40 hover:text-white ${isOpen ? 'text-white bg-slate-800/20' : ''}`}>
            <div className="flex items-center gap-3">{icon}<span className="text-xs font-medium">{label}</span></div>
            <ChevronDown size={12} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
        <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="ml-8 space-y-1 py-1">
                {subItems.map((item, i) => (
                    <div key={i} onClick={() => navigate(item.path)} className={`py-1.5 px-3 text-[11px] cursor-pointer rounded-lg hover:bg-slate-800/30 ${currentPath === item.path ? 'text-white font-bold' : 'hover:text-white'}`}>
                        {item.label}
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default AdminSidebar;