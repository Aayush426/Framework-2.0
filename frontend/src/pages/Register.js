import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import API from "../lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, Loader2 } from "lucide-react";

// ✅ Local Error Boundary to suppress harmless ResizeObserver errors
const SuppressResizeObserverBoundary = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={<>{children}</>} // fallback just re-renders children
      onError={(error) => {
        if (error.message?.includes("ResizeObserver loop")) {
          console.warn("ResizeObserver loop error suppressed (safe).");
          return;
        }
        throw error;
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

// Minimal error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error) {
    if (this.props.onError) this.props.onError(error);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "user",
  });
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    label: "",
    color: "",
  });

  // ✅ Fix for dropdown width without ResizeObserver
  const triggerRef = useRef(null);
  const [menuWidth, setMenuWidth] = useState(undefined);

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "photographer") {
      setFormData((prev) => ({ ...prev, role: "photographer" }));
    }
  }, [searchParams]);

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, password: value });

    if (!value) setPasswordStrength({ label: "", color: "" });
    else if (value.length < 6)
      setPasswordStrength({ label: "Too short", color: "bg-red-600" });
    else if (/^(?=.*[a-z])(?=.*\d)(?=.*[A-Z])(?=.*[@$!%*?&])/.test(value))
      setPasswordStrength({ label: "Strong", color: "bg-green-600" });
    else if (/^(?=.*[a-z])(?=.*\d)/.test(value))
      setPasswordStrength({ label: "Medium", color: "bg-yellow-400" });
    else setPasswordStrength({ label: "Weak", color: "bg-red-500" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await API.post("/api/auth/register", formData);
      const { access_token, user } = response.data;

      localStorage.setItem("access_token", access_token);
      localStorage.setItem("user", JSON.stringify(user));

      toast.success("Registration successful!");

      try {
        const portfoliosResponse = await API.get("/api/portfolio/my", {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        const portfolios = portfoliosResponse.data;
        localStorage.setItem("portfolios", JSON.stringify(portfolios));
        console.log("Fetched portfolios:", portfolios);
      } catch (portfolioError) {
        console.error(
          "Error fetching portfolios:",
          portfolioError.response?.data || portfolioError
        );
      }

      setTimeout(() => {
        if (user.role === "user") navigate("/user/dashboard");
        else if (user.role === "photographer")
          navigate("/photographer/dashboard");
        else if (user.role === "admin") navigate("/admin/dashboard");
      }, 50);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <Link
              to="/"
              className="flex items-center space-x-2 justify-center lg:justify-start"
            >
              <Camera className="w-8 h-8 text-indigo-600" />
              <span className="text-2xl font-bold text-gray-900">FrameWork</span>
            </Link>
            <h2 className="mt-8 text-3xl font-bold text-gray-900">
              Create your account
            </h2>
            <p className="mt-2 text-gray-600">
              Join our community of photographers and clients
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  required
                  placeholder="John Doe"
                />
              </div>

              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={handlePasswordChange}
                  required
                  placeholder="••••••••"
                />
                {formData.password && (
                  <div className="mt-1">
                    <div className="h-2 w-full bg-gray-200 rounded">
                      <div
                        className={`h-2 rounded transition-all duration-300 ${passwordStrength.color}`}
                        style={{
                          width:
                            passwordStrength.label === "Too short"
                              ? "25%"
                              : passwordStrength.label === "Weak"
                              ? "33%"
                              : passwordStrength.label === "Medium"
                              ? "66%"
                              : passwordStrength.label === "Strong"
                              ? "100%"
                              : "0%",
                        }}
                      />
                    </div>
                    <p className="text-xs mt-1 font-medium text-gray-700">
                      Strength: {passwordStrength.label}
                    </p>
                  </div>
                )}
              </div>

              {/* ✅ Dropdown wrapped in safe error boundary + fixed width */}
              <div>
                <Label htmlFor="role">I want to register as</Label>
                <SuppressResizeObserverBoundary>
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({ ...formData, role: value })
                    }
                    onOpenChange={(open) => {
                      if (open && triggerRef.current) {
                        setMenuWidth(triggerRef.current.offsetWidth);
                      }
                    }}
                  >
                    <SelectTrigger ref={triggerRef}>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent
                      style={menuWidth ? { width: `${menuWidth}px` } : undefined}
                    >
                      <SelectItem value="user">
                        Client (Book photographers)
                      </SelectItem>
                      <SelectItem value="photographer">
                        Photographer (Showcase work)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </SuppressResizeObserverBoundary>
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
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>

            <div className="text-center text-sm">
              <span className="text-gray-600">Already have an account? </span>
              <Link
                to="/login"
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Sign in here
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Right Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src="https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1200&q=80"
          alt="Photography"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20"></div>
      </div>
    </div>
  );
};

export default Register;
