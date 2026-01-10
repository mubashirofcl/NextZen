import React from 'react';
import { Instagram, Twitter, Facebook, Youtube, ArrowRight } from 'lucide-react';

const Footer = () => {
    return (

        <footer className="bg-[#0F172A] text-white pt-20 pb-10 px-8 lg:px-24 rounded-t-[3rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] selection:bg-[#7a6af6]/30">
            <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">

                <div className="space-y-8 text-center md:text-left">
                    <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">
                        NEXT<span className="text-[#7a6af6]">ZEN</span>
                    </h2>
                    <p className="text-gray-400 text-[11px] font-bold uppercase tracking-[0.2em] leading-relaxed">
                        Redefining premium streetwear through meticulous craftsmanship and bold design aesthetics. [cite: 2025-12-17]
                    </p>
                    <div className="flex justify-center md:justify-start gap-6">
                        {[Instagram, Twitter, Facebook, Youtube].map((Icon, i) => (
                            <Icon
                                key={i}
                                size={18}
                                className="cursor-pointer hover:text-[#7a6af6] transition-all duration-300 hover:-translate-y-1"
                            />
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#7a6af6] mb-8">Collection</h3>
                    <ul className="space-y-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                        <li className="hover:text-white cursor-pointer transition-colors">Apparel</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Oversized Tees</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Hoodies</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Accessories</li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#7a6af6] mb-8">Support</h3>
                    <ul className="space-y-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                        <li className="hover:text-white cursor-pointer transition-colors">Order Tracking</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Shipping & Returns</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Size Guide</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Privacy Policy</li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#7a6af6] mb-8">Newsletter</h3>
                    <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest mb-6 leading-relaxed">
                        Join for exclusive drops and early collection access.
                    </p>
                    <div className="flex flex-col gap-3">
                        <div className="relative group">
                            <input
                                type="email"
                                placeholder="YOUR EMAIL"
                                className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-[10px] font-bold w-full outline-none focus:border-[#7a6af6] transition-all placeholder:text-gray-600 uppercase tracking-widest"
                            />
                            <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#7a6af6] p-2.5 rounded-lg hover:bg-white hover:text-black transition-all">
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto border-t border-white/5 pt-10 flex flex-col md:flex-row justify-between items-center text-[9px] text-gray-600 font-black uppercase tracking-[0.3em] gap-6">
                <p>© 2026 NextZen Outfit. Crafted for the Bold.</p>
                <div className="flex gap-10">
                    <span className="cursor-pointer hover:text-[#7a6af6] transition-colors">Cookies</span>
                    <span className="cursor-pointer hover:text-[#7a6af6] transition-colors">Terms of Use</span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;