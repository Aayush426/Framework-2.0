import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, toast } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, LogOut, Search, MapPin, Star, Calendar, X, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [photographers, setPhotographers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookings, setBookings] = useState([]);
  const [selectedPhotographer, setSelectedPhotographer] = useState(null);
  const [packages, setPackages] = useState([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    package_id: '',
    booking_date: '',
    booking_time: '',
    location: '',
    message: ''
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      fetchPhotographers();
      fetchMyBookings();
    }
  }, []);

  const fetchPhotographers = async () => {
    try {
      const response = await axios.get(`${API}/photographers`);
      setPhotographers(response.data);
    } catch (error) {
      toast.error('Failed to load photographers');
    }
  };

  const fetchMyBookings = async () => {
    try {
      const response = await axios.get(`${API}/bookings/my`);
      setBookings(response.data);
    } catch (error) {
      console.error('Failed to load bookings', error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const openBookingModal = async (photographer) => {
    setSelectedPhotographer(photographer);
    try {
      const response = await axios.get(`${API}/packages/photographer/${photographer.user.id}`);
      setPackages(response.data);
      setShowBookingModal(true);
    } catch (error) {
      toast.error('Failed to load packages');
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const bookingData = {
        ...bookingForm,
        photographer_id: selectedPhotographer.user.id
      };
      await axios.post(`${API}/bookings`, bookingData);
      toast.success('Booking request sent successfully!');
      setShowBookingModal(false);
      setBookingForm({
        package_id: '',
        booking_date: '',
        booking_time: '',
        location: '',
        message: ''
      });
      fetchMyBookings();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      await axios.put(`${API}/bookings/${bookingId}/status`, { status: 'cancelled' });
      toast.success('Booking cancelled');
      fetchMyBookings();
    } catch (error) {
      toast.error('Failed to cancel booking');
    }
  };

  const filteredPhotographers = photographers.filter(
    (p) =>
      p.user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.profile.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.profile.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
              <span className="text-xl font-bold text-gray-900">FrameWork</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">Welcome, {user?.full_name}</span>
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
        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger data-testid="browse-tab" value="browse">Browse Photographers</TabsTrigger>
            <TabsTrigger data-testid="bookings-tab" value="bookings">My Bookings</TabsTrigger>
          </TabsList>

          {/* Browse Photographers Tab */}
          <TabsContent value="browse" className="space-y-6">
            {/* Search */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  data-testid="search-photographers-input"
                  type="text"
                  placeholder="Search by name, location, or specialty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Photographers Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPhotographers.map((photographer) => (
                <div
                  key={photographer.user.id}
                  data-testid={`photographer-card-${photographer.user.id}`}
                  className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-video relative overflow-hidden bg-gray-100">
                    <img
                      src={photographer.profile.cover_image || 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=600&q=80'}
                      alt={photographer.user.full_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <img
                        src={photographer.profile.profile_image || `https://ui-avatars.com/api/?name=${photographer.user.full_name}&background=6366f1&color=fff`}
                        alt={photographer.user.full_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900">{photographer.user.full_name}</h3>
                        <div className="text-sm text-gray-600 flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {photographer.profile.location}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">{photographer.profile.bio}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {photographer.profile.specialties.slice(0, 3).map((specialty, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        data-testid={`view-portfolio-btn-${photographer.user.id}`}
                        onClick={() => navigate(`/photographer/${photographer.user.id}/portfolio`)}
                        variant="outline"
                        className="flex-1"
                        size="sm"
                      >
                        View Portfolio
                      </Button>
                      <Button
                        data-testid={`book-now-btn-${photographer.user.id}`}
                        onClick={() => openBookingModal(photographer)}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                        size="sm"
                      >
                        Book Now
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredPhotographers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No photographers found</p>
              </div>
            )}
          </TabsContent>

          {/* My Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4">
            {bookings.length === 0 ? (
              <div className="bg-white p-12 rounded-xl text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No bookings yet</p>
              </div>
            ) : (
              bookings.map((booking) => (
                <div key={booking.booking.id} data-testid={`booking-${booking.booking.id}`} className="bg-white p-6 rounded-xl shadow-sm border">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4">
                      <img
                        src={booking.photographer_profile?.profile_image || `https://ui-avatars.com/api/?name=${booking.photographer?.full_name}&background=6366f1&color=fff`}
                        alt={booking.photographer?.full_name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{booking.photographer?.full_name}</h3>
                        <p className="text-sm text-gray-600">{booking.package?.name}</p>
                        <Badge className={`mt-2 ${getStatusColor(booking.booking.status)}`}>
                          {booking.booking.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    {booking.booking.status === 'pending' && (
                      <Button
                        data-testid={`cancel-booking-btn-${booking.booking.id}`}
                        onClick={() => handleCancelBooking(booking.booking.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Date</p>
                      <p className="font-medium">{booking.booking.booking_date}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Time</p>
                      <p className="font-medium">{booking.booking.booking_time}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Location</p>
                      <p className="font-medium">{booking.booking.location}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Price</p>
                      <p className="font-medium">${booking.package?.price}</p>
                    </div>
                  </div>
                  {booking.booking.message && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600"><span className="font-medium">Message:</span> {booking.booking.message}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Booking Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Book {selectedPhotographer?.user.full_name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleBooking} className="space-y-4">
            <div>
              <Label htmlFor="package">Select Package</Label>
              <Select
                value={bookingForm.package_id}
                onValueChange={(value) => setBookingForm({ ...bookingForm, package_id: value })}
                required
              >
                <SelectTrigger data-testid="booking-package-select" className="mt-1">
                  <SelectValue placeholder="Choose a package" />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {pkg.name} - ${pkg.price} ({pkg.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="booking_date">Date</Label>
                <Input
                  id="booking_date"
                  data-testid="booking-date-input"
                  type="date"
                  value={bookingForm.booking_date}
                  onChange={(e) => setBookingForm({ ...bookingForm, booking_date: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="booking_time">Time</Label>
                <Input
                  id="booking_time"
                  data-testid="booking-time-input"
                  type="time"
                  value={bookingForm.booking_time}
                  onChange={(e) => setBookingForm({ ...bookingForm, booking_time: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                data-testid="booking-location-input"
                type="text"
                value={bookingForm.location}
                onChange={(e) => setBookingForm({ ...bookingForm, location: e.target.value })}
                required
                className="mt-1"
                placeholder="Event location"
              />
            </div>

            <div>
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                data-testid="booking-message-input"
                value={bookingForm.message}
                onChange={(e) => setBookingForm({ ...bookingForm, message: e.target.value })}
                className="mt-1"
                placeholder="Any special requirements or notes..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                data-testid="booking-cancel-btn"
                type="button"
                variant="outline"
                onClick={() => setShowBookingModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                data-testid="booking-submit-btn"
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Booking Request'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserDashboard;