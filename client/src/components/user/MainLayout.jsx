
const MainLayout = ({ children }) => {
    return (
        <div className="relative min-h-screen font-sans text-[#333] selection:bg-[#7a6af6]/20">

            <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover scale-105"
                >
                    <source src="/hero-bg.mp4" type="video/mp4" />
                </video>

                <div className="absolute inset-0 bg-black/30" />
            </div>



            <main className="mx-auto relative z-10">
                {children}
            </main>

        </div>
    );
};

export default MainLayout;