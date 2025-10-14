import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, toast } from '@/App';
import { Button } from '@/components/ui/button';
import { Camera, LogOut, Users, UserCheck, Calendar, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
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

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      fetchStats();
      fetchPendingPhotographers();
      fetchAllBookings();
      fetchAllUsers();
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

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleApproval = async (photographerId, status) => {
    try {
      await axios.put(`${API}/admin/photographers/${photographerId}/approval`, {
        approval_status: status
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
          </TabsList>

          {/* Pending Approvals Tab */}
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

          {/* All Bookings Tab */}
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

          {/* All Users Tab */}
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
                  {allUsers.map((user) => (
                    <tr key={user.id} data-testid={`user-${user.id}`} className="hover:bg-gray-50">
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
                      <td className="px-6 py-4">
                        <Badge
                          className={
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-700'
                              : user.role === 'photographer'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }
                        >
                          {user.role.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;