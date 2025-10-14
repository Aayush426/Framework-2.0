import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/App';
import { Button } from '@/components/ui/button';
import { Camera, MapPin, Star, ArrowLeft } from 'lucide-react';

const PhotographerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [photographer, setPhotographer] = useState(null);
  const [profile, setProfile] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPhotographerData();
  }, [id]);

  const fetchPhotographerData = async () => {
    try {
      const [profileRes, packagesRes] = await Promise.all([
        axios.get(`${API}/photographer/profile/${id}`),
        axios.get(`${API}/packages/photographer/${id}`)
      ]);

      setProfile(profileRes.data);
      setPackages(packagesRes.data);
    } catch (error) {
      console.error('Failed to fetch photographer data', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Photographer not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Button
            data-testid="back-btn"
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-gray-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      {/* Cover Image */}
      <div className="relative h-64 sm:h-80 overflow-hidden">
        <img
          src={profile.cover_image || 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=1200&q=80'}
          alt="Cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Profile Section */}
        <div className="-mt-16 relative z-10 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col sm:flex-row gap-6">
              <img
                src={profile.profile_image || `https://ui-avatars.com/api/?name=${profile.user_id}&background=6366f1&color=fff&size=128`}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
              />
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile.user_id}</h1>
                <div className="text-gray-600 flex items-center mb-3">
                  <MapPin className="w-4 h-4 mr-1" />
                  {profile.location}
                </div>
                <p className="text-gray-700 mb-4">{profile.bio}</p>
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
                <div className="mt-4 flex gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Experience: </span>
                    <span className="font-medium">{profile.experience_years} years</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Contact: </span>
                    <span className="font-medium">{profile.phone}</span>
                  </div>
                </div>
              </div>
              <div>
                <Button
                  data-testid="view-portfolio-btn"
                  onClick={() => navigate(`/photographer/${id}/portfolio`)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto"
                >
                  View Portfolio
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Packages Section */}
        <div className="pb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Packages</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div key={pkg.id} className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{pkg.name}</h3>
                    <span className="text-xs text-gray-600">{pkg.category}</span>
                  </div>
                  <span className="text-2xl font-bold text-indigo-600">${pkg.price}</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{pkg.duration}</p>
                <p className="text-sm text-gray-700 mb-4">{pkg.description}</p>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Includes:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {pkg.deliverables.map((item, idx) => (
                      <li key={idx}>✓ {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
          {packages.length === 0 && (
            <div className="bg-white p-12 rounded-xl text-center">
              <p className="text-gray-500">No packages available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotographerProfile;