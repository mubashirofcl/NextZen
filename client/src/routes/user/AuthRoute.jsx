import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

const AuthRoute = () => {
    const { isAuthenticated, loading } = useSelector((state) => state.userAuth);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-10 h-10 border-4 border-[#7a6af6] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    console.log("AuthRoute - isAuthenticated:", isAuthenticated);

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default AuthRoute;