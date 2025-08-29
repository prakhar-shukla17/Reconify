import SuperAdminDashboard from '../../components/SuperAdminDashboard';
import ProtectedRoute from '../../components/ProtectedRoute';
import Navbar from '../../components/Navbar';

export default function SuperAdminPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <SuperAdminDashboard />
      </div>
    </ProtectedRoute>
  );
}
