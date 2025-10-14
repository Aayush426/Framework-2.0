import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Camera, Users, Award, ArrowRight } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Redirect to appropriate dashboard
      if (parsedUser.role === 'user') {
        navigate('/user/dashboard');
      } else if (parsedUser.role === 'photographer') {
        navigate('/photographer/dashboard');
      } else if (parsedUser.role === 'admin') {
        navigate('/admin/dashboard');
      }
    }
  }, [navigate]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
        
        <nav className="relative z-10 px-6 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Camera className="w-8 h-8 text-indigo-600" />
              <span className="text-2xl font-bold text-gray-900">FrameWork</span>
            </div>
            <div className="flex gap-3">
              <Button
                data-testid="login-btn"
                variant="ghost"
                onClick={() => navigate('/login')}
                className="text-gray-700 hover:text-gray-900"
              >
                Sign In
              </Button>
              <Button
                data-testid="register-btn"
                onClick={() => navigate('/register')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Get Started
              </Button>
            </div>
          </div>
        </nav>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 sm:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-block">
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium">
                  Professional Photography Platform
                </span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Capture Moments,
                <span className="text-indigo-600"> Create Memories</span>
              </h1>
              
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                Connect with talented photographers, explore stunning portfolios, and book the perfect shoot for your special moments. Professional photography made simple.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button
                  data-testid="explore-photographers-btn"
                  onClick={() => navigate('/register?role=user')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 text-lg"
                  size="lg"
                >
                  Explore Photographers
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button
                  data-testid="join-as-photographer-btn"
                  onClick={() => navigate('/register?role=photographer')}
                  variant="outline"
                  className="border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-8 py-6 text-lg"
                  size="lg"
                >
                  Join as Photographer
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&q=80"
                  alt="Professional photographer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">500+</p>
                    <p className="text-sm text-gray-600">Expert Photographers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Why Choose FrameWork?
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              The ultimate platform connecting clients with professional photographers
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <Camera className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Curated Portfolios</h3>
              <p className="text-gray-600">
                Browse stunning portfolios organized by category. Find the perfect photographer for your vision.
              </p>
            </div>
            
            <div className="p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center mb-6">
                <Award className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Verified Professionals</h3>
              <p className="text-gray-600">
                All photographers are verified and approved by our admin team for quality assurance.
              </p>
            </div>
            
            <div className="p-8 rounded-2xl bg-gradient-to-br from-green-50 to-teal-50 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Easy Booking</h3>
              <p className="text-gray-600">
                Simple booking process with direct communication. Choose packages that fit your needs.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 px-6 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-lg sm:text-xl text-indigo-100 mb-8">
            Join thousands of satisfied clients and talented photographers
          </p>
          <Button
            data-testid="cta-register-btn"
            onClick={() => navigate('/register')}
            className="bg-white text-indigo-600 hover:bg-gray-100 px-10 py-6 text-lg font-semibold"
            size="lg"
          >
            Create Free Account
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Camera className="w-6 h-6 text-indigo-400" />
            <span className="text-xl font-bold text-white">FrameWork</span>
          </div>
          <p className="text-sm">
            © 2025 FrameWork. Professional Photography Platform.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;