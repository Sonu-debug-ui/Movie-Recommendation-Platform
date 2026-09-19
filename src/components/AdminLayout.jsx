import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import AdminFooter from "./AdminFooter";
import "../css/Admin.css";
import "../css/AdminHeader.css";

function AdminLayout({ children, title = "Admin Panel" }) {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main-container">
        <AdminHeader title={title} />
        <main className="admin-main">
          {children}
        </main>
        <AdminFooter />
      </div>
    </div>
  );
}

export default AdminLayout;
