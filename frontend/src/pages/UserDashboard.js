import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, toast } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  MapPin,
  Star,
  Calendar,
  Flag,
  LogOut,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const reportReasons = [
   "Hate Speech",
    "Nudity or Pornographic Content",
    "Spam or Scam",
    "Fake Profile",
    "Abusive Language",
    "Copyright Violation",
    "Harassment or Bullying",
    "Violence or Threats",
    "Discrimination",
    "Misleading Information",
    "Inappropriate Behavior",
    "Illegal Content",
    "Self-harm or Suicide Content",
    "Animal Cruelty",
    "Other"
];

const UserDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [photographers, setPhotographers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [bookings, setBookings] = useState([]);
  const [selectedPhotographer, setSelectedPhotographer] = useState(null);
  const [packages, setPackages] = useState([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    package_id: "",
    booking_date: "",
    booking_time: "",
    location: "",
    message: "",
  });

  const [aboutMeModal, setAboutMeModal] = useState(false);
  const [selectedAboutMe, setSelectedAboutMe] = useState(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [showReportSection, setShowReportSection] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
      fetchPhotographers();
      fetchMyBookings();
    }
  }, []);

  const fetchPhotographers = async () => {
    try {
      const response = await axios.get(`${API}/photographers`);
      setPhotographers(response.data || []);
    } catch (error) {
      toast.error("Failed to load photographers");
    }
  };

  const fetchMyBookings = async () => {
    try {
      const response = await axios.get(`${API}/bookings/my`);
      setBookings(response.data || []);
    } catch (error) {
      console.error("Failed to load bookings", error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const openBookingModal = async (photographer) => {
    setSelectedPhotographer(photographer);
    try {
      const response = await axios.get(
        `${API}/packages/photographer/${photographer.user.id}`
      );
      setPackages(response.data || []);
      setShowBookingModal(true);
    } catch (error) {
      toast.error("Failed to load packages");
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!selectedPhotographer) return;

    setLoading(true);
    try {
      const bookingData = {
        ...bookingForm,
        photographer_id: selectedPhotographer.user.id,
      };
      await axios.post(`${API}/bookings`, bookingData);
      toast.success("Booking request sent successfully!");
      setShowBookingModal(false);
      setBookingForm({
        package_id: "",
        booking_date: "",
        booking_time: "",
        location: "",
        message: "",
      });
      fetchMyBookings();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      await axios.put(`${API}/bookings/${bookingId}/status`, {
        status: "cancelled",
      });
      toast.success("Booking cancelled");
      fetchMyBookings();
    } catch (error) {
      toast.error("Failed to cancel booking");
    }
  };

  const openAboutMeModal = async (photographer) => {
    try {
      const res = await axios.get(`${API}/about-me/${photographer.user.id}`);
      const aboutData = {
        ...res.data,
        user_id: photographer.user.id,
        full_name: photographer.user.full_name,
        profile_image:
          res.data?.profile_image || photographer.profile?.profile_image || "",
        locations: res.data?.locations || [],
        social_links: res.data?.social_links || [],
        rating: res.data?.rating || 0,
        languages: res.data?.languages || [],
      };
      setSelectedAboutMe(aboutData);
      setRating(aboutData.rating || 0);
      setAboutMeModal(true);
      fetchReviews(photographer.user.id);
    } catch (err) {
      toast.error("Failed to fetch About Me");
    }
  };

  const fetchReviews = async (photographerId) => {
    try {
      const res = await axios.get(`${API}/reviews/${photographerId}`);
      setSelectedAboutMe((prev) => ({ ...(prev || {}), reviews: res.data || [] }));
    } catch (err) {
      console.error("Error fetching reviews", err);
    }
  };

  const submitReview = async () => {
    if (!rating || !selectedAboutMe) {
      toast.error("Please select a rating before submitting.");
      return;
    }
    if (!user) {
      toast.error("User not logged in.");
      return;
    }
    try {
      await axios.post(`${API}/reviews`, {
        photographer_id: selectedAboutMe.user_id,
        user_id: user.id, // ✅ backend requires this
        rating: rating,
        review_text: reviewText,
      });
      toast.success("Review submitted successfully!");
      setReviewText("");
      fetchReviews(selectedAboutMe.user_id);
    } catch (err) {
      console.error("Review error:", err.response?.data || err.message);
      toast.error(err.response?.data?.detail || "Failed to submit review");
    }
  };

  const submitReport = async () => {
    if (!reportReason || !selectedAboutMe) {
      toast.error("Please select a reason for the report.");
      return;
    }
    if (!user) {
      toast.error("User not logged in.");
      return;
    }
    try {
      await axios.post(`${API}/reports`, {
        photographer_id: selectedAboutMe.user_id,
        user_id: user.id, // ✅ backend requires this
        reason: reportReason,
        description: reportDescription,
      });
      toast.success("Report submitted successfully!");
      setReportReason("");
      setReportDescription("");
      setShowReportSection(false);
    } catch (err) {
      console.error("Report error:", err.response?.data || err.message);
      toast.error(err.response?.data?.detail || "Failed to submit report");
    }
  };

  const filteredPhotographers = photographers.filter((p) => {
    const nameMatch = p?.user?.full_name
      ?.toLowerCase()
      ?.includes(searchQuery.toLowerCase());
    const specialties = p?.profile?.specialties || [];
    const specMatch = specialties.some((s) =>
      s?.toLowerCase()?.includes(searchQuery.toLowerCase())
    );
    const locMatch = p?.profile?.location
      ?.toLowerCase()
      ?.includes(searchQuery.toLowerCase());
    return Boolean(nameMatch || specMatch || locMatch);
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      case "cancelled":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-xl font-bold text-indigo-700">FrameWork</div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Welcome{user?.full_name ? `, ${user.full_name}` : ""}
            </span>
            <Button variant="ghost" onClick={handleLogout} className="text-gray-600">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="browse">Browse Photographers</TabsTrigger>
            <TabsTrigger value="bookings">My Bookings</TabsTrigger>
          </TabsList>

          {/* Browse Photographers */}
          <TabsContent value="browse" className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search by name, location, or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPhotographers.map((photographer) => (
                <div
                  key={photographer?.user?.id}
                  className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div
                    className="aspect-video relative overflow-hidden bg-gray-100 cursor-pointer"
                    onClick={() => openAboutMeModal(photographer)}
                  >
                    <img
                      src={
                        photographer?.profile?.cover_image ||
                        "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=600&q=80"
                      }
                      alt={photographer?.user?.full_name || "Cover"}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <img
                        src={
                          photographer?.profile?.profile_image ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            photographer?.user?.full_name || "User"
                          )}&background=6366f1&color=fff`
                        }
                        alt={photographer?.user?.full_name || "Avatar"}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900">
                          {photographer?.user?.full_name || "Unnamed"}
                        </h3>
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {photographer?.profile?.location ||
                            "Location not specified"}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                      {photographer?.profile?.bio || "No bio available."}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {(photographer?.profile?.specialties || [])
                        .slice(0, 3)
                        .map((specialty, idx) => (
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
                        onClick={() =>
                          navigate(
                            `/photographer/${photographer?.user?.id}/portfolio`
                          )
                        }
                        variant="outline"
                        className="flex-1"
                        size="sm"
                      >
                        View Portfolio
                      </Button>
                      <Button
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

          {/* Bookings */}
          <TabsContent value="bookings" className="space-y-4">
            {bookings.length === 0 ? (
              <div className="bg-white p-12 rounded-xl text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No bookings yet</p>
              </div>
            ) : (
              bookings.map((booking) => (
                <div
                  key={booking?.booking?.id}
                  className="bg-white p-6 rounded-xl shadow-sm border"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4">
                      <img
                        src={
                          booking?.photographer_profile?.profile_image ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            booking?.photographer?.full_name || "Photographer"
                          )}&background=6366f1&color=fff`
                        }
                        alt={booking?.photographer?.full_name || "Photographer"}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">
                          {booking?.photographer?.full_name || "Unnamed"}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {booking?.package?.name || "Package"}
                        </p>
                        <Badge
                          className={`mt-2 ${getStatusColor(
                            booking?.booking?.status
                          )}`}
                        >
                          {(booking?.booking?.status || "unknown").toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    {booking?.booking?.status === "pending" && (
                      <Button
                        onClick={() =>
                          handleCancelBooking(booking?.booking?.id)
                        }
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
                      <p className="font-medium">
                        {booking?.booking?.booking_date || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Time</p>
                      <p className="font-medium">
                        {booking?.booking?.booking_time || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Location</p>
                      <p className="font-medium">
                        {booking?.booking?.location || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Price</p>
                      <p className="font-medium">
                        {booking?.package?.price
                          ? `$${booking.package.price}`
                          : "-"}
                      </p>
                    </div>
                  </div>
                  {booking?.booking?.message && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Message:</span>{" "}
                        {booking.booking.message}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* About Me + Review & Report Modal */}
      <Dialog open={aboutMeModal} onOpenChange={setAboutMeModal}>
        <DialogContent className="max-w-xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              About {selectedAboutMe?.full_name || "Photographer"}
            </DialogTitle>
          </DialogHeader>

          {selectedAboutMe && (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <img
                  src={
                    selectedAboutMe.profile_image ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      selectedAboutMe.full_name || "User"
                    )}&background=6366f1&color=fff`
                  }
                  alt={selectedAboutMe.full_name || "User"}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-bold text-lg">
                    {selectedAboutMe.full_name}
                  </h3>
                  {selectedAboutMe.languages?.length > 0 && (
                    <p className="text-sm text-gray-600">
                      Languages: {selectedAboutMe.languages.join(", ")}
                    </p>
                  )}
                </div>
              </div>

              {selectedAboutMe.about && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-1">Bio</h4>
                  <p className="text-gray-600">{selectedAboutMe.about}</p>
                </div>
              )}

              {/* Rating + Review */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-700 mb-2">
                  Rate & Review
                </h4>

                <div className="flex items-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-6 h-6 cursor-pointer ${
                        star <= rating ? "text-yellow-400" : "text-gray-300"
                      }`}
                      onClick={() => setRating(star)}
                    />
                  ))}
                </div>

                <Textarea
                  placeholder="Write your review..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                />

                <div className="flex justify-end mt-2">
                  <Button
                    onClick={submitReview}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Submit Review
                  </Button>
                </div>

                {/* Display Reviews */}
                {selectedAboutMe.reviews &&
                  selectedAboutMe.reviews.length > 0 && (
                    <div className="mt-4 space-y-3 border-t pt-4">
                      <h4 className="font-semibold text-gray-700">
                        User Reviews
                      </h4>
                      {selectedAboutMe.reviews.map((r) => (
                        <div
                          key={r.id || `${r.user_name}-${r.rating}`}
                          className="border rounded-md p-3 bg-gray-50 shadow-sm"
                        >
                          <p className="font-semibold text-gray-800">
                            {r.user_name || "Anonymous"}
                          </p>
                          <p className="text-yellow-500 text-sm mb-1">
                            {"⭐".repeat(r.rating || 0)}
                          </p>
                          <p className="text-gray-700 text-sm">
                            {r.review_text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              {/* Report Section */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-gray-700">
                    Report Photographer
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReportSection(!showReportSection)}
                    className="text-red-600 border-red-500 hover:bg-red-50"
                  >
                    <Flag className="w-4 h-4 mr-1" />
                    {showReportSection ? "Cancel" : "Report"}
                  </Button>
                </div>

                {showReportSection && (
                  <div className="mt-3 space-y-3">
                    <Select
                      value={reportReason}
                      onValueChange={(v) => setReportReason(v)}
                    >
                      <SelectTrigger className="border-gray-300">
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                      {/* ✅ FIXED WIDTH DROPDOWN */}
                      <SelectContent
                        align="start"
                        className="min-w-[260px] w-[var(--radix-select-trigger-width)]"
                      >
                        {reportReasons.map((reason, idx) => (
                          <SelectItem key={idx} value={reason}>
                            {reason}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Textarea
                      placeholder="Optional description..."
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                    />

                    <div className="flex justify-end">
                      <Button
                        onClick={submitReport}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Submit Report
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="flex justify-end mt-6">
                <Button variant="outline" onClick={() => setAboutMeModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Booking Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Book {selectedPhotographer?.user?.full_name || "Photographer"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Select
              value={bookingForm.package_id}
              onValueChange={(v) =>
                setBookingForm((prev) => ({ ...prev, package_id: v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a package" />
              </SelectTrigger>
              <SelectContent>
                {packages.map((pkg) => (
                  <SelectItem key={pkg.id} value={String(pkg.id)}>
                    {pkg.name} {pkg.price ? `- $${pkg.price}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={bookingForm.booking_date}
              onChange={(e) =>
                setBookingForm((prev) => ({
                  ...prev,
                  booking_date: e.target.value,
                }))
              }
            />
            <Input
              type="time"
              value={bookingForm.booking_time}
              onChange={(e) =>
                setBookingForm((prev) => ({
                  ...prev,
                  booking_time: e.target.value,
                }))
              }
            />
            <Input
              placeholder="Location"
              value={bookingForm.location}
              onChange={(e) =>
                setBookingForm((prev) => ({
                  ...prev,
                  location: e.target.value,
                }))
              }
            />
            <Textarea
              placeholder="Message (optional)"
              value={bookingForm.message}
              onChange={(e) =>
                setBookingForm((prev) => ({
                  ...prev,
                  message: e.target.value,
                }))
              }
            />

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowBookingModal(false)}
              >
                Close
              </Button>
              <Button
                onClick={handleBooking}
                disabled={loading || !bookingForm.package_id}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {loading ? "Submitting..." : "Submit Booking"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserDashboard;
