import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, toast } from '@/App';
import { Button } from '@/components/ui/button';
import {
  Camera,
  LogOut,
  Users,
  UserCheck,
  Calendar,
  CheckCircle,
  XCircle,
  Flag,
  Eye,
  Ban,
  Trash2,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({});
  const [pendingPhotographers, setPendingPhotographers] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  // NEW: moderation state
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [fullView, setFullView] = useState(null);
  const [loadingFull, setLoadingFull] = useState(false);
 // NEW: restricted users state
  const [restrictedUsers, setRestrictedUsers] = useState([]);
  // helper: auth header for admin endpoints
  const authHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

   useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      fetchStats();
      fetchPendingPhotographers();
      fetchAllBookings();
      fetchAllUsers();
      fetchReports();
      fetchRestrictedUsers();
    }
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/admin/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats', error);
    }
  };

  const fetchPendingPhotographers = async () => {
    try {
      const response = await axios.get(`${API}/admin/photographers/pending`);
      setPendingPhotographers(response.data);
    } catch (error) {
      console.error('Failed to fetch pending photographers', error);
    }
  };

  const fetchAllBookings = async () => {
    try {
      const response = await axios.get(`${API}/admin/bookings`);
      setAllBookings(response.data);
    } catch (error) {
      console.error('Failed to fetch bookings', error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await axios.get(`${API}/admin/users`);
      setAllUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users', error);
    }
  };

  // NEW: fetch pending reports
  const fetchReports = async () => {
    try {
      setLoadingReports(true);
      const response = await axios.get(`${API}/admin/reports/pending`, {
        headers: authHeaders(),
      });
      setReports(response.data || []);
    } catch (error) {
      console.error('Failed to fetch reports', error);
      toast.error('Failed to fetch reports');
    } finally {
      setLoadingReports(false);
    }
  };

  // NEW: fetch restricted users
  const fetchRestrictedUsers = async () => {
    try {
      const response = await axios.get(`${API}/admin/restricted-users`);
      setRestrictedUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch restricted users', error);
    }
  };

  const handleUnrestrict = async (userId) => {
    try {
      await axios.put(`${API}/admin/unrestrict/${userId}`);
      toast.success('User unrestricted successfully');
      fetchRestrictedUsers();
    } catch (error) {
      toast.error('Failed to unrestrict user');
    }
  };

  const openReportModal = async (report) => {
    setSelectedReport(report);
    setModalOpen(true);
    setFullView(null);
    try {
      setLoadingFull(true);
      const res = await axios.get(
        `${API}/admin/photographers/${report.photographer_user?.id || report.photographer_profile?.user_id || report.photographer_id}/full`,
        { headers: authHeaders() }
      );
      setFullView(res.data);
    } catch (err) {
      console.error('Failed to load photographer profile', err);
      toast.error('Failed to load photographer details');
    } finally {
      setLoadingFull(false);
    }
  };

  // NEW: moderate report actions
  const actOnReport = async (action) => {
    if (!selectedReport || !user) return;
    try {
      const reportId = selectedReport.id;
      const url = `${API}/reports/${reportId}/moderate`;
      await axios.put(url, null, {
        params: { action, admin_id: user.id },
      });
      toast.success(
        action === 'restrict'
          ? 'Photographer restricted'
          : action === 'delete'
          ? 'Photographer removed'
          : 'Report dismissed'
      );
      setModalOpen(false);
      setSelectedReport(null);
      setFullView(null);
      fetchReports();
    } catch (err) {
      console.error('Failed to moderate report', err);
      toast.error('Failed to update report');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleApproval = async (photographerId, status) => {
    try {
      await axios.put(`${API}/admin/photographers/${photographerId}/approval`, {
        approval_status: status,
      });
      toast.success(`Photographer ${status}`);
      fetchPendingPhotographers();
      fetchStats();
    } catch (error) {
      toast.error('Failed to update approval status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // --- Simple modal (overlay) ---
const Modal = ({ open, onClose, children }) => {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-start md:items-center justify-center bg-black/40 p-3 md:p-6">
        <div className="bg-white w-full max-w-5xl rounded-2xl shadow-xl border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b">
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-red-500" />
              <p className="font-semibold">Reported Photographer Review</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
              aria-label="Close"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          <div className="p-5 max-h-[75vh] overflow-y-auto">{children}</div>
        </div>
      </div>
    );
  };
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Camera className="w-7 h-7 text-indigo-600" />
              <span className="text-xl font-bold text-gray-900">FrameWork Admin</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">Admin: {user?.full_name}</span>
              <Button
                data-testid="logout-btn"
                variant="ghost"
                onClick={handleLogout}
                className="text-gray-600"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
              <Users className="w-4 h-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_users || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Photographers</CardTitle>
              <Camera className="w-4 h-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_photographers || 0}</div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.approved_photographers || 0} approved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Approvals</CardTitle>
              <UserCheck className="w-4 h-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending_photographers || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Bookings</CardTitle>
              <Calendar className="w-4 h-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_bookings || 0}</div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.pending_bookings || 0} pending
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="approvals" className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger data-testid="approvals-tab" value="approvals">Pending Approvals</TabsTrigger>
            <TabsTrigger data-testid="bookings-tab" value="bookings">All Bookings</TabsTrigger>
            <TabsTrigger data-testid="users-tab" value="users">All Users</TabsTrigger>
            <TabsTrigger value="restricted">Restricted Users</TabsTrigger>

            {/* NEW */}
            <TabsTrigger data-testid="reports-tab" value="reports">
              Reports
              {reports?.length ? (
                <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-700 px-1">
                  {reports.length}
                </span>
              ) : null}
            </TabsTrigger>
          </TabsList>

          {/* Pending Approvals Tab (unchanged) */}
          <TabsContent value="approvals" className="space-y-4">
            <h2 className="text-2xl font-bold">Photographer Approval Requests</h2>

            {pendingPhotographers.length === 0 ? (
              <div className="bg-white p-12 rounded-xl text-center">
                <p className="text-gray-500">No pending approvals</p>
              </div>
            ) : (
              pendingPhotographers.map((item) => (
                <div key={item.profile.id} data-testid={`pending-photographer-${item.profile.id}`} className="bg-white p-6 rounded-xl shadow-sm border">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4 flex-1">
                      <img
                        src={item.profile.profile_image || `https://ui-avatars.com/api/?name=${item.user.full_name}&background=6366f1&color=fff`}
                        alt={item.user.full_name}
                        className="w-20 h-20 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900">{item.user.full_name}</h3>
                        <p className="text-sm text-gray-600">{item.user.email}</p>
                        <p className="text-sm text-gray-700 mt-2">{item.profile.bio}</p>
                        <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Experience</p>
                            <p className="font-medium">{item.profile.experience_years} years</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Location</p>
                            <p className="font-medium">{item.profile.location}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Phone</p>
                            <p className="font-medium">{item.profile.phone}</p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-sm text-gray-600 mb-1">Specialties</p>
                          <div className="flex flex-wrap gap-2">
                            {item.profile.specialties.map((specialty, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium"
                              >
                                {specialty}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        data-testid={`approve-btn-${item.profile.id}`}
                        onClick={() => handleApproval(item.user.id, 'approved')}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        data-testid={`reject-btn-${item.profile.id}`}
                        onClick={() => handleApproval(item.user.id, 'rejected')}
                        variant="outline"
                        className="border-red-600 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* All Bookings Tab (unchanged) */}
          <TabsContent value="bookings" className="space-y-4">
            <h2 className="text-2xl font-bold">All Bookings</h2>

            {allBookings.length === 0 ? (
              <div className="bg-white p-12 rounded-xl text-center">
                <p className="text-gray-500">No bookings yet</p>
              </div>
            ) : (
              allBookings.map((booking) => (
                <div key={booking.booking.id} data-testid={`booking-${booking.booking.id}`} className="bg-white p-6 rounded-xl shadow-sm border">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-6 flex-1">
                      <div>
                        <h4 className="text-xs text-gray-600 mb-1">Client</h4>
                        <div className="flex items-center gap-2">
                          <img
                            src={`https://ui-avatars.com/api/?name=${booking.user?.full_name}&background=6366f1&color=fff&size=40`}
                            alt={booking.user?.full_name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <p className="font-medium text-sm">{booking.user?.full_name}</p>
                            <p className="text-xs text-gray-600">{booking.user?.email}</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs text-gray-600 mb-1">Photographer</h4>
                        <div className="flex items-center gap-2">
                          <img
                            src={`https://ui-avatars.com/api/?name=${booking.photographer?.full_name}&background=6366f1&color=fff&size=40`}
                            alt={booking.photographer?.full_name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <p className="font-medium text-sm">{booking.photographer?.full_name}</p>
                            <p className="text-xs text-gray-600">{booking.photographer?.email}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(booking.booking.status)}>
                      {booking.booking.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Package</p>
                      <p className="font-medium">{booking.package?.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Price</p>
                      <p className="font-medium">${booking.package?.price}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Date</p>
                      <p className="font-medium">{booking.booking.booking_date}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Location</p>
                      <p className="font-medium">{booking.booking.location}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* All Users Tab (unchanged) */}
          <TabsContent value="users" className="space-y-4">
            <h2 className="text-2xl font-bold">All Users</h2>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {allUsers.map((u) => (
                    <tr key={u.id} data-testid={`user-${u.id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={`https://ui-avatars.com/api/?name=${u.full_name}&background=6366f1&color=fff&size=40`}
                            alt={u.full_name}
                            className="w-10 h-10 rounded-full"
                          />
                          <span className="font-medium">{u.full_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{u.email}</td>
                      <td className="px-6 py-4">
                        <Badge
                          className={
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-700'
                              : u.role === 'photographer'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }
                        >
                          {u.role.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* NEW: Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Pending Reports</h2>
              <Button variant="outline" onClick={fetchReports} disabled={loadingReports}>
                Refresh
              </Button>
            </div>

            {loadingReports ? (
              <div className="bg-white p-12 rounded-xl text-center">
                <p className="text-gray-500">Loading reports…</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="bg-white p-12 rounded-xl text-center">
                <p className="text-gray-500">No pending reports</p>
              </div>
            ) : (
              reports.map((rep) => {
                const phot = rep.photographer_user || {};
                const prof = rep.photographer_profile || {};
                const reporter = rep.reporter || {};
                return (
                  <div
                    key={rep.id}
                    className="bg-white p-6 rounded-xl shadow-sm border"
                    data-testid={`report-${rep.id}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <img
                          src={
                            prof?.profile_image ||
                            `https://ui-avatars.com/api/?name=${phot?.full_name || 'Photographer'}&background=ef4444&color=fff`
                          }
                          alt={phot?.full_name || 'Photographer'}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">
                              {phot?.full_name || 'Unknown Photographer'}
                            </h3>
                            <Badge className="bg-red-100 text-red-700">PENDING</Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            Reason: <span className="font-medium text-gray-800">{rep.reason}</span>
                          </p>
                          {rep.description ? (
                            <p className="text-sm text-gray-700 mt-1">“{rep.description}”</p>
                          ) : null}
                          <p className="text-xs text-gray-500 mt-1">
                            Reported by: {reporter?.full_name || 'User'} ({reporter?.email || '—'})
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                          onClick={() => openReportModal(rep)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Photographer
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>
          <TabsContent value="restricted" className="space-y-4">
  <h2 className="text-2xl font-bold">Restricted Users</h2>

  {restrictedUsers.length === 0 ? (
    <div className="bg-white p-12 rounded-xl text-center">
      <p className="text-gray-500">No users are currently restricted</p>
    </div>
  ) : (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Reason</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Restricted On</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {restrictedUsers.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <img
                    src={`https://ui-avatars.com/api/?name=${user.full_name}&background=6366f1&color=fff&size=40`}
                    alt={user.full_name}
                    className="w-10 h-10 rounded-full"
                  />
                  <span className="font-medium">{user.full_name}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-gray-600">{user.email}</td>
              <td className="px-6 py-4 text-gray-600">{user.restriction_reason || "—"}</td>
              <td className="px-6 py-4 text-gray-600">
                {user.restricted_at ? new Date(user.restricted_at).toLocaleDateString() : "—"}
              </td>
              <td className="px-6 py-4">
                <Button
                  onClick={() => handleUnrestrict(user.id)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Unrestrict
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}</TabsContent>
        </Tabs>
      </div>



      {/* NEW: Modal content */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedReport(null);
          setFullView(null);
        }}
      >
        {!selectedReport ? null : (
          <>
            {/* Header section inside modal */}
            <div className="flex items-start gap-4">
              <img
                src={
                  fullView?.profile?.profile_image ||
                  `https://ui-avatars.com/api/?name=${fullView?.user?.full_name || 'Photographer'}&background=6366f1&color=fff`
                }
                alt={fullView?.user?.full_name || 'Photographer'}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold">
                  {fullView?.user?.full_name || selectedReport.photographer_user?.full_name || 'Photographer'}
                </h3>
                <p className="text-sm text-gray-600">{fullView?.user?.email}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {fullView?.profile?.specialties?.map((s, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="border-amber-500 text-amber-600 hover:bg-amber-50"
                  onClick={() => actOnReport('restrict')}
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Restrict
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => actOnReport('delete')}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </Button>
                <Button variant="outline" onClick={() => actOnReport('dismiss')}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Reject Report
                </Button>
              </div>
            </div>

            {/* Body */}
            {loadingFull ? (
              <div className="py-16 text-center text-gray-500">Loading details…</div>
            ) : (
              <div className="mt-5 space-y-6">
                {/* About Me */}
                <section className="bg-gray-50 rounded-xl p-4 border">
                  <h4 className="font-semibold mb-2">About</h4>
                  <p className="text-sm text-gray-700">
                    {fullView?.about_me?.about_text || fullView?.profile?.bio || 'No about info'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3 text-sm">
                    <div>
                      <p className="text-gray-600">Experience</p>
                      <p className="font-medium">{fullView?.profile?.experience_years ?? '—'} years</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Location</p>
                      <p className="font-medium">{fullView?.profile?.location || '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Phone</p>
                      <p className="font-medium">{fullView?.profile?.phone || '—'}</p>
                    </div>
                  </div>
                </section>

                {/* Portfolio */}
                <section>
                  <h4 className="font-semibold mb-2">Portfolio</h4>
                  {fullView?.portfolio?.length ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {fullView.portfolio.map((p) => (
                        <div key={p.id || p._id} className="overflow-hidden rounded-lg border bg-white">
                          <img
                            src={p.image_url}
                            alt={p.title || 'Portfolio Image'}
                            className="w-full h-28 object-cover"
                          />
                          <div className="p-2">
                            <p className="text-xs font-medium">{p.title || 'Untitled'}</p>
                            {p.category ? (
                              <p className="text-[11px] text-gray-600">{p.category}</p>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No portfolio items</p>
                  )}
                </section>

                {/* Packages */}
                <section>
                  <h4 className="font-semibold mb-2">Packages</h4>
                  {fullView?.packages?.length ? (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {fullView.packages.map((pkg) => (
                        <div key={pkg.id || pkg._id} className="border rounded-lg p-3 bg-white">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{pkg.name}</p>
                            <p className="text-sm text-gray-700">${pkg.price}</p>
                          </div>
                          {pkg.description ? (
                            <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No packages</p>
                  )}
                </section>

                {/* Reviews */}
                <section>
                  <h4 className="font-semibold mb-2">Reviews</h4>
                  {fullView?.reviews?.length ? (
                    <div className="space-y-3">
                      {fullView.reviews.map((r) => (
                        <div key={r.id || r._id} className="border rounded-lg p-3 bg-white">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img
                                src={`https://ui-avatars.com/api/?name=${r.reviewer?.full_name || 'User'}&background=6366f1&color=fff&size=32`}
                                alt={r.reviewer?.full_name || 'User'}
                                className="w-8 h-8 rounded-full"
                              />
                              <div>
                                <p className="text-sm font-medium">
                                  {r.reviewer?.full_name || 'User'}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {new Date(r.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <span className="text-sm font-semibold">
                              {r.rating} / 5
                            </span>
                          </div>
                          {r.review_text ? (
                            <p className="text-sm text-gray-700 mt-2">{r.review_text}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No reviews</p>
                  )}
                </section>

                {/* Previous reports for context */}
                <section>
                  <h4 className="font-semibold mb-2">All Reports (History)</h4>
                  {fullView?.reports?.length ? (
                    <div className="space-y-2">
                      {fullView.reports.map((rp) => (
                        <div key={rp.id} className="border rounded-lg p-3 bg-white">
                          <div className="flex items-center justify-between">
                            <p className="text-sm">
                              <span className="font-medium">{rp.reason}</span>{' '}
                              <span className="text-gray-600">
                                — {rp.description || 'No details'}
                              </span>
                            </p>
                            <Badge
                              className={
                                rp.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-700'
                              }
                            >
                              {rp.status.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            Reporter: {rp.reporter?.full_name || 'User'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No report history</p>
                  )}
                </section>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default AdminDashboard;
