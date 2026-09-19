import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function AdminRoute({ children }) {
  const { isAdmin, isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100vh", color: "#94a3b8", fontSize: "1.1rem"
      }}>
        Verifying admin access...
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default AdminRoute;
