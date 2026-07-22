import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Activity, MapPin, Search, PhoneCall, ArrowRight, Shield, Clock, ChevronDown, Calendar, Droplet } from 'lucide-react';
import './LandingPage.css';
import { LANDING } from '../../config/imageAssets';

import video1 from '../../assets/backgroundvideos/video01.mp4';
import video2 from '../../assets/backgroundvideos/video02.mp4';

import { getLatestPublicCamp } from '../../services/campService';
import { getAllHospitalsStock } from '../../api/inventoryService';

const LandingPage = () => {
const DEFAULT_STOCK = {
    "A+": "Normal",
    "A-": "Normal",
    "B+": "Normal",
    "B-": "Normal",
    "AB+": "Normal",
    "AB-": "Normal",
    "O+": "Normal",
    "O-": "Normal",
};

const [bloodStock, setBloodStock] = useState(DEFAULT_STOCK);
const [lastUpdated, setLastUpdated] = useState(null);
const [stockLoading, setStockLoading] = useState(true);
const [stockError, setStockError] = useState("");
const [latestCamp, setLatestCamp] = useState(null);

// Hospital stock state
const [hospitalsStock, setHospitalsStock] = useState([]);
const [hospitalsLoading, setHospitalsLoading] = useState(true);
const [hospitalSearch, setHospitalSearch] = useState('');
const [districtFilter, setDistrictFilter] = useState('');

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

const fetchLiveStock = async () => {
    try {
        setStockError("");
        const response = await fetch(`${API_BASE}/blood/live-stock/`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        const statusByType = { ...DEFAULT_STOCK };
        (data.stocks || []).forEach((item) => {
            if (item?.bloodType && item?.status) {
                statusByType[item.bloodType] = item.status;
            }
        });

        setBloodStock(statusByType);
        setLastUpdated(data.updatedAt || null);
    } catch (error) {
        setStockError("Unable to load live blood stock right now.");
        console.error("Live stock fetch failed:", error);
    } finally {
        setStockLoading(false);
    }
};

const fetchLatestCamp = async () => {
    try {
        const camp = await getLatestPublicCamp();
        setLatestCamp(camp || null);
    } catch (error) {
        console.error("Error fetching latest camp:", error);
    }
};

const fetchHospitalsStock = async () => {
    try {
        setHospitalsLoading(true);
        const { success, data } = await getAllHospitalsStock();
        if (success && data.hospitals) {
            setHospitalsStock(data.hospitals);
        }
    } catch (error) {
        console.error("Error fetching hospitals stock:", error);
    } finally {
        setHospitalsLoading(false);
    }
};

useEffect(() => {
    fetchLiveStock();
    fetchLatestCamp();
    fetchHospitalsStock();
    const intervalId = setInterval(fetchLiveStock, 60000); // refresh every 60s
    return () => clearInterval(intervalId);
}, []);

// Extract unique districts from the hospital data
const districts = [...new Set(hospitalsStock.map(h => h.district))].filter(Boolean).sort();

// Filter the hospital list
const filteredHospitals = hospitalsStock.filter(h => {
    const matchesSearch = h.name.toLowerCase().includes(hospitalSearch.toLowerCase());
    const matchesDistrict = districtFilter === '' || h.district === districtFilter;
    return matchesSearch && matchesDistrict;
});


    // Intersection Observer for scroll animations
    useEffect(() => {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: "0px 0px -50px 0px"
        };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        const elements = document.querySelectorAll('.animate-on-scroll');
        elements.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    const backgroundVideos = [video1, video2];
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

    const handleVideoEnded = () => {
        setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % backgroundVideos.length);
    };

    return (
        <div className="landing-page-new">
            {/* Hero Section */}
            <section className="hero-section-new">
                <div className="hero-overlay"></div>
                <video 
                    key={currentVideoIndex}
                    autoPlay 
                    muted 
                    playsInline 
                    className="hero-video"
                    src={backgroundVideos[currentVideoIndex]}
                    onEnded={handleVideoEnded}
                />
                <div className="hero-container">
                    <div className="hero-content animate-on-scroll">
                        <div className="hero-badge-new">
                            <Shield size={16} /> Sri Lanka National Blood Transfusion Service
                        </div>
                        <h4 className="hero-top-title">Donate Blood, Save Life!</h4>
                        <h1 className="hero-title">
                            Donate Your Blood & <br /> Inspires to Others
                        </h1>

                        {/* This is the part that centers the button */}
                        <div className="hero-actions-new">
                            <Link to="/donor" className="scroll-donate-btn btn-donate-large">
                                DONATE NOW <Heart size={18} style={{ marginLeft: '8px' }} />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Scroll Down Signal */}
                <div className="hero-scroll-signal">
                    <div className="scroll-indicator" onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}>
                        <span className="scroll-text">Scroll Down</span>
                        <ChevronDown size={24} className="bounce-arrow" />
                    </div>
                </div>
            </section>

            {/* Service Cards Section (Moved below Hero) */}
            <section className="services-section">
                <div className="container">
                    <div className="services-cards-wrapper">
                        <div className="services-container">
                            <div className="services-styles-box-inner animate-on-scroll" style={{ transitionDelay: '0.1s' }}>
                                <div className="service-card-wrapper">
                                    <div className="service-img-box">
                                        <img src={LANDING.donorRegistration} alt="Blood Donation" />
                                    </div>
                                    <div className="service-content-main-box">
                                        <div className="service-icon-box bg-dark">
                                            <Heart size={36} color="white" />
                                        </div>
                                        <h3 className="service-box-title">Donor Registration</h3>
                                        <p>Join our community of lifesavers. Register today to seamlessly book your donation appointments.</p>
                                    </div>
                                    <div className="service-read-more">
                                        <Link to="/signup">Register Now</Link>
                                    </div>
                                </div>
                            </div>
                            <div className="services-styles-box-inner animate-on-scroll" style={{ transitionDelay: '0.3s' }}>
                                <div className="service-card-wrapper">
                                    <div className="service-img-box">
                                        <img src={LANDING.checkEligibility} alt="Blood Bank" />
                                    </div>
                                    <div className="service-content-main-box">
                                        <div className="service-icon-box bg-dark">
                                            <Shield size={36} color="white" />
                                        </div>
                                        <h3 className="service-box-title">Check Your Eligibility</h3>
                                        <p>Not sure if you can donate blood today? Take our quick, automated health questionnaire to instantly verify your eligibility.</p>
                                    </div>
                                    <div className="service-read-more">
                                        <Link to="/donor/eligibility">Take the Quiz</Link>
                                    </div>
                                </div>
                            </div>
                            <div className="services-styles-box-inner animate-on-scroll" style={{ transitionDelay: '0.5s' }}>
                                <div className="service-card-wrapper">
                                    <div className="service-img-box">
                                        <img src={LANDING.bloodCampDetails} alt="Health Check" />
                                    </div>
                                    <div className="service-content-main-box">
                                        <div className="service-icon-box bg-dark">
                                            <Activity size={36} color="white" />
                                        </div>
                                        <h3 className="service-box-title">Blood Camp Details</h3>
                                        {latestCamp ? (
                                            <div className="latest-camp-info">
                                                <p className="camp-name-highlight">{latestCamp.title}</p>
                                                <p className="camp-meta"><MapPin size={12} /> {latestCamp.location}</p>
                                                <p className="camp-meta"><Calendar size={12} /> {new Date(latestCamp.date).toLocaleDateString()}</p>
                                            </div>
                                        ) : (
                                            <p>Donating has never been easier. Use our interactive map to discover upcoming blood donation drives hosted in your city.</p>
                                        )}
                                    </div>
                                    <div className="service-read-more">
                                        <Link to="/blood-camps">View Camps</Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Live Blood Stock Section (moved down) */}
            <section className="live-stock-section">
                <div className="container">
                    <div className="stock-panel animate-on-scroll">
                        <h3><Activity size={20} color="var(--color-primary)" /> Live National Stock</h3>
                        <div className="stock-grid">
                            {Object.entries(bloodStock).map(([type, status]) => (
                                <div key={type} className={`stock-card status-${status.toLowerCase()}`}>
                                    <span className="blood-type">{type}</span>
                                    <span className="status-badge">{status}</span>
                                </div>
                            ))}
                        </div>
                        <div className="stock-footer">
                            <span>
                                <Clock size={12} />
                                {" "}
                                {stockLoading
                                    ? "Loading..."
                                    : lastUpdated
                                        ? `Updated ${new Date(lastUpdated).toLocaleTimeString()}`
                                        : "Update time unavailable"}
                            </span>
                            {stockError && <p className="stock-error">{stockError}</p>}

                            <Link to="/donor">View Details</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features/Stats Section */}
            <section className="highlights-section-new">
                <div className="container">
                    <div className="stats-grid-new animate-on-scroll">
                        <div className="stat-item-new">
                            <h2 className="stat-number-new">48<span className="unit">h</span></h2>
                            <p>Predictive Shortage Alerts</p>
                        </div>
                        <div className="stat-item-new divider">
                            <h2 className="stat-number-new">10k+</h2>
                            <p>Registered Active Donors</p>
                        </div>
                        <div className="stat-item-new divider">
                            <h2 className="stat-number-new">85<span>%</span></h2>
                            <p>Wastage Reduction</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Hospital Stock Map/Table Section */}
            <section className="map-section-new animate-on-scroll">
                <div className="container">
                    <div className="map-header">
                        <h2><MapPin size={28} /> Regional Blood Banks Stock</h2>
                        <p>Locate active blood banks and check their real-time inventory status before you donate.</p>
                    </div>
                    
                    <div className="hospital-stock-wrapper bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
                        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 m-0">
                                <Droplet size={20} className="text-red-500" /> Hospital Inventories
                            </h3>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <select 
                                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary bg-white outline-none"
                                    value={districtFilter}
                                    onChange={(e) => setDistrictFilter(e.target.value)}
                                >
                                    <option value="">All Districts</option>
                                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <div className="relative flex-grow sm:flex-grow-0">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search hospital..."
                                        className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary outline-none"
                                        value={hospitalSearch}
                                        onChange={(e) => setHospitalSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto max-h-[400px]">
                            {hospitalsLoading ? (
                                <div className="p-10 text-center text-gray-500">Loading hospital data...</div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Hospital Name</th>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">District</th>
                                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredHospitals.length > 0 ? (
                                            filteredHospitals.map(h => (
                                                <tr key={h.id} className="hover:bg-red-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <span className="font-medium text-gray-900">{h.name}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-600 text-sm">{h.district || 'Unassigned'}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                            h.status === 'Normal' ? 'bg-green-100 text-green-800' :
                                                            h.status === 'Low' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                            {h.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="3" className="px-6 py-8 text-center text-gray-500">No hospitals match your search.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Donate Section */}
            <section className="why-donate-section">
                <div className="container why-donate-container">
                    <div className="why-donate-image animate-on-scroll">
                        <img src={LANDING.whyDonate} alt="Hold Blood Drop" />
                    </div>
                    <div className="why-donate-content animate-on-scroll" style={{ transitionDelay: '0.2s' }}>
                        <h5 className="section-subtitle">Why Donate?</h5>
                        <h2 className="section-title">The Life You Save<br />Could Be Someone<br />You Love</h2>
                        <p className="section-description">
                            Aliquam vitae pharetra sapien. Sed et ex convallis, hen dreri enim ac, bibendum veliti. Aliquam ipsum nisi eleif end utine mauris idin aliquam efficitur nulla phas ellorci diam.
                        </p>

                        <div className="benefits-grid">
                            <div className="benefit-item">
                                <div className="benefit-icon">
                                    <Heart fill="var(--color-primary)" color="var(--color-primary)" size={24} />
                                </div>
                                <h4>Your Blood, Their Second Chance</h4>
                                <p>Namu ante maucb usenaxi nulla dignii a gravding.</p>
                            </div>
                            <div className="benefit-item">
                                <div className="benefit-icon">
                                    <Activity fill="var(--color-primary)" color="var(--color-primary)" size={24} />
                                </div>
                                <h4>Urgent Need Every Day</h4>
                                <p>Namu ante maucb usenaxi nulla dignii a gravding.</p>
                            </div>
                            <div className="benefit-item">
                                <div className="benefit-icon">
                                    <Shield fill="var(--color-primary)" color="var(--color-primary)" size={24} />
                                </div>
                                <h4>Save Lives in Minutes</h4>
                                <p>Namu ante maucb usenaxi nulla dignii a gravding.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Mock */}
            <section className="testimonials-section animate-on-scroll">
                <div className="container">
                    <h2 className="section-title">Why We Donate</h2>
                    <div className="testimonial-grid">
                        <div className="testimonial-card">
                            <div className="quote">"HOPEDROP alerted me that my rare AB- blood was needed locally. The process was seamless and I knew exactly who I was helping."</div>
                            <div className="author">- Kamal S., Donor</div>
                        </div>
                        <div className="testimonial-card">
                            <div className="quote">"As a Medical Officer, the 48-hour predictive alerts have completely changed how we manage inventory. We no longer hit critical zero."</div>
                            <div className="author">- Dr. Perera, General Hospital</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer-new">
                <div className="container footer-grid">
                    <div className="footer-brand">
                        <h2><Heart color="var(--color-primary)" fill="var(--color-primary)" /> HOPEDROP</h2>
                        <p>National Blood Bank Management System of Sri Lanka.</p>
                    </div>
                    <div className="footer-links">
                        <h4>Quick Links</h4>
                        <Link to="/donor">Donor Portal</Link>
                        <Link to="/patient">Request Blood</Link>
                        <Link to="/login">Hospital Login</Link>
                        <Link to="/contact">Contact Us</Link>
                    </div>
                    <div className="footer-contact">
                        <h4>Emergency Contact</h4>
                        <p>Hotline: 011 236 9931</p>
                        <p>Email: info@hopedrop.lk</p>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} HOPEDROP National Blood Transfusion Service. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
