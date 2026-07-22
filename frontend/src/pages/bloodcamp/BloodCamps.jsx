import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/auth/useAuth";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Search,
  ChevronRight,
  Info,
  Home,
  Phone,
  Settings,
  Tent,
  Clipboard,
  LogOut,
  Droplet,
} from "lucide-react";
import { getUpcomingCamps } from "../../services/campService";
import "./BloodCamps.css";

const BloodCamps = () => {
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, logout } = useAuth(); // Assuming logout is available
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCamps();
  }, []);

  const fetchCamps = async () => {
    try {
      setLoading(true);
      const data = await getUpcomingCamps();
      setCamps(data);
    } catch (error) {
      console.error("Error fetching camps:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCamps = camps.filter(
    (camp) =>
      (camp.title &&
        camp.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (camp.location &&
        camp.location.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const handleRegisterClick = (e, campId) => {
    e.preventDefault();
    if (isAuthenticated) {
      navigate("/donor/register", { state: { selectedCampId: campId } });
    } else {
      navigate("/login", {
        state: { returnTo: "/donor/register", selectedCampId: campId },
      });
    }
  };

  return (
    <div className="blood-ops-layout">
      {/* Top Navigation Bar - Matches the Lab Dashboard Target */}
      <nav className="top-navbar">
        <div className="nav-brand">
          <Droplet fill="#dc2626" color="#dc2626" size={24} />
          <span className="logo-text">HOPEDROP</span>
        </div>

        <div className="nav-links">
          <Link to="/">
            <Home size={16} /> HOME
          </Link>
          <Link to="/events">
            <Calendar size={16} /> EVENTS
          </Link>
          <Link to="/contact">
            <Phone size={16} /> CONTACT
          </Link>
          <Link to="/about">
            <Info size={16} /> ABOUT US
          </Link>
          <Link to="/services">
            <Settings size={16} /> SERVICES
          </Link>
          {/* Active indicator on Camp */}
          <Link to="/camps" className="active-pill">
            <Tent size={16} /> CAMP
          </Link>
          <Link to="/lab">
            <Clipboard size={16} /> LAB
          </Link>
        </div>

        <div className="nav-actions">
          {isAuthenticated ? (
            <button onClick={logout} className="btn-logout">
              <LogOut size={16} /> LOGOUT
            </button>
          ) : (
            <button onClick={() => navigate("/login")} className="btn-logout">
              LOGIN
            </button>
          )}
        </div>
      </nav>

      {/* Main Dashboard Content */}
      <main className="dashboard-content">
        {/* Page Header replacing the old Hero */}
        <div className="camps-hero">
          <div className="camps-hero-content">
            <span className="camps-hero-badge">Upcoming Camps</span>
            <h1>Available Blood Camps</h1>
            <p>Find a blood camp near you and help save lives.</p>
          </div>
        </div>

        {/* Actions Bar (Search Filter) */}
        <div className="camps-filter-section">
          <div className="search-bar-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search by city or camp name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="camps-search-input"
            />
          </div>
        </div>

        {/* Camps Grid Area */}
        <div className="dashboard-grid-container">
          {loading ? (
            <div className="camps-loading">
              <div className="loader"></div>
              <p>Fetching upcoming camps...</p>
            </div>
          ) : filteredCamps.length > 0 ? (
            <div className="camps-grid">
              {filteredCamps.map((camp, index) => (
                <div key={camp.id} className="camp-card">
                  <div className="camp-card-inner">
                    <div className="camp-img-box">
                      <img
                        src={
                          camp.image_url ||
                          "https://images.unsplash.com/photo-1615461066841-6116ecaaba7f?q=80&w=1000&auto=format&fit=crop"
                        }
                        alt={camp.title}
                      />
                    </div>
                    <div className="camp-icon-box">
                      <Droplet size={28} />
                    </div>
                    <div className="camp-content-box">
                      <h3 className="camp-title">{camp.title}</h3>

                      <div className="camp-details">
                        <div className="camp-detail-item">
                          <MapPin size={16} className="detail-icon" />
                          <span>{camp.location}</span>
                        </div>
                        <div className="camp-detail-item">
                          <Calendar size={16} className="detail-icon" />
                          <span>
                            {new Date(camp.date).toLocaleDateString("en-US", {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="camp-detail-item">
                          <Clock size={16} className="detail-icon" />
                          <span>
                            {camp.start_time} - {camp.end_time}
                          </span>
                        </div>
                        <div className="camp-detail-item">
                          <Users size={16} className="detail-icon" />
                          <span>
                            {camp.organizer_name || "National Blood Center"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="camp-action-box">
                      <button
                        onClick={(e) => handleRegisterClick(e, camp.id)}
                        className="camp-register-btn"
                      >
                        Register to Donate <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-camps-card">
              <Info size={40} color="#6b7280" />
              <h3>No Upcoming Camps Found</h3>
              <p>Try adjusting your search or check back later.</p>
              <button onClick={() => setSearchTerm("")} className="btn-outline">
                Clear Search
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BloodCamps;
