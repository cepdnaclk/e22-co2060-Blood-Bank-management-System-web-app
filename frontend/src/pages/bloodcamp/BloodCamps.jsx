import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth/useAuth';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Heart, 
  Info, 
  Search,
  ChevronRight,
  Filter
} from 'lucide-react';
import { getUpcomingCamps } from '../../services/campService';
import './BloodCamps.css';

const BloodCamps = () => {
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredCamps = camps.filter(camp => 
    (camp.title && camp.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (camp.location && camp.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleRegisterClick = (e, campId) => {
    e.preventDefault();
    if (isAuthenticated) {
      navigate('/donor/register', { state: { selectedCampId: campId } });
    } else {
      navigate('/login', { state: { returnTo: '/donor/register', selectedCampId: campId } });
    }
  };

  return (
    <div className="blood-camps-page">
      {/* Hero Banner */}
      <div className="camps-hero">
        <div className="camps-hero-content animate-on-scroll">
          <span className="camps-hero-badge">
            <Heart size={16} fill="white" />
            LIFESAVING EVENTS
          </span>
          <h1>Upcoming Blood Camps</h1>
          <p>Find a blood donation camp near you and join our community of heroes. Every drop counts.</p>
        </div>
      </div>

      {/* Filter & Search Section */}
      <div className="camps-filter-section">
        <div className="container">
          <div className="search-bar-wrapper">
            <Search className="search-icon" size={20} />
            <input 
              type="text" 
              placeholder="Search by city or camp name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="camps-search-input"
            />
          </div>
        </div>
      </div>

      {/* Camps Cards Grid */}
      <section className="camps-grid-section">
        <div className="container">
          {loading ? (
            <div className="camps-loading">
              <div className="loader"></div>
              <p>Fetching upcoming camps...</p>
            </div>
          ) : filteredCamps.length > 0 ? (
            <div className="camps-grid">
              {filteredCamps.map((camp, index) => (
                <div key={camp.id} className="camp-card animate-on-scroll" style={{ transitionDelay: `${index * 0.1}s` }}>
                  <div className="camp-card-inner">
                    <div className="camp-img-box">
                      {/* Using a placeholder if no image provided */}
                      <img 
                        src={camp.image_url || "https://images.unsplash.com/photo-1615461066841-6116ecaaba7f?q=80&w=1000&auto=format&fit=crop"} 
                        alt={camp.title} 
                      />
                    </div>
                    <div className="camp-content-box">
                      <div className="camp-icon-box">
                        <Calendar size={28} />
                      </div>
                      <h3 className="camp-title">{camp.title}</h3>
                      <div className="camp-details">
                        <div className="camp-detail-item">
                          <MapPin size={16} className="detail-icon" />
                          <span>{camp.location}</span>
                        </div>
                        <div className="camp-detail-item">
                          <Calendar size={16} className="detail-icon" />
                          <span>{new Date(camp.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        <div className="camp-detail-item">
                          <Clock size={16} className="detail-icon" />
                          <span>{camp.start_time} - {camp.end_time}</span>
                        </div>
                        <div className="camp-detail-item">
                          <Users size={16} className="detail-icon" />
                          <span>Organized by {camp.organizer_name || "National Blood Center"}</span>
                        </div>
                      </div>
                      <p className="camp-description">{camp.description}</p>
                    </div>
                    <div className="camp-action-box">
                      <a href="#" onClick={(e) => handleRegisterClick(e, camp.id)} className="camp-register-btn">
                        Register to Donate <ChevronRight size={18} />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-camps">
              <Info size={48} color="var(--color-primary)" />
              <h3>No Upcoming Camps Found</h3>
              <p>Try adjusting your search or check back later for new events.</p>
              <button onClick={() => setSearchTerm('')} className="btn-secondary">Clear Search</button>
            </div>
          )}
        </div>
      </section>

      {/* Why Register Section */}
      <section className="register-promo-section">
        <div className="container">
          <div className="promo-card">
            <div className="promo-content">
              <h2>Become a Registered Donor</h2>
              <p>Registering allows you to book appointments, track your donation history, and receive alerts when your blood type is needed.</p>
              <Link to="/signup" className="btn-white">Create Account Today</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BloodCamps;
