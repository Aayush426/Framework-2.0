import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from "../lib/api"; // Axios instance
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Loader2, Camera, LogOut, X, ChevronLeft, ChevronRight } from 'lucide-react';

const UserDashboard = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [photographers, setPhotographers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingPhotographers, setLoadingPhotographers] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPhotographer, setSelectedPhotographer] = useState(null);
  const [selectedPortfolios, setSelectedPortfolios] = useState([]);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [activePortfolioIndex, setActivePortfolioIndex] = useState(0);

  // Fetch user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login', { replace: true });
    }
    setLoadingUser(false);
  }, [navigate]);

  // Fetch approved photographers
  useEffect(() => {
    const fetchPhotographers = async () => {
      try {
        setLoadingPhotographers(true);
        const token = localStorage.getItem('access_token');

        const res = await API.get('/photographers', {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Defensively handle API response that could be an array or an object
        const photographersList = Array.isArray(res.data) ? res.data : res.data.photographers || [];
        
        // For performance, this filtering is ideally done on the backend (e.g., /photographers?status=approved)
        const approved = photographersList.filter(
          (p) => p.profile?.approval_status?.toLowerCase() === 'approved'
        );

        setPhotographers(approved);
      } catch (err) {
        console.error("Failed to fetch photographers:", err);
        toast.error('Failed to fetch photographers');
      } finally {
        setLoadingPhotographers(false);
      }
    };

    fetchPhotographers();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    toast.success("Logged out successfully");
    navigate('/login', { replace: true });
  };

  // Open portfolio modal and fetch portfolios of the selected photographer
  const openPortfolioModal = async (photographer) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error("Authentication error. Please log in again.");
      navigate('/login', { replace: true });
      return;
    }

    setSelectedPhotographer(photographer);
    setPortfolioLoading(true);
    setModalOpen(true);
    // Reset state for the new modal view
    setSelectedPortfolios([]);
    setActivePortfolioIndex(0);

    try {
      const res = await API.get(`/portfolios?photographer_id=${photographer.user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // **CHANGED**: Robustly handle if API returns a direct array or a nested object
      const portfolios = Array.isArray(res.data) ? res.data : res.data.portfolios || [];
      setSelectedPortfolios(portfolios);
    } catch (err) {
      console.error("Failed to fetch portfolios:", err);
      // Provide a more specific error if the API returns a 404
      if (err.response && err.response.status === 404) {
          toast.info('This photographer has not uploaded any portfolios yet.');
      } else {
          toast.error('Failed to fetch portfolios');
      }
    } finally {
      setPortfolioLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedPhotographer(null);
    setSelectedPortfolios([]);
  };

  // The modulo operator (%) ensures the index loops back to the start/end
  const nextPortfolio = () => {
    if (selectedPortfolios.length === 0) return;
    setActivePortfolioIndex((prev) => (prev + 1) % selectedPortfolios.length);
  };

  const prevPortfolio = () => {
    if (selectedPortfolios.length === 0) return;
    setActivePortfolioIndex((prev) => (prev - 1 + selectedPortfolios.length) % selectedPortfolios.length);
  };

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // This prevents a brief flash of the dashboard before redirecting
  if (!user) return null;

  const filteredPhotographers = photographers.filter(
    p => p.user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // A variable to hold the currently active portfolio to simplify JSX
  const activePortfolio = selectedPortfolios[activePortfolioIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Camera className="w-7 h-7 text-indigo-600" />
            <span className="text-xl font-bold text-gray-900">FrameWork</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700 hidden sm:block">Welcome, {user.full_name}</span>
            <Button variant="ghost" onClick={handleLogout} className="text-gray-600">
              <LogOut className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-900">Find Photographers</h2>
        <p className="text-gray-600 mt-2">Browse approved photographers and view their portfolios.</p>

        <div className="mt-4">
          <Input
            placeholder="Search photographers by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md"
          />
        </div>

        {loadingPhotographers ? (
          <div className="flex justify-center mt-8">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {filteredPhotographers.length === 0 && (
                <p className="text-gray-500 col-span-full">No approved photographers found.</p>
            )}
            {filteredPhotographers.map((photographer) => (
              <div key={photographer.user.id} className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
                <img
                  src={photographer.profile.profile_image || '/placeholder.jpg'}
                  alt={photographer.user.full_name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="text-lg font-semibold">{photographer.user.full_name}</h3>
                  <p className="text-gray-600 text-sm mt-1 flex-grow">{photographer.profile.bio || 'No bio available'}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {(photographer.profile.specialties || []).join(', ')} | {photographer.profile.experience_years || 0} yrs
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => openPortfolioModal(photographer)}>View Portfolios</Button>
                    <Button size="sm" variant="secondary" onClick={() => toast('Booking feature coming soon!')}>Book</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Portfolio Modal with Carousel */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="relative max-w-4xl w-full bg-white rounded-lg p-6 overflow-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-800" onClick={closeModal} aria-label="Close modal">
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-xl font-bold mb-4">{selectedPhotographer?.user.full_name}'s Portfolio</h2>

            {portfolioLoading ? (
              <div className="flex justify-center items-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : selectedPortfolios.length === 0 ? (
              <div className="flex justify-center items-center h-96">
                <p className="text-gray-500">No portfolios available for this photographer.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-full h-96 relative mb-4">
                  {/* **CHANGED**: Use optional chaining `?.` to prevent errors if activePortfolio is not yet defined */}
                  <img
                    src={activePortfolio?.image_url || '/placeholder.jpg'}
                    alt={activePortfolio?.title || 'Portfolio Image'}
                    className="w-full h-full object-contain rounded"
                  />

                  {/* Carousel Controls */}
                  {selectedPortfolios.length > 1 && (
                    <>
                      <button
                        className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-white bg-opacity-60 hover:bg-opacity-90 p-2 rounded-full shadow-md"
                        onClick={prevPortfolio}
                        aria-label="Previous portfolio"
                      >
                        <ChevronLeft />
                      </button>
                      <button
                        className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-white bg-opacity-60 hover:bg-opacity-90 p-2 rounded-full shadow-md"
                        onClick={nextPortfolio}
                        aria-label="Next portfolio"
                      >
                        <ChevronRight />
                      </button>
                    </>
                  )}
                </div>
                
                <p className="h-10 text-gray-600 text-center">{activePortfolio?.description || ''}</p>

                {/* Thumbnails */}
                <div className="flex gap-2 mt-4 overflow-x-auto p-2 w-full justify-center">
                  {selectedPortfolios.map((p, idx) => (
                    <img
                      key={p.id || idx}
                      src={p.image_url || '/placeholder.jpg'}
                      alt={p.title || `Portfolio ${idx + 1}`}
                      className={`w-20 h-20 object-cover rounded cursor-pointer flex-shrink-0 border-2 ${
                        idx === activePortfolioIndex ? 'border-indigo-600' : 'border-transparent'
                      }`}
                      onClick={() => setActivePortfolioIndex(idx)}
                      // **ADDED**: Accessibility for keyboard navigation
                      role="button"
                      tabIndex="0"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                           setActivePortfolioIndex(idx);
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;