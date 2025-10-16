import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import API from "../lib/api"; // Axios instance with baseURL
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Loader2 } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await API.post('/api/auth/login', formData);
      const { access_token, user } = response.data;

      // Store token & user info
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(user));

      toast.success('Login successful!');

      // Fetch portfolios after login
      try {
        const portfoliosResponse = await API.get('/api/portfolio/my', {
          headers: { Authorization: `Bearer ${access_token}` }
        });
        const portfolios = portfoliosResponse.data;
        localStorage.setItem('portfolios', JSON.stringify(portfolios));
        console.log('Fetched portfolios:', portfolios);
      } catch (portfolioError) {
        console.error('Error fetching portfolios:', portfolioError.response?.data || portfolioError);
      }

      // Navigate according to role
      if (user.role === 'user') navigate('/user/dashboard');
      else if (user.role === 'photographer') navigate('/photographer/dashboard');
      else if (user.role === 'admin') navigate('/admin/dashboard');

    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <Link to="/" className="flex items-center space-x-2 justify-center lg:justify-start">
              <Camera className="w-8 h-8 text-indigo-600" />
              <span className="text-2xl font-bold text-gray-900">FrameWork</span>
            </Link>
            <h2 className="mt-8 text-3xl font-bold text-gray-900">Welcome back</h2>
            <p className="mt-2 text-gray-600">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="mt-1"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="mt-1"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : 'Sign in'}
            </Button>

            <div className="text-center text-sm">
              <span className="text-gray-600">Don't have an account? </span>
              <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Register here
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src="https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=1200&q=80"
          alt="Photography"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20"></div>
      </div>
    </div>
  );
};

export default Login;
