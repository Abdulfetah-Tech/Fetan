import React, { useState, useEffect, createContext, useContext } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Context for authentication
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching current user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { access_token, user } = response.data;
      setToken(access_token);
      setUser(user);
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API}/auth/register`, userData);
      const { access_token, user } = response.data;
      setToken(access_token);
      setUser(user);
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Registration failed' };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Global navigation context
const NavigationContext = createContext();

const NavigationProvider = ({ children }) => {
  const [currentView, setCurrentView] = useState('home');
  
  return (
    <NavigationContext.Provider value={{ currentView, setCurrentView }}>
      {children}
    </NavigationContext.Provider>
  );
};

const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

// Components
const Navbar = () => {
  const { user, logout } = useAuth();
  const { currentView, setCurrentView } = useNavigation();

  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold cursor-pointer" onClick={() => setCurrentView('home')}>
            Fetan Digital Platform
          </h1>
          {user && (
            <div className="flex space-x-4">
              <button
                onClick={() => setCurrentView('dashboard')}
                className="hover:bg-blue-700 px-3 py-2 rounded"
              >
                Dashboard
              </button>
              {user.role === 'homeowner' && (
                <button
                  onClick={() => setCurrentView('browse-providers')}
                  className="hover:bg-blue-700 px-3 py-2 rounded"
                >
                  Find Experts
                </button>
              )}
              {user.role === 'service_provider' && (
                <button
                  onClick={() => setCurrentView('service-requests')}
                  className="hover:bg-blue-700 px-3 py-2 rounded"
                >
                  Service Requests
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <span className="text-sm">Welcome, {user.name}!</span>
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentView('login')}
                className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded"
              >
                Login
              </button>
              <button
                onClick={() => setCurrentView('register')}
                className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

const HomePage = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('home');

  const services = [
    { name: 'Plumbing', icon: '🔧', image: 'https://images.pexels.com/photos/8486975/pexels-photo-8486975.jpeg' },
    { name: 'Electrical', icon: '⚡', image: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a' },
    { name: 'Carpentry', icon: '🪚', image: 'https://images.pexels.com/photos/5767926/pexels-photo-5767926.jpeg' },
    { name: 'Painting', icon: '🎨', image: 'https://images.pexels.com/photos/5217843/pexels-photo-5217843.jpeg' },
    { name: 'Landscaping', icon: '🌿', image: 'https://images.unsplash.com/photo-1683316924890-6a8c5ab10d29' },
    { name: 'HVAC', icon: '🌡️', image: 'https://images.pexels.com/photos/3990359/pexels-photo-3990359.jpeg' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-5xl font-bold mb-6">
                Connect with Trusted Home Renovation Experts
              </h1>
              <p className="text-xl mb-8">
                Find reliable contractors, get quotes, and transform your home with confidence.
                Quality work, verified professionals, hassle-free booking.
              </p>
              <div className="flex space-x-4">
                {!user && (
                  <>
                    <button
                      onClick={() => setCurrentView('register')}
                      className="bg-yellow-500 hover:bg-yellow-600 px-8 py-3 rounded-lg text-lg font-semibold"
                    >
                      Get Started
                    </button>
                    <button
                      onClick={() => setCurrentView('browse-providers')}
                      className="bg-transparent border-2 border-white hover:bg-white hover:text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold"
                    >
                      Browse Experts
                    </button>
                  </>
                )}
                {user && user.role === 'homeowner' && (
                  <button
                    onClick={() => setCurrentView('browse-providers')}
                    className="bg-yellow-500 hover:bg-yellow-600 px-8 py-3 rounded-lg text-lg font-semibold"
                  >
                    Find Experts
                  </button>
                )}
                {user && user.role === 'service_provider' && (
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className="bg-yellow-500 hover:bg-yellow-600 px-8 py-3 rounded-lg text-lg font-semibold"
                  >
                    My Dashboard
                  </button>
                )}
              </div>
            </div>
            <div className="hidden md:block">
              <img
                src="https://images.pexels.com/photos/3990359/pexels-photo-3990359.jpeg"
                alt="Home renovation"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Our Services</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <img
                  src={service.image}
                  alt={service.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <div className="flex items-center mb-3">
                    <span className="text-2xl mr-3">{service.icon}</span>
                    <h3 className="text-xl font-semibold">{service.name}</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Professional {service.name.toLowerCase()} services from certified experts.
                  </p>
                  <button
                    onClick={() => setCurrentView('browse-providers')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                  >
                    Find Experts
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-gray-100 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">Post Your Project</h3>
              <p className="text-gray-600">
                Describe your home improvement project and get connected with qualified professionals.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">Get Quotes</h3>
              <p className="text-gray-600">
                Receive quotes from verified contractors and compare their profiles and ratings.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">Hire & Complete</h3>
              <p className="text-gray-600">
                Choose the best contractor for your project and get your work done with confidence.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Fetan Digital Platform</h3>
              <p className="text-gray-400">
                Connecting homeowners with reliable home renovation and maintenance experts.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Services</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <p className="text-gray-400">Email: info@fetan.com</p>
              <p className="text-gray-400">Phone: (555) 123-4567</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center py-12">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'homeowner',
    phone: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await register(formData);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center py-12">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-bold text-center mb-6">Register</h2>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="homeowner">Homeowner</option>
                <option value="service_provider">Service Provider</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();

  if (user?.role === 'homeowner') {
    return <HomeownerDashboard />;
  } else if (user?.role === 'service_provider') {
    return <ServiceProviderDashboard />;
  } else {
    return <div>Dashboard not available for your role</div>;
  }
};

const HomeownerDashboard = () => {
  const [serviceRequests, setServiceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchServiceRequests();
  }, []);

  const fetchServiceRequests = async () => {
    try {
      const response = await axios.get(`${API}/service-requests`);
      setServiceRequests(response.data);
    } catch (error) {
      console.error('Error fetching service requests:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Dashboard</h1>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Create Service Request
          </button>
        </div>

        {showCreateForm && (
          <ServiceRequestForm
            onClose={() => setShowCreateForm(false)}
            onSuccess={() => {
              setShowCreateForm(false);
              fetchServiceRequests();
            }}
          />
        )}

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">My Service Requests</h2>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : serviceRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No service requests yet. Create your first request!
            </div>
          ) : (
            <div className="space-y-4">
              {serviceRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4 hover:shadow-md">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold">{request.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      request.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {request.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">{request.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span>Category: {request.category}</span>
                    <span>Budget: {request.budget_range}</span>
                    <span>Timeline: {request.timeline}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ServiceProviderDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateProfile, setShowCreateProfile] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchServiceRequests();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/service-providers`);
      // Find current user's profile
      const currentUserProfile = response.data.find(p => p.user_id === localStorage.getItem('user_id'));
      setProfile(currentUserProfile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchServiceRequests = async () => {
    try {
      const response = await axios.get(`${API}/service-requests`);
      setServiceRequests(response.data);
    } catch (error) {
      console.error('Error fetching service requests:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Service Provider Dashboard</h1>

        {!profile ? (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Create Your Profile</h2>
            <p className="text-gray-600 mb-4">
              You need to create a service provider profile to start receiving service requests.
            </p>
            <button
              onClick={() => setShowCreateProfile(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Create Profile
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">My Profile</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">{profile.business_name}</h3>
                <p className="text-gray-600 mb-2">{profile.description}</p>
                <p className="text-sm text-gray-500">
                  Categories: {profile.categories.join(', ')}
                </p>
                <p className="text-sm text-gray-500">
                  Experience: {profile.years_experience} years
                </p>
              </div>
            </div>
          </div>
        )}

        {showCreateProfile && (
          <ServiceProviderForm
            onClose={() => setShowCreateProfile(false)}
            onSuccess={() => {
              setShowCreateProfile(false);
              fetchProfile();
            }}
          />
        )}

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Available Service Requests</h2>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : serviceRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No service requests available.
            </div>
          ) : (
            <div className="space-y-4">
              {serviceRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4 hover:shadow-md">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold">{request.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      request.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {request.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">{request.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                    <span>Category: {request.category}</span>
                    <span>Budget: {request.budget_range}</span>
                    <span>Timeline: {request.timeline}</span>
                    <span>Location: {request.location}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Contact: {request.homeowner_name}</p>
                    <p>Email: {request.homeowner_email}</p>
                    {request.homeowner_phone && <p>Phone: {request.homeowner_phone}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ServiceRequestForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general',
    location: '',
    budget_range: '',
    timeline: '',
    images: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post(`${API}/service-requests`, formData);
      onSuccess();
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to create service request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Create Service Request</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="general">General</option>
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="carpentry">Carpentry</option>
                <option value="painting">Painting</option>
                <option value="landscaping">Landscaping</option>
                <option value="roofing">Roofing</option>
                <option value="hvac">HVAC</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                rows="4"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Budget Range
              </label>
              <input
                type="text"
                name="budget_range"
                value={formData.budget_range}
                onChange={handleChange}
                placeholder="e.g., $500-$1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Timeline
              </label>
              <input
                type="text"
                name="timeline"
                value={formData.timeline}
                onChange={handleChange}
                placeholder="e.g., Within 2 weeks"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Request'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-4 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const ServiceProviderForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    business_name: '',
    description: '',
    categories: [],
    years_experience: 0,
    portfolio_images: [],
    certifications: [],
    hourly_rate: '',
    availability: 'weekdays',
    service_areas: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    const categories = formData.categories.includes(value)
      ? formData.categories.filter(c => c !== value)
      : [...formData.categories, value];
    setFormData({ ...formData, categories });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitData = {
        ...formData,
        years_experience: parseInt(formData.years_experience),
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        service_areas: formData.service_areas.filter(area => area.trim() !== '')
      };
      
      await axios.post(`${API}/service-providers`, submitData);
      onSuccess();
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Create Service Provider Profile</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Business Name
              </label>
              <input
                type="text"
                name="business_name"
                value={formData.business_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                rows="4"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Years of Experience
              </label>
              <input
                type="number"
                name="years_experience"
                value={formData.years_experience}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Service Categories
              </label>
              <div className="space-y-2">
                {['plumbing', 'electrical', 'carpentry', 'painting', 'landscaping', 'roofing', 'hvac', 'general'].map(category => (
                  <label key={category} className="flex items-center">
                    <input
                      type="checkbox"
                      value={category}
                      checked={formData.categories.includes(category)}
                      onChange={handleCategoryChange}
                      className="mr-2"
                    />
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </label>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Hourly Rate ($)
              </label>
              <input
                type="number"
                name="hourly_rate"
                value={formData.hourly_rate}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Availability
              </label>
              <select
                name="availability"
                value={formData.availability}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="weekdays">Weekdays</option>
                <option value="weekends">Weekends</option>
                <option value="anytime">Anytime</option>
                <option value="evenings">Evenings</option>
              </select>
            </div>
            
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Profile'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-4 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const BrowseProviders = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    fetchProviders();
  }, [selectedCategory]);

  const fetchProviders = async () => {
    try {
      const params = selectedCategory ? { category: selectedCategory } : {};
      const response = await axios.get(`${API}/service-providers`, { params });
      setProviders(response.data);
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Find Service Providers</h1>
          <div className="flex space-x-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="">All Categories</option>
              <option value="plumbing">Plumbing</option>
              <option value="electrical">Electrical</option>
              <option value="carpentry">Carpentry</option>
              <option value="painting">Painting</option>
              <option value="landscaping">Landscaping</option>
              <option value="roofing">Roofing</option>
              <option value="hvac">HVAC</option>
              <option value="general">General</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : providers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No service providers found for the selected category.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider) => (
              <div key={provider.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold">{provider.business_name}</h3>
                    <span className="text-sm text-gray-500">{provider.years_experience} years</span>
                  </div>
                  <p className="text-gray-600 mb-4">{provider.description}</p>
                  
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Services:</p>
                    <div className="flex flex-wrap gap-2">
                      {provider.categories.map((category) => (
                        <span key={category} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700">Contact:</p>
                    <p className="text-sm text-gray-600">{provider.user_name}</p>
                    <p className="text-sm text-gray-600">{provider.user_email}</p>
                    {provider.user_phone && (
                      <p className="text-sm text-gray-600">{provider.user_phone}</p>
                    )}
                  </div>
                  
                  {provider.hourly_rate && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-700">Rate:</p>
                      <p className="text-lg font-bold text-green-600">${provider.hourly_rate}/hr</p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-yellow-400">★</span>
                      <span className="text-sm text-gray-600 ml-1">
                        {provider.rating.toFixed(1)} ({provider.review_count} reviews)
                      </span>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                      Contact
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const App = () => {
  const [currentView, setCurrentView] = useState('home');

  return (
    <AuthProvider>
      <Router currentView={currentView} setCurrentView={setCurrentView} />
    </AuthProvider>
  );
};

const Router = ({ currentView, setCurrentView }) => {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Listen for navigation events
    const handleNavigation = (event) => {
      if (event.detail && event.detail.view) {
        setCurrentView(event.detail.view);
      }
    };

    window.addEventListener('navigate', handleNavigation);
    return () => window.removeEventListener('navigate', handleNavigation);
  }, [setCurrentView]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Add navigation trigger function to window
  window.navigateTo = (view) => {
    setCurrentView(view);
  };

  // Add click handlers to navbar buttons
  useEffect(() => {
    const handleClick = (e) => {
      if (e.target.dataset.navigate) {
        setCurrentView(e.target.dataset.navigate);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [setCurrentView]);

  switch (currentView) {
    case 'login':
      return <LoginForm />;
    case 'register':
      return <RegisterForm />;
    case 'dashboard':
      return user ? <Dashboard /> : <LoginForm />;
    case 'browse-providers':
      return <BrowseProviders />;
    case 'service-requests':
      return user ? <Dashboard /> : <LoginForm />;
    default:
      return <HomePage />;
  }
};

export default App;