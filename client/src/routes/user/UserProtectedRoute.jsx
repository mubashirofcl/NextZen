import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const Spinner = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-[#7a6af6] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Authenticating...</p>
    </div>
);

const UserProtectedRoute = () => {
    const { isAuthenticated, loading } = useSelector((state) => state.userAuth);
    const location = useLocation();

    if (loading) {
        return <Spinner />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    return <Outlet />;
};

export default UserProtectedRoute;