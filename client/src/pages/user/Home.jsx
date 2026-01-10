import React from 'react';
import { Star, ArrowUpRight, ShoppingBag } from 'lucide-react';
import Header from '../../components/user/Header';
import Footer from '../../components/user/Footer';

const Home = () => {
    return (
        <div className="relative min-h-screen font-sans text-[#333] selection:bg-[#7a6af6]/20">

            <Header />

            <div className="mx-auto relative z-10 px-4">

                <section className="pt-10 px-4">
                    <h1 className="text-[18vw] md:text-[15vw] font-black tracking-tighter leading-[0.85] text-center uppercase  text-gray-100 text-white/60 mb-8">
                        NEXT<span className="text-[#7a6af6a8]">ZEN</span> <br /> OUTFIT
                    </h1>
                    <br /><br /><br />
                    <div className="flex flex-col md:flex-row items-center justify-between border-t border-b border-gray-100 py-6 gap-4 backdrop-blur-md bg-white/20 rounded-full px-8">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Est. 2026 // Premium Quality</p>
                        <div className="flex gap-8">
                            <button className="text-[10px] text-white uppercase tracking-[0.3em] hover:text-[#7a6af6] transition-colors">New Season</button>
                            <button className="text-[10px] text-white uppercase tracking-[0.3em] hover:text-[#7a6af6] transition-colors">Exclusives</button>
                        </div>
                    </div>
                </section>

                <section className="px-4 my-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <CategoryTile title="Hoodies" count="12 Items" img="https://images.unsplash.com/photo-1642935553837-5894a54bfbc2?q=80&w=600" />
                        <CategoryTile title="T-Shirts" count="08 Items" img="https://images.unsplash.com/photo-1618453292459-53424b66bb6a?q=80&w=600" />
                        <CategoryTile title="Beanies" count="15 Items" img="https://plus.unsplash.com/premium_photo-1673356302032-60c80e0b590b?q=80&w=600" />
                        <CategoryTile title="bracelets" count="05 Items" img="https://images.unsplash.com/photo-1581299976481-2fb7c23862f8?q=80&w=600" />
                    </div>
                </section>

                <div className="bg-[#fcfcfc92] text-white py-3 overflow-hidden whitespace-nowrap flex my-12 font-black text-[10px] tracking-[0.5em] uppercase mb-12">
                    {[...Array(10)].map((_, i) => (
                        <span key={i} className="flex items-center gap-6 animate-marquee">
                            SHOP NOW <Star size={10} className="fill-[#7a6af6] text-[#7a6af6]" />
                            GRAB NOW <Star size={10} className="fill-[#7a6af6] text-[#7a6af6]" />
                            COLLECT NOW
                        </span>
                    ))}
                </div>


                <section className="px-4 mb-20">
                    <div className="relative h-[600px] rounded-[2.5rem] overflow-hidden group shadow-2xl">
                        <img
                            src="https://images.unsplash.com/photo-1624222244232-5f1ae13bbd53?q=80&w=1200"
                            alt="Minimalist Essentials"
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex flex-col items-start justify-center p-12 md:p-20 text-white">
                            <p className="text-[10px] font-black tracking-[0.5em] uppercase mb-6 text-[#7a6af6]">New Drop 2026</p>
                            <h3 className="text-5xl md:text-7xl font-black mb-10 tracking-tighter uppercase leading-[0.9] max-w-lg">
                                MINIMALIST <br /> ESSENTIALS
                            </h3>
                            <div className="flex flex-wrap gap-4">
                                <button className="bg-white text-[#0F172A] px-10 py-4 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-[#7a6af6] hover:text-white transition-all shadow-xl">Shop Collection</button>
                                <button className="backdrop-blur-xl bg-white/10 border border-white/20 px-10 py-4 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-white/20 transition-all">Lookbook</button>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="px-4 py-20 backdrop-blur-md bg-white/10 border border-white/20 rounded-[2.5rem] mb-20">
                    <div className="flex flex-col md:flex-row justify-between items-baseline mb-16 gap-4">
                        <div className="space-y-2">
                            <h3 className="text-4xl font-black uppercase tracking-tighter text-[#ffffff]">Fresh Arrivals</h3>
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em]">The latest in premium street aesthetics</p>
                        </div>
                        <button className="text-[10px] font-black uppercase tracking-[0.4em] text-[#7a6af6] border-b-2 border-[#7a6af6] pb-1 hover:text-white hover:border-white transition-all">Explore All</button>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
                        <ReferenceProductCard name="OffWhite T-shirts" price="₹1,299" img="https://images.unsplash.com/photo-1660997351262-6c31d8a35b6c?q=80&w=600" />
                        <ReferenceProductCard name="White T-Shirts" price="1,099" img="https://images.unsplash.com/photo-1627225793904-a2f900a6e4cf?q=80&w=600" />
                        <ReferenceProductCard name="Summer T-Shirts" price="₹999" img="https://images.unsplash.com/photo-1592955715335-32e7a2c35def?q=80&w=600" />
                        <ReferenceProductCard name="OffWite T-Shirts" price="₹899" img="https://images.unsplash.com/photo-1742654230442-98d89399b484?q=80&w=600" />
                    </div>
                </section>
            </div>

            <Footer />
        </div>
    );
};

const CategoryTile = ({ title, count, img }) => (
    <div className="relative h-[550px] group cursor-pointer overflow-hidden rounded-[2rem] transition-all duration-700">
        <img src={img} alt={title} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/90 via-transparent to-transparent flex flex-col justify-end p-8">
            <p className="text-[#7a6af6] text-[9px] font-black uppercase tracking-[0.3em] mb-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">{count}</p>
            <h3 className="text-white font-black text-2xl tracking-tighter leading-tight uppercase mb-4">
                {title}
            </h3>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 w-12 h-12 rounded-xl flex items-center justify-center transition-all group-hover:bg-[#7a6af6] group-hover:border-transparent group-hover:rotate-45">
                <ArrowUpRight size={20} className="text-white" />
            </div>
        </div>
    </div>
);

const ReferenceProductCard = ({ name, price, img }) => (
    <div className="group cursor-pointer">
        <div className="relative aspect-[3/4] mb-6 overflow-hidden rounded-[2rem] bg-gray-50/20 backdrop-blur-sm group-hover:shadow-2xl transition-all duration-500 border border-white/20">
            <img src={img} alt={name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
            <div className="absolute top-5 right-5 translate-x-10 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500">
                <button className="bg-white p-4 rounded-2xl shadow-xl hover:bg-[#7a6af6] hover:text-white transition-colors">
                    <ShoppingBag size={18} />
                </button>
            </div>
            <div className="absolute bottom-5 left-5 bg-[#7a6af6] text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em]">
                Limited
            </div>
        </div>
        <div className="space-y-1.5 px-2">
            <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-[#7a6af6]">New Collection</h4>
            <h4 className="text-lg font-black text-[#ffffff] uppercase tracking-tighter leading-none group-hover:text-[#7a6af6] transition-colors">{name}</h4>
            <p className="text-sm text-gray-500 font-bold tracking-tighter italic">{price}</p>
        </div>
    </div>
);

export default Home;