import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

const AdminAuthRoute = () => {
  const { admin, loading } = useSelector((s) => s.adminAuth);

  if (loading) return <div>Checking admin session…</div>;

  if (admin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
};

export default AdminAuthRoute;
