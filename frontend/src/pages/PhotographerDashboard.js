import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, toast } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, LogOut, Plus, Trash2, Loader2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

const PREDEFINED_CATEGORIES = ['Wedding', 'Portrait', 'Event', 'Commercial', 'Nature', 'Fashion', 'Sports', 'Food'];

const PhotographerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [packages, setPackages] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [profileForm, setProfileForm] = useState({
    bio: '',
    specialties: [],
    experience_years: 0,
    phone: '',
    location: '',
    profile_image: '',
    cover_image: ''
  });

  const [portfolioForm, setPortfolioForm] = useState({
    category: '',
    title: '',
    description: '',
    image_url: ''
  });

  const [packageForm, setPackageForm] = useState({
    name: '',
    type: 'custom',
    category: '',
    description: '',
    price: 0,
    duration: '',
    deliverables: []
  });

  const [specialtyInput, setSpecialtyInput] = useState('');
  const [deliverableInput, setDeliverableInput] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      fetchProfile();
      fetchPortfolio();
      fetchPackages();
      fetchBookings();
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/photographer/profile/me`);
      setProfile(response.data);
      setProfileForm({
        bio: response.data.bio,
        specialties: response.data.specialties,
        experience_years: response.data.experience_years,
        phone: response.data.phone,
        location: response.data.location,
        profile_image: response.data.profile_image || '',
        cover_image: response.data.cover_image || ''
      });
    } catch (error) {
      if (error.response?.status === 404) {
        setShowProfileModal(true);
      }
    }
  };

  const fetchPortfolio = async () => {
    try {
      const response = await axios.get(`${API}/portfolio/my`);
      setPortfolioItems(response.data);
    } catch (error) {
      console.error('Failed to fetch portfolio', error);
    }
  };

  const fetchPackages = async () => {
    try {
      const response = await axios.get(`${API}/packages/my`);
      setPackages(response.data);
    } catch (error) {
      console.error('Failed to fetch packages', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${API}/bookings/my`);
      setBookings(response.data);
    } catch (error) {
      console.error('Failed to fetch bookings', error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (profile) {
        await axios.put(`${API}/photographer/profile`, profileForm);
        toast.success('Profile updated successfully!');
      } else {
        await axios.post(`${API}/photographer/profile`, profileForm);
        toast.success('Profile created successfully!');
      }
      setShowProfileModal(false);
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Profile operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePortfolioSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/portfolio`, portfolioForm);
      toast.success('Portfolio item added!');
      setShowPortfolioModal(false);
      setPortfolioForm({
        category: '',
        title: '',
        description: '',
        image_url: ''
      });
      fetchPortfolio();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add portfolio item');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePortfolioItem = async (itemId) => {
    try {
      await axios.delete(`${API}/portfolio/${itemId}`);
      toast.success('Portfolio item deleted');
      fetchPortfolio();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const handlePackageSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/packages`, packageForm);
      toast.success('Package created!');
      setShowPackageModal(false);
      setPackageForm({
        name: '',
        type: 'custom',
        category: '',
        description: '',
        price: 0,
        duration: '',
        deliverables: []
      });
      fetchPackages();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create package');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePackage = async (packageId) => {
    try {
      await axios.delete(`${API}/packages/${packageId}`);
      toast.success('Package deleted');
      fetchPackages();
    } catch (error) {
      toast.error('Failed to delete package');
    }
  };

  const handleBookingStatus = async (bookingId, status) => {
    try {
      await axios.put(`${API}/bookings/${bookingId}/status`, { status });
      toast.success(`Booking ${status}`);
      fetchBookings();
    } catch (error) {
      toast.error('Failed to update booking');
    }
  };

  const addSpecialty = () => {
    if (specialtyInput.trim() && !profileForm.specialties.includes(specialtyInput.trim())) {
      setProfileForm({
        ...profileForm,
        specialties: [...profileForm.specialties, specialtyInput.trim()]
      });
      setSpecialtyInput('');
    }
  };

  const removeSpecialty = (specialty) => {
    setProfileForm({
      ...profileForm,
      specialties: profileForm.specialties.filter((s) => s !== specialty)
    });
  };

  const addDeliverable = () => {
    if (deliverableInput.trim() && !packageForm.deliverables.includes(deliverableInput.trim())) {
      setPackageForm({
        ...packageForm,
        deliverables: [...packageForm.deliverables, deliverableInput.trim()]
      });
      setDeliverableInput('');
    }
  };

  const removeDeliverable = (deliverable) => {
    setPackageForm({
      ...packageForm,
      deliverables: packageForm.deliverables.filter((d) => d !== deliverable)
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const groupedPortfolio = portfolioItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

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
        {/* Profile Status Alert */}
        {profile && (
          <Alert className={`mb-6 ${profile.approval_status === 'approved' ? 'border-green-200 bg-green-50' : profile.approval_status === 'pending' ? 'border-yellow-200 bg-yellow-50' : 'border-red-200 bg-red-50'}`}>
            <AlertDescription className="flex items-center gap-2">
              {profile.approval_status === 'approved' ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-800">Your profile is approved! Clients can now view your portfolio and book your services.</span>
                </>
              ) : profile.approval_status === 'pending' ? (
                <>
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <span className="text-yellow-800">Your profile is pending admin approval. You can still create your portfolio and packages.</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-800">Your profile was rejected. Please update your profile and resubmit.</span>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {!profile && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <AlertDescription className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <span className="text-blue-800">Please complete your profile to get started.</span>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger data-testid="profile-tab" value="profile">Profile</TabsTrigger>
            <TabsTrigger data-testid="portfolio-tab" value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger data-testid="packages-tab" value="packages">Packages</TabsTrigger>
            <TabsTrigger data-testid="bookings-tab" value="bookings">Bookings</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="bg-white p-8 rounded-xl shadow-sm border">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">My Profile</h2>
                <Button
                  data-testid="edit-profile-btn"
                  onClick={() => setShowProfileModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {profile ? 'Edit Profile' : 'Create Profile'}
                </Button>
              </div>

              {profile ? (
                <div className="space-y-6">
                  <div className="flex gap-6">
                    <img
                      src={profile.profile_image || `https://ui-avatars.com/api/?name=${user?.full_name}&background=6366f1&color=fff&size=128`}
                      alt={user?.full_name}
                      className="w-32 h-32 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">{user?.full_name}</h3>
                      <p className="text-gray-600 mt-2">{profile.bio}</p>
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Experience</p>
                          <p className="font-medium">{profile.experience_years} years</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Location</p>
                          <p className="font-medium">{profile.location}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <p className="font-medium">{profile.phone}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <Badge className={getStatusColor(profile.approval_status)}>
                            {profile.approval_status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">Specialties</p>
                        <div className="flex flex-wrap gap-2">
                          {profile.specialties.map((specialty, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                            >
                              {specialty}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No profile created yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">My Portfolio</h2>
                <Button
                  data-testid="add-portfolio-btn"
                  onClick={() => setShowPortfolioModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  disabled={!profile || profile.approval_status !== 'approved'}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Work
                </Button>
              </div>

              {Object.keys(groupedPortfolio).length === 0 ? (
                <div className="bg-white p-12 rounded-xl text-center">
                  <p className="text-gray-500">No portfolio items yet</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(groupedPortfolio).map(([category, items]) => (
                    <div key={category}>
                      <h3 className="text-xl font-bold mb-4">{category}</h3>
                      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            data-testid={`portfolio-item-${item.id}`}
                            className="relative group bg-white rounded-lg overflow-hidden shadow-sm border"
                          >
                            <div className="aspect-square overflow-hidden">
                              <img
                                src={item.image_url}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <div className="p-3">
                              <h4 className="font-medium text-sm">{item.title}</h4>
                              <p className="text-xs text-gray-600 line-clamp-2">{item.description}</p>
                            </div>
                            <Button
                              data-testid={`delete-portfolio-btn-${item.id}`}
                              onClick={() => handleDeletePortfolioItem(item.id)}
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2 bg-white/90 hover:bg-red-100 text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Packages Tab */}
          <TabsContent value="packages">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">My Packages</h2>
                <Button
                  data-testid="add-package-btn"
                  onClick={() => setShowPackageModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  disabled={!profile}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Package
                </Button>
              </div>

              {packages.length === 0 ? (
                <div className="bg-white p-12 rounded-xl text-center">
                  <p className="text-gray-500">No packages created yet</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {packages.map((pkg) => (
                    <div key={pkg.id} data-testid={`package-${pkg.id}`} className="bg-white p-6 rounded-xl shadow-sm border">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold">{pkg.name}</h3>
                          <Badge className="mt-1">{pkg.category}</Badge>
                        </div>
                        <Button
                          data-testid={`delete-package-btn-${pkg.id}`}
                          onClick={() => handleDeletePackage(pkg.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-2xl font-bold text-indigo-600 mb-2">${pkg.price}</p>
                      <p className="text-sm text-gray-600 mb-4">{pkg.duration}</p>
                      <p className="text-sm text-gray-700 mb-4">{pkg.description}</p>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Deliverables:</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {pkg.deliverables.map((item, idx) => (
                            <li key={idx}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Booking Requests</h2>
              
              {bookings.length === 0 ? (
                <div className="bg-white p-12 rounded-xl text-center">
                  <p className="text-gray-500">No bookings yet</p>
                </div>
              ) : (
                bookings.map((booking) => (
                  <div key={booking.booking.id} data-testid={`booking-${booking.booking.id}`} className="bg-white p-6 rounded-xl shadow-sm border">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-4">
                        <img
                          src={`https://ui-avatars.com/api/?name=${booking.user?.full_name}&background=6366f1&color=fff`}
                          alt={booking.user?.full_name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div>
                          <h3 className="font-bold text-lg">{booking.user?.full_name}</h3>
                          <p className="text-sm text-gray-600">{booking.user?.email}</p>
                          <Badge className={`mt-2 ${getStatusColor(booking.booking.status)}`}>
                            {booking.booking.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      {booking.booking.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            data-testid={`approve-booking-btn-${booking.booking.id}`}
                            onClick={() => handleBookingStatus(booking.booking.id, 'approved')}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                          >
                            Approve
                          </Button>
                          <Button
                            data-testid={`reject-booking-btn-${booking.booking.id}`}
                            onClick={() => handleBookingStatus(booking.booking.id, 'rejected')}
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            size="sm"
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
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
                        <p className="text-gray-600">Time</p>
                        <p className="font-medium">{booking.booking.booking_time}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-600">Location</p>
                        <p className="font-medium">{booking.booking.location}</p>
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
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Profile Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{profile ? 'Edit Profile' : 'Create Profile'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                data-testid="profile-bio-input"
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                required
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="experience_years">Years of Experience</Label>
                <Input
                  id="experience_years"
                  data-testid="profile-experience-input"
                  type="number"
                  value={profileForm.experience_years}
                  onChange={(e) => setProfileForm({ ...profileForm, experience_years: parseInt(e.target.value) })}
                  required
                  className="mt-1"
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  data-testid="profile-phone-input"
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                data-testid="profile-location-input"
                type="text"
                value={profileForm.location}
                onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="profile_image">Profile Image URL</Label>
              <Input
                id="profile_image"
                data-testid="profile-image-input"
                type="url"
                value={profileForm.profile_image}
                onChange={(e) => setProfileForm({ ...profileForm, profile_image: e.target.value })}
                className="mt-1"
                placeholder="https://..."
              />
            </div>

            <div>
              <Label htmlFor="cover_image">Cover Image URL</Label>
              <Input
                id="cover_image"
                data-testid="profile-cover-input"
                type="url"
                value={profileForm.cover_image}
                onChange={(e) => setProfileForm({ ...profileForm, cover_image: e.target.value })}
                className="mt-1"
                placeholder="https://..."
              />
            </div>

            <div>
              <Label>Specialties</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  data-testid="profile-specialty-input"
                  type="text"
                  value={specialtyInput}
                  onChange={(e) => setSpecialtyInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                  placeholder="Add specialty..."
                />
                <Button
                  data-testid="add-specialty-btn"
                  type="button"
                  onClick={addSpecialty}
                  variant="outline"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {profileForm.specialties.map((specialty, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center gap-2"
                  >
                    {specialty}
                    <button
                      type="button"
                      onClick={() => removeSpecialty(specialty)}
                      className="hover:text-indigo-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowProfileModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                data-testid="profile-submit-btn"
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (profile ? 'Update Profile' : 'Create Profile')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Portfolio Modal */}
      <Dialog open={showPortfolioModal} onOpenChange={setShowPortfolioModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Portfolio Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePortfolioSubmit} className="space-y-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={portfolioForm.category}
                onValueChange={(value) => setPortfolioForm({ ...portfolioForm, category: value })}
                required
              >
                <SelectTrigger data-testid="portfolio-category-select" className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {PREDEFINED_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                data-testid="portfolio-title-input"
                type="text"
                value={portfolioForm.title}
                onChange={(e) => setPortfolioForm({ ...portfolioForm, title: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                data-testid="portfolio-description-input"
                value={portfolioForm.description}
                onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })}
                required
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="image_url">Image URL</Label>
              <Input
                id="image_url"
                data-testid="portfolio-image-input"
                type="url"
                value={portfolioForm.image_url}
                onChange={(e) => setPortfolioForm({ ...portfolioForm, image_url: e.target.value })}
                required
                className="mt-1"
                placeholder="https://..."
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPortfolioModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                data-testid="portfolio-submit-btn"
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Item'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Package Modal */}
      <Dialog open={showPackageModal} onOpenChange={setShowPackageModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Package</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePackageSubmit} className="space-y-4">
            <div>
              <Label htmlFor="package_name">Package Name</Label>
              <Input
                id="package_name"
                data-testid="package-name-input"
                type="text"
                value={packageForm.name}
                onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="package_type">Type</Label>
                <Select
                  value={packageForm.type}
                  onValueChange={(value) => setPackageForm({ ...packageForm, type: value })}
                >
                  <SelectTrigger data-testid="package-type-select" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="predefined">Pre-defined</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="package_category">Category</Label>
                <Select
                  value={packageForm.category}
                  onValueChange={(value) => setPackageForm({ ...packageForm, category: value })}
                  required
                >
                  <SelectTrigger data-testid="package-category-select" className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {PREDEFINED_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="package_description">Description</Label>
              <Textarea
                id="package_description"
                data-testid="package-description-input"
                value={packageForm.description}
                onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                required
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="package_price">Price ($)</Label>
                <Input
                  id="package_price"
                  data-testid="package-price-input"
                  type="number"
                  value={packageForm.price}
                  onChange={(e) => setPackageForm({ ...packageForm, price: parseFloat(e.target.value) })}
                  required
                  className="mt-1"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <Label htmlFor="package_duration">Duration</Label>
                <Input
                  id="package_duration"
                  data-testid="package-duration-input"
                  type="text"
                  value={packageForm.duration}
                  onChange={(e) => setPackageForm({ ...packageForm, duration: e.target.value })}
                  required
                  className="mt-1"
                  placeholder="e.g., 2 hours"
                />
              </div>
            </div>

            <div>
              <Label>Deliverables</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  data-testid="package-deliverable-input"
                  type="text"
                  value={deliverableInput}
                  onChange={(e) => setDeliverableInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDeliverable())}
                  placeholder="Add deliverable..."
                />
                <Button
                  data-testid="add-deliverable-btn"
                  type="button"
                  onClick={addDeliverable}
                  variant="outline"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-1 mt-2">
                {packageForm.deliverables.map((deliverable, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-2 bg-gray-50 rounded text-sm flex items-center justify-between"
                  >
                    <span>{deliverable}</span>
                    <button
                      type="button"
                      onClick={() => removeDeliverable(deliverable)}
                      className="text-red-600 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPackageModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                data-testid="package-submit-btn"
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Package'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PhotographerDashboard;
