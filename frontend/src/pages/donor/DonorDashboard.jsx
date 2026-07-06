import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  LayoutDashboard,
  User,
  Settings,
  LogOut,
  Droplets,
  History,
  Calendar,
  Phone,
  Hospital,
  IdCard,
  Edit2,
  Camera,
  QrCode,
  Menu,
  X as CloseIcon,
  Clock,
  FileText,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getDonorProfile,
  updateDonorProfile,
  getDonorDashboard,
  getDonorDonations,
} from "../../services/donorService";
import { getDonorAlerts } from "../../services/alertService";
import { getUpcomingCamps, registerForCamp } from "../../services/campService";
import { QRCodeCanvas } from "qrcode.react";
import Swal from "sweetalert2";
import {
  Bell,
  MapPin,
  Search,
  Activity,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import "./DonorDashboard.css";
const DonorSideBar = ({
  profile,
  currentView,
  setView,
  onUpdate,
  isMobileOpen,
  closeMobileMenu,
}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const handleLogout = () => {
    localStorage.removeItem("authTokens");
    navigate("/login");
  };
  const handleImageClick = () => {
    fileInputRef.current.click();
  };
  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      try {
        await updateDonorProfile({ profile_image: e.target.files[0] });
        Swal.fire({
          icon: "success",
          title: "Avatar Updated",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
        });
        if (onUpdate) onUpdate(true);
      } catch {
        Swal.fire({ icon: "error", title: "Upload Failed" });
      } finally {
        setIsUploading(false);
      }
    }
  };
  const navClick = (dest) => {
    setView(dest);
    closeMobileMenu();
  };
  return (
    <>
      <div
        className={`donor-sidebar-overlay ${isMobileOpen ? "active" : ""}`}
        onClick={closeMobileMenu}
      ></div>
      <aside className={`donor-sidebar ${isMobileOpen ? "mobile-open" : ""}`}>
        <button
          className="mobile-close-btn"
          type="button"
          onClick={closeMobileMenu}
        >
          <CloseIcon size={20} />
        </button>

        <div className="sidebar-profile">
          <div className="profile-avatar-container sidebar-pic-wrapper">
            {profile?.profile_image ? (
              <img
                src={profile.profile_image}
                alt="Profile"
                className="profile-avatar responsive-avatar"
              />
            ) : (
              <div className="profile-avatar placeholder-avatar">
                {profile?.fullName?.charAt(0) || "U"}
              </div>
            )}
            <div
              className="avatar-edit-badge"
              onClick={handleImageClick}
              title="Update Profile Picture"
            >
              {isUploading ? (
                <div className="spinner-mini"></div>
              ) : (
                <Edit2 size={12} />
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: "none" }}
              disabled={isUploading}
            />
          </div>
          <h3 className="profile-name">{profile?.fullName || "No Name Set"}</h3>
          <span className="profile-blood-badge">
            {profile?.blood_group || "--"}
          </span>
        </div>
        <nav className="sidebar-nav">
          <ul className="nav-list">
            <li className="nav-item">
              <button
                onClick={() => navClick("dashboard")}
                className={`nav-button ${currentView === "dashboard" ? "active" : ""}`}
              >
                <LayoutDashboard size={20} /> Dashboard
              </button>
            </li>
            <li className="nav-item">
              <button
                onClick={() => navClick("history")}
                className={`nav-button ${currentView === "history" ? "active" : ""}`}
              >
                <Clock size={20} /> History
              </button>
            </li>
            <li className="nav-item">
              <button
                onClick={() => navClick("profile")}
                className={`nav-button ${currentView === "profile" ? "active" : ""}`}
              >
                <User size={20} /> My Profile
              </button>
            </li>
            <li className="nav-item">
              <button
                onClick={() => navClick("settings")}
                className={`nav-button ${currentView === "settings" ? "active" : ""}`}
              >
                <Settings size={20} /> Settings
              </button>
            </li>
          </ul>
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-button">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
};
const ProfileView = ({ profile, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  const [loading, setLoading] = useState(false);
  const startEditing = () => {
    // ?? Create independent editable copy
    setEditData({
      phoneNumber: profile?.phoneNumber || "",
      hospital: profile?.hospital || "",
      profile_image: null,
    });
    setPreviewImage(profile?.profile_image || "");
    setIsEditing(true);
  };
  const handleCancel = () => {
    // ?? Revert easily back to View Mode
    setIsEditing(false);
    setEditData(null);
    setPreviewImage("");
  };
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditData({ ...editData, profile_image: file });
      setPreviewImage(URL.createObjectURL(file));
    }
  };
  const handleSave = async () => {
    setLoading(true);
    try {
      await updateDonorProfile(editData);
      Swal.fire({
        icon: "success",
        title: "Profile Updated",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
      onUpdate?.(true); // Silent refresh of the shared dashboard state
      setIsEditing(false);
      setEditData(null);
    } catch (err) {
      const errorMsg = err.response?.data
        ? JSON.stringify(err.response.data)
        : "Update Failed";
      Swal.fire({ icon: "error", title: "Update Failed", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="profile-page-content animate-in">
      <div className="profile-header-action">
        <h1 className="page-title">Personal Information</h1>
        {!isEditing ? (
          <button className="new-edit-mob-btn" onClick={startEditing}>
            <Edit2 size={16} /> <span className="btn-text">Edit Profile</span>
          </button>
        ) : (
          <div className="edit-actions-group">
            <button className="btn btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>
      <div className="profile-details-grid grid-responsive">
        <div className="stat-card">
          <label className="stat-label">
            <IdCard size={14} /> Full Name
          </label>
          <p className="stat-value">{profile?.fullName || "Not Provided"}</p>
        </div>
        <div className="stat-card">
          <label className="stat-label">
            <Droplets size={14} /> Blood Group
          </label>
          <p className="stat-value">{profile?.blood_group || "Not Provided"}</p>
        </div>
        <div className="stat-card">
          <label className="stat-label">
            <IdCard size={14} /> NIC Number
          </label>
          <p className="stat-value">{profile?.nic_number || "Not Provided"}</p>
        </div>
        <div className="stat-card">
          <label className="stat-label">
            <Phone size={14} /> Phone Number
          </label>
          {isEditing ? (
            <input
              className="form-input"
              value={editData.phoneNumber}
              onChange={(e) =>
                setEditData({ ...editData, phoneNumber: e.target.value })
              }
            />
          ) : (
            <p className="stat-value">
              {profile?.phoneNumber || "Not Provided"}
            </p>
          )}
        </div>
        <div className="stat-card">
          <label className="stat-label">
            <Hospital size={14} /> Nearest Hospital
          </label>
          {isEditing ? (
            <input
              className="form-input"
              value={editData.hospital}
              onChange={(e) =>
                setEditData({ ...editData, hospital: e.target.value })
              }
            />
          ) : (
            <p className="stat-value">{profile?.hospital || "Not Provided"}</p>
          )}
        </div>
        <div className="stat-card">
          <label className="stat-label">
            <Camera size={14} /> Profile Image
          </label>
          {isEditing ? (
            <div className="image-edit-container">
              <input
                type="file"
                accept="image/*"
                className="form-input file-input"
                onChange={handleImageChange}
              />
              {previewImage && (
                <img
                  src={previewImage}
                  alt="Preview"
                  className="image-preview view-only"
                />
              )}
            </div>
          ) : (
            <div className="image-view-container">
              {profile?.profile_image ? (
                <img
                  src={profile.profile_image}
                  alt="Profile"
                  className="image-preview view-only"
                />
              ) : (
                <p
                  className="stat-value text-muted"
                  style={{
                    color: "#6b7280",
                    fontSize: "0.9rem",
                    marginTop: "8px",
                  }}
                >
                  No image set
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
const DashboardOverview = ({
  profile,
  dashboardStats,
  upcomingCamps,
  onRegisterCamp,
  onToggleAvailability,
}) => {
  // Use real server-computed data from /donor/dashboard/ API
  const nextEligible = dashboardStats?.next_eligible
    ? new Date(dashboardStats.next_eligible).toLocaleDateString()
    : "Eligible Now";
  const isEligible = dashboardStats?.is_eligible ?? true;
  const isAvailable =
    dashboardStats?.is_available ?? profile?.is_available ?? true;

  return (
    <div className="dashboard-v2 animate-in">
      <div className="welcome-banner">
        <div>
          <h1 className="page-title" style={{ marginBottom: "4px" }}>
            Hi, {profile?.fullName?.split(" ")[0] || "Donor"}!
          </h1>
          <p className="page-subtitle">Your quick donation dashboard.</p>
        </div>
      </div>

      {/* 1. Top Section - Summary Cards */}
      <div
        className="stats-grid grid-responsive-4"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
      >
        <div className="stat-card">
          <p className="stat-label">Blood Group</p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "8px",
            }}
          >
            <Droplets size={24} className="icon-red" />
            <h2
              className="stat-value"
              style={{ margin: 0, fontSize: "1.8rem" }}
            >
              {profile?.blood_group || "--"}
            </h2>
          </div>
        </div>

        <div className="stat-card">
          <p className="stat-label">Last Donation</p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "8px",
            }}
          >
            <History size={24} className="icon-blue" />
            <h3
              className="stat-value"
              style={{ margin: 0, fontSize: "1.2rem" }}
            >
              {profile?.last_donation
                ? new Date(profile.last_donation).toLocaleDateString()
                : "N/A"}
            </h3>
          </div>
        </div>

        <div className="stat-card">
          <p className="stat-label">Next Eligible Date</p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "8px",
            }}
          >
            <Calendar size={24} className="icon-green" />
            <h3
              className="stat-value"
              style={{
                margin: 0,
                fontSize: "1.2rem",
                color: nextEligible === "Eligible Now" ? "#10b981" : "inherit",
              }}
            >
              {nextEligible}
            </h3>
          </div>
        </div>

        <div className="stat-card">
          <p className="stat-label">Status</p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "8px",
            }}
          >
            {isAvailable ? (
              <CheckCircle size={24} className="icon-green" />
            ) : (
              <XCircle size={24} color="#6b7280" />
            )}
            <h3
              className="stat-value"
              style={{
                margin: 0,
                fontSize: "1.2rem",
                color: isAvailable ? "#10b981" : "#6b7280",
              }}
            >
              {isAvailable ? "Available" : "Unavailable"}
            </h3>
          </div>
          {!isEligible && (
            <p
              style={{ fontSize: "0.8rem", color: "#ef4444", marginTop: "6px" }}
            >
              Not eligible until {nextEligible}
            </p>
          )}
        </div>
      </div>

      {/* 2. Middle Section - Main Actions */}
      <h3
        className="section-heading"
        style={{ marginTop: "2rem", marginBottom: "1rem", fontSize: "1.2rem" }}
      >
        Quick Actions
      </h3>
      <div
        className="main-actions-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "1rem",
        }}
      >
        <button
          className="action-btn toggle-status-btn"
          onClick={isEligible ? onToggleAvailability : null}
          disabled={!isEligible}
          style={{
            padding: "1rem",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            background: !isEligible
              ? "#f3f4f6"
              : isAvailable
                ? "#fee2e2"
                : "#dcfce7",
            cursor: isEligible ? "pointer" : "not-allowed",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s",
            opacity: isEligible ? 1 : 0.6,
          }}
        >
          <Activity
            size={24}
            color={
              !isEligible ? "#9ca3af" : isAvailable ? "#ef4444" : "#10b981"
            }
          />
          <span
            style={{ fontSize: "1.1rem", fontWeight: 600, color: "#374151" }}
          >
            {!isEligible
              ? `Not Eligible Yet`
              : `Mark as ${isAvailable ? "Unavailable" : "Available"}`}
          </span>
        </button>

        <button
          className="action-btn"
          style={{
            padding: "1rem",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            background: "white",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Search size={24} className="icon-blue" />
          <span
            style={{ fontSize: "1.1rem", fontWeight: 600, color: "#374151" }}
          >
            Find Blood Requests
          </span>
        </button>

        <button
          className="action-btn"
          style={{
            padding: "1rem",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            background: "white",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <MapPin size={24} className="icon-red" />
          <span
            style={{ fontSize: "1.1rem", fontWeight: 600, color: "#374151" }}
          >
            Nearby Camps
          </span>
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1.5rem",
          marginTop: "2rem",
        }}
      >
        {/* 3. Upcoming Camps */}
        <div className="nearby-section">
          <h3
            className="section-heading"
            style={{ marginBottom: "1rem", fontSize: "1.2rem" }}
          >
            Upcoming Blood Camps
          </h3>
          <div className="nearby-list">
            {upcomingCamps && upcomingCamps.length > 0 ? (
              upcomingCamps.map((camp) => (
                <div
                  key={camp.id}
                  className="nearby-card"
                  style={{
                    padding: "1rem",
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    marginBottom: "0.5rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <h4
                      style={{
                        margin: "0 0 4px 0",
                        fontSize: "1rem",
                        color: "#111827",
                      }}
                    >
                      {camp.title}
                    </h4>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.85rem",
                        color: "#6b7280",
                      }}
                    >
                      <MapPin
                        size={12}
                        style={{ display: "inline", marginRight: "4px" }}
                      />
                      {camp.location}
                    </p>
                    <p
                      style={{
                        margin: "4px 0 0 0",
                        fontSize: "0.8rem",
                        color: "#6b7280",
                      }}
                    >
                      <Calendar
                        size={12}
                        style={{ display: "inline", marginRight: "4px" }}
                      />
                      {camp.date} ({camp.start_time})
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      !camp.is_registered && onRegisterCamp(camp.id)
                    }
                    disabled={!isEligible || camp.is_registered}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      background: camp.is_registered
                        ? "#dcfce7"
                        : isEligible
                          ? "#fee2e2"
                          : "#f3f4f6",
                      color: camp.is_registered
                        ? "#15803d"
                        : isEligible
                          ? "#dc2626"
                          : "#9ca3af",
                      border: `1px solid ${camp.is_registered ? "#bbf7d0" : isEligible ? "#fca5a5" : "#e5e7eb"}`,
                      cursor:
                        isEligible && !camp.is_registered
                          ? "pointer"
                          : "not-allowed",
                      opacity: !isEligible && !camp.is_registered ? 0.7 : 1,
                      transition: "all 0.2s",
                    }}
                  >
                    {camp.is_registered
                      ? "Registered"
                      : isEligible
                        ? "Register"
                        : "Not Eligible"}
                  </button>
                </div>
              ))
            ) : (
              <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                No upcoming camps found.
              </p>
            )}
          </div>
        </div>

        {/* 4. QR Code & Stats */}
        <div
          className="qr-section stat-card centered-card"
          style={{ margin: 0 }}
        >
          <div className="qr-header">
            <QrCode size={24} />{" "}
            <h2 style={{ fontSize: "1.2rem" }}>Your Donor QR Code</h2>
          </div>
          <div className="qr-box">
            {profile?.qr_id ? (
              <QRCodeCanvas
                value={`${window.location.origin}/donor/scan/${profile.qr_id}`}
                size={160}
                level={"H"}
                includeMargin={true}
                imageSettings={{
                  src: "/favicon.svg",
                  height: 40,
                  width: 40,
                  excavate: true,
                }}
              />
            ) : (
              <div className="qr-placeholder">QR ID not available</div>
            )}
          </div>
          <div className="qr-id-tag">
            ID: {profile?.qr_id || "Generating..."}
          </div>

          <div
            style={{
              marginTop: "1.5rem",
              paddingTop: "1.5rem",
              borderTop: "1px solid #e5e7eb",
              width: "100%",
            }}
          >
            <p className="stat-label" style={{ marginBottom: "8px" }}>
              Total Contributions
            </p>
            <h3 className="stat-value">
              {profile?.donations || "0"} Donations
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const config = {
    completed: { bg: "#dcfce7", color: "#15803d", label: "Completed" },
    pending: { bg: "#fef9c3", color: "#a16207", label: "Pending" },
    cancelled: { bg: "#fee2e2", color: "#b91c1c", label: "Cancelled" },
  };
  const s = config[status] || config.completed;
  return (
    <span
      className="history-status-badge"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
};

const HistoryView = ({
  donations,
  donationsLoading,
  donationsMeta,
  onPageChange,
  onFilterChange,
  currentFilter,
}) => {
  const results = donations || [];
  const hasNext = !!donationsMeta?.next;
  const hasPrev = !!donationsMeta?.previous;
  const totalCount = donationsMeta?.count || 0;
  const currentPage = donationsMeta?.currentPage || 1;
  const totalPages = Math.ceil(totalCount / 10) || 1;

  return (
    <div className="history-view animate-in">
      <div className="history-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: "4px" }}>
            Donation History
          </h1>
          <p
            className="page-subtitle"
            style={{ fontSize: "0.95rem", fontWeight: 400, color: "#6b7280" }}
          >
            {totalCount} total donation{totalCount !== 1 ? "s" : ""} on record
          </p>
        </div>
        <div className="history-filter-group">
          <Filter size={16} style={{ color: "#6b7280" }} />
          <select
            className="history-filter-select"
            value={currentFilter}
            onChange={(e) => onFilterChange(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {donationsLoading ? (
        <div className="loader-container centered">
          <div className="spinner"></div>
        </div>
      ) : results.length === 0 ? (
        <div className="history-empty-state">
          <div className="history-empty-icon">
            <FileText size={48} strokeWidth={1.5} />
          </div>
          <h3>No Donations Yet</h3>
          <p>
            Your donation history will appear here after your first blood
            donation.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile card view */}
          <div className="history-cards-mobile">
            {results.map((d) => (
              <div key={d.id} className="history-card">
                <div className="history-card-top">
                  <div className="history-card-date">
                    <Calendar size={14} />
                    {new Date(d.donation_date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                  <StatusBadge status={d.status} />
                </div>
                <div className="history-card-body">
                  <div className="history-card-row">
                    <span className="history-card-label">Hospital</span>
                    <span className="history-card-value">
                      {d.hospital_display || d.hospital_name}
                    </span>
                  </div>
                  <div className="history-card-row">
                    <span className="history-card-label">Blood Group</span>
                    <span className="history-card-value history-blood-tag">
                      {d.blood_group}
                    </span>
                  </div>
                  <div className="history-card-row">
                    <span className="history-card-label">Units</span>
                    <span className="history-card-value">{d.units}</span>
                  </div>
                  {d.notes && (
                    <div className="history-card-row">
                      <span className="history-card-label">Notes</span>
                      <span
                        className="history-card-value"
                        style={{ fontSize: "0.85rem", color: "#6b7280" }}
                      >
                        {d.notes}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table view */}
          <div className="history-table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Hospital</th>
                  <th>Blood Group</th>
                  <th>Units</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {results.map((d) => (
                  <tr key={d.id}>
                    <td className="history-date-cell">
                      <Calendar size={14} className="icon-muted" />
                      {new Date(d.donation_date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td>{d.hospital_display || d.hospital_name}</td>
                    <td>
                      <span className="history-blood-tag">{d.blood_group}</span>
                    </td>
                    <td>{d.units}</td>
                    <td>
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="history-notes-cell">{d.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalCount > 10 && (
            <div className="history-pagination">
              <button
                className="history-page-btn"
                disabled={!hasPrev}
                onClick={() => onPageChange(currentPage - 1)}
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <span className="history-page-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="history-page-btn"
                disabled={!hasNext}
                onClick={() => onPageChange(currentPage + 1)}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const DonorDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [upcomingCamps, setUpcomingCamps] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // History state
  const [donations, setDonations] = useState([]);
  const [donationsLoading, setDonationsLoading] = useState(false);
  const [donationsMeta, setDonationsMeta] = useState({
    next: null,
    previous: null,
    count: 0,
    currentPage: 1,
  });
  const [historyFilter, setHistoryFilter] = useState("");

  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      // Fetch profile, stats, alerts, and camps in parallel
      const [profileData, statsData, alertsData, campsData] = await Promise.all(
        [
          getDonorProfile(),
          getDonorDashboard(),
          getDonorAlerts(),
          getUpcomingCamps(),
        ],
      );
      setProfile(profileData);
      setDashboardStats(statsData);
      setAlerts(alertsData);
      const newCamps = campsData.results || campsData;
      setUpcomingCamps((prevCamps) => {
        if (!prevCamps || prevCamps.length === 0) return newCamps;
        return newCamps.map((camp) => {
          const prevCamp = prevCamps.find((pc) => pc.id === camp.id);
          return {
            ...camp,
            is_registered:
              camp.is_registered || (prevCamp ? prevCamp.is_registered : false),
          };
        });
      });
    } catch (err) {
      console.error("Fetch error", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Extract unread alerts count
  const unreadCount = alerts?.filter((a) => !a.is_read)?.length || 0;

  const handleToggleAvailability = async () => {
    if (!profile || !dashboardStats?.is_eligible) return;
    try {
      const newStatus = !profile.is_available;
      // Optimistic update
      setProfile({ ...profile, is_available: newStatus });
      setDashboardStats({ ...dashboardStats, is_available: newStatus });
      await updateDonorProfile({ is_available: newStatus });
      Swal.fire({
        icon: "success",
        title: `You are now ${newStatus ? "Available" : "Unavailable"}`,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      });
    } catch {
      // Revert on error
      setProfile({ ...profile, is_available: !profile.is_available });
      setDashboardStats({
        ...dashboardStats,
        is_available: profile.is_available,
      });
      Swal.fire({ icon: "error", title: "Failed to update" });
    }
  };

  const handleRegisterCamp = async (campId) => {
    if (!dashboardStats?.is_eligible) {
      Swal.fire(
        "Not Eligible",
        "You are not currently eligible to donate blood.",
        "warning",
      );
      return;
    }
    try {
      await registerForCamp(campId);
      Swal.fire(
        "Registered!",
        "Your request to donate has been sent.",
        "success",
      );
      // Update local state to reflect registration immediately
      setUpcomingCamps((prevCamps) =>
        prevCamps.map((camp) =>
          camp.id === campId ? { ...camp, is_registered: true } : camp,
        ),
      );
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to register";
      Swal.fire("Error", msg, "error");
    }
  };

  const fetchDonations = useCallback(
    async (page = 1, status = historyFilter) => {
      setDonationsLoading(true);
      try {
        const params = { page };
        if (status) params.status = status;
        const data = await getDonorDonations(params);
        setDonations(data.results || []);
        setDonationsMeta({
          next: data.next,
          previous: data.previous,
          count: data.count || 0,
          currentPage: page,
        });
      } catch (err) {
        console.error("Error fetching donations:", err);
        setDonations([]);
      } finally {
        setDonationsLoading(false);
      }
    },
    [historyFilter],
  );

  const handleHistoryPageChange = (page) => fetchDonations(page);
  const handleHistoryFilterChange = (status) => {
    setHistoryFilter(status);
  };

  useEffect(() => {
    fetchData();

    // Live update polling for dashboard data
    const intervalId = setInterval(() => {
      fetchData(true);
    }, 10000); // 10 seconds

    return () => clearInterval(intervalId);
  }, [fetchData]);

  // Fetch donations when switching to history tab
  useEffect(() => {
    if (view === "history") {
      fetchDonations(1, historyFilter);
    }
  }, [view, fetchDonations, historyFilter]);
  return (
    <div className="donor-container flex-layout">
      <DonorSideBar
        profile={profile}
        currentView={view}
        setView={setView}
        onUpdate={fetchData}
        isMobileOpen={isMobileMenuOpen}
        closeMobileMenu={() => setIsMobileMenuOpen(false)}
      />
      <main className="donor-main">
        <div className="mobile-header">
          <div className="mobile-brand">
            <button
              className="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(true)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                color: "#374151",
              }}
            >
              <Menu size={24} />
            </button>
          </div>
          <div
            className="header-actions"
            style={{ display: "flex", alignItems: "center", gap: "15px" }}
          >
            <Link
              to="/donor/notifications"
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f3f4f6",
                padding: "8px",
                borderRadius: "50%",
                color: "#374151",
                textDecoration: "none",
              }}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-2px",
                    right: "-2px",
                    background: "#ef4444",
                    color: "white",
                    fontSize: "0.65rem",
                    fontWeight: "bold",
                    width: "16px",
                    height: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </Link>
          </div>
        </div>
        <div className="donor-content-area">
          {loading ? (
            <div className="loader-container centered">
              <div className="spinner"></div>
            </div>
          ) : (
            <>
              {view === "dashboard" && (
                <DashboardOverview
                  profile={profile}
                  dashboardStats={dashboardStats}
                  upcomingCamps={upcomingCamps}
                  onRegisterCamp={handleRegisterCamp}
                  onToggleAvailability={handleToggleAvailability}
                />
              )}
              {view === "history" && (
                <HistoryView
                  donations={donations}
                  donationsLoading={donationsLoading}
                  donationsMeta={donationsMeta}
                  onPageChange={handleHistoryPageChange}
                  onFilterChange={handleHistoryFilterChange}
                  currentFilter={historyFilter}
                />
              )}
              {view === "profile" && (
                <ProfileView profile={profile} onUpdate={fetchData} />
              )}
              {view === "settings" && (
                <div className="animate-in">
                  <h1 className="page-title">Settings</h1>
                  <p className="page-subtitle">
                    Manage your account preferences.
                  </p>
                  <div className="stat-card">
                    Settings module coming soon...
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};
export default DonorDashboard;
