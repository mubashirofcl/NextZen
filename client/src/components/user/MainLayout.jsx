const MainLayout = ({ children }) => {
    return (
        <div className="relative min-h-screen font-sans text-white selection:bg-[#7a6af6]/80">
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover scale-105"
                >
                    <source src="/bg_promo2.mp4" type="video/mp4" />
                </video>

                <div className="absolute inset-0 bg-black/40 backdrop-blur-[8px] transition-all duration-700" />

                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
            </div>

            <main className="relative z-10 mx-auto">
                {children}
            </main>
        </div>
    );
};

export default MainLayout;