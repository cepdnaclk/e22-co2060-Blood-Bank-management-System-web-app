import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/auth/useAuth";
import {
  Search,
  Ambulance,
  LayoutDashboard,
  Droplet,
  ClipboardList,
  Bell,
  User,
  UserCircle,
  Camera,
  QrCode,
  Stethoscope,
  CheckCircle,
  Clock,
} from "lucide-react";
import Swal from "sweetalert2";
import QRScanner from "../../components/doctor/QRScanner";
import {
  getDoctorRequests,
  createBloodRequest,
} from "../../api/bloodRequestService";
import { getBloodStock } from "../../api/inventoryService";
import api from "../../api/api";
import {
  approveCampRegistration,
  getScreeningQueue,
  getWorkflowNotifications,
  markWorkflowNotificationRead,
  rejectCampRegistration,
} from "../../services/campService";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/ui/StatCard";
import DataTable from "../../components/ui/DataTable";
import StatusBadge from "../../components/ui/StatusBadge";
import "./DoctorDashboard.scss";

const DOCTOR_TABS = {
  DASHBOARD: "dashboard",
  SCREENING_QUEUE: "screening-queue",
  REQUEST_BLOOD: "request-blood",
  REQUESTS: "requests",
  AVAILABILITY: "availability",
  SCANNER: "scanner",
  PROFILE: "profile",
};

const REQUEST_URGENCY_OPTIONS = [
  "Normal (Within 24h)",
  "Urgent (Within 4h)",
  "Critical (Immediate)",
];

const normalizeList = (value) => {
  if (Array.isArray(value)) {
    return value;
  }
  return value?.results || [];
};

const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );

const buildNotificationsHtml = (notifications) => {
  if (!notifications.length) {
    return '<p class="doctor-empty-note">No notifications.</p>';
  }

  return `
        <div class="doctor-notification-list">
            ${notifications
              .map(
                (notification) => `
                <article class="doctor-notification-item">
                    <strong>${escapeHtml(notification.event_type)}</strong>
                    <span>${escapeHtml(notification.message)}</span>
                    <small>${escapeHtml(new Date(notification.created_at).toLocaleString())}</small>
                </article>
            `,
              )
              .join("")}
        </div>
    `;
};

const requestPriorityFromUrgency = (urgency) => {
  if (urgency === "Critical (Immediate)") {
    return "CRITICAL";
  }
  if (urgency === "Urgent (Within 4h)") {
    return "HIGH";
  }
  return "NORMAL";
};

const isCompletedRequest = (status) => {
  const normalized = String(status ?? "").toUpperCase();
  return normalized === "FULFILLED" || normalized === "COMPLETED";
};

const MENU_ITEMS = [
  {
    id: DOCTOR_TABS.DASHBOARD,
    icon: <LayoutDashboard size={20} />,
    label: "Dashboard",
  },
  {
    id: DOCTOR_TABS.SCREENING_QUEUE,
    icon: <Stethoscope size={20} />,
    label: "Screening Queue",
  },
  {
    id: DOCTOR_TABS.REQUEST_BLOOD,
    icon: <Droplet size={20} />,
    label: "Request Blood",
  },
  {
    id: DOCTOR_TABS.REQUESTS,
    icon: <ClipboardList size={20} />,
    label: "My Requests",
  },
  {
    id: DOCTOR_TABS.AVAILABILITY,
    icon: <Search size={20} />,
    label: "Blood Availability",
  },
  {
    id: DOCTOR_TABS.SCANNER,
    icon: <QrCode size={20} />,
    label: "Donor Scanner",
  },
  { id: DOCTOR_TABS.PROFILE, icon: <UserCircle size={20} />, label: "Profile" },
];
const DoctorDashboard = () => {
  const [activeTab, setActiveTab] = useState(DOCTOR_TABS.DASHBOARD);
  const [profileImage, setProfileImage] = useState(null);
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [userProfileData, setUserProfileData] = useState(null);

  const [requests, setRequests] = useState([]);
  const [inventory, setInventory] = useState({});
  const [screeningQueue, setScreeningQueue] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [queueActionLoading, setQueueActionLoading] = useState(null);
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [profileUploading, setProfileUploading] = useState(false);

  const fetchDashboardData = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setDashboardError("");

    try {
      const results = await Promise.allSettled([
        getDoctorRequests(),
        getBloodStock(),
        getScreeningQueue(),
        getWorkflowNotifications(),
      ]);

      const [reqRes, invRes, queueRes, notiRes] = results;

      if (reqRes.status === "fulfilled" && reqRes.value?.success) {
        setRequests(normalizeList(reqRes.value.data));
      }

      if (invRes.status === "fulfilled" && invRes.value?.success) {
        setInventory(invRes.value.data);
      }

      if (queueRes.status === "fulfilled") {
        setScreeningQueue(normalizeList(queueRes.value));
      }

      if (notiRes.status === "fulfilled") {
        setNotifications(normalizeList(notiRes.value));
      }

      const failedCall = results.find((result) => {
        if (result.status === "rejected") {
          return true;
        }

        return result.value && result.value.success === false;
      });

      if (failedCall) {
        setDashboardError(
          "Some dashboard data could not be refreshed. Showing the latest available data.",
        );
      }
    } catch {
      setDashboardError("Unable to refresh dashboard data.");
    } finally {
      if (showLoading) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  }, []);

  const fetchDoctorProfile = useCallback(async () => {
    if (!user?.user_id) {
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    setProfileError("");

    try {
      const [doctorResult, profileResult] = await Promise.allSettled([
        api.get(`adminDashboard/doctor/profile/${user.user_id}/`),
        api.get("auth/profile/"),
      ]);

      if (doctorResult.status === "fulfilled") {
        const doctorData = doctorResult.value.data;
        setProfileData(doctorData);
        if (doctorData?.profile_pic) {
          setProfileImage(doctorData.profile_pic);
        }
      } else {
        setProfileData(null);
      }

      if (profileResult.status === "fulfilled") {
        setUserProfileData(profileResult.value.data);
      } else {
        setUserProfileData(null);
      }

      if (
        doctorResult.status === "rejected" &&
        profileResult.status === "rejected"
      ) {
        setProfileError("Unable to load doctor profile details.");
      }
    } catch {
      setProfileError("Unable to load doctor profile details.");
    } finally {
      setProfileLoading(false);
    }
  }, [user?.user_id]);

  useEffect(() => {
    if (!user?.user_id) {
      return undefined;
    }

    fetchDoctorProfile();
    fetchDashboardData(true);
    const timer = setInterval(() => fetchDashboardData(false), 8000);

    return () => clearInterval(timer);
  }, [user?.user_id, fetchDoctorProfile, fetchDashboardData]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profile_pic", file);

    try {
      setProfileUploading(true);
      await api.patch("medicalOfficers/doctor/profile-pic/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setProfileImage(URL.createObjectURL(file));
      Swal.fire({
        title: "Photo Uploaded!",
        text: "Your profile photo has been updated.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch {
      Swal.fire(
        "Upload Failed",
        "Could not save the image. Try again.",
        "error",
      );
    } finally {
      setProfileUploading(false);
    }
  };

  const handleEmergencyRequest = async () => {
    const result = await Swal.fire({
      title: "EMERGENCY BLOOD REQUEST",
      html: `
                <div style="text-align: left;">
                    <p style="color: var(--color-critical); font-weight: bold; margin-bottom: 10px;">This triggers an immediate high-priority alert to the blood bank AND eligible donors.</p>
                    <label>Blood Group Required:</label>
                    <select id="em-blood" class="swal2-select" style="display: flex; width: 100%;">
                        <option>O-</option><option>O+</option><option>A-</option><option>A+</option>
                        <option>B-</option><option>B+</option><option>AB-</option><option>AB+</option>
                    </select>
                    <label style="margin-top: 10px; display: block;">Units Needed:</label>
                    <input id="em-units" type="number" value="2" class="swal2-input" style="display: flex; width: 100%;" />
                </div>
            `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--color-critical)",
      confirmButtonText: "SUBMIT EMERGENCY REQUEST",
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        try {
          const payload = {
            blood_group: document.getElementById("em-blood").value,
            units_requested: document.getElementById("em-units").value,
            priority_level: "CRITICAL",
          };
          const response = await createBloodRequest(payload);
          if (!response.success) {
            Swal.showValidationMessage(
              response.error?.detail || "Failed to dispatch emergency request.",
            );
            return null;
          }
          return response;
        } catch (error) {
          Swal.showValidationMessage(
            error.response?.data?.detail ||
              "Failed to dispatch emergency request.",
          );
          return null;
        }
      },
    });

    if (!result.isConfirmed || !result.value) {
      return;
    }

    Swal.fire("Dispatched!", "Emergency request sent.", "success");
    fetchDashboardData(false);
  };

  const handleBloodRequestSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      setRequestSubmitting(true);
      data.priority_level = requestPriorityFromUrgency(data.urgency);

      const res = await createBloodRequest(data);
      if (res.success) {
        Swal.fire(
          "Success",
          "Blood request submitted successfully.",
          "success",
        );
        fetchDashboardData(false);
        setActiveTab(DOCTOR_TABS.REQUESTS);
      } else {
        Swal.fire("Error", res.error?.detail || "Submission failed", "error");
      }
    } finally {
      setRequestSubmitting(false);
    }
  };

  const handleApproveDonor = async (registrationId) => {
    try {
      setQueueActionLoading(registrationId);
      await approveCampRegistration(registrationId);
      await fetchDashboardData(false);
      Swal.fire("Approved", "Donor approved for collection.", "success");
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.detail || "Could not approve donor.",
        "error",
      );
    } finally {
      setQueueActionLoading(null);
    }
  };

  const handleRejectDonor = async (registrationId) => {
    const result = await Swal.fire({
      title: "Reject Donor",
      input: "text",
      inputLabel: "Reason for rejection",
      inputPlaceholder: "e.g. Hb below threshold",
      showCancelButton: true,
      preConfirm: (reason) => {
        if (!reason) Swal.showValidationMessage("Rejection reason is required");
        return reason;
      },
    });
    if (!result.isConfirmed) return;

    try {
      setQueueActionLoading(registrationId);
      await rejectCampRegistration(registrationId, result.value);
      await fetchDashboardData(false);
      Swal.fire("Rejected", "Donor rejected with reason.", "info");
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.detail || "Could not reject donor.",
        "error",
      );
    } finally {
      setQueueActionLoading(null);
    }
  };

  const handleOpenNotifications = async () => {
    const html = buildNotificationsHtml(notifications);
    await Swal.fire({ title: "Notifications", html, width: 700 });
    await Promise.allSettled(
      notifications
        .filter((n) => !n.is_read)
        .map((n) => markWorkflowNotificationRead(n.id)),
    );
    await fetchDashboardData(false);
  };

  const displayName =
    profileData?.full_name ||
    userProfileData?.profile?.fullName ||
    profileData?.user?.first_name ||
    user?.username ||
    "Doctor Dashboard";
  const displayEmail =
    profileData?.user?.email || userProfileData?.user?.email || "";
  const displayHospital =
    profileData?.hospital || userProfileData?.profile?.hospital || "Hospital";
  const displayDepartment = profileData?.specialization || "Dept";

  const renderContent = () => {
    if (loading && requests.length === 0 && screeningQueue.length === 0) {
      return (
        <div className="doctor-loading-state">Loading dashboard data...</div>
      );
    }

    switch (activeTab) {
      case DOCTOR_TABS.SCREENING_QUEUE:
        return (
          <DataTable
            columns={[
              "Camp",
              "Donor",
              "Blood Group",
              "Phone",
              "Status",
              "Actions",
            ]}
            data={screeningQueue}
            emptyMessage="No donors waiting for screening."
            renderRow={(item) => (
              <tr key={item.id}>
                <td>{item.camp_title}</td>
                <td>{item.donor_name}</td>
                <td>{item.donor_blood_group || "N/A"}</td>
                <td>{item.donor_phone || "N/A"}</td>
                <td>
                  <StatusBadge status={item.status} />
                </td>
                <td className="doctor-table-actions">
                  <button
                    type="button"
                    className="dashboard btn btn-primary doctor-row-action"
                    onClick={() => handleApproveDonor(item.id)}
                    disabled={queueActionLoading === item.id}
                    aria-label={`Approve donor ${item.donor_name}`}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="dashboard btn doctor-row-action doctor-danger-button"
                    onClick={() => handleRejectDonor(item.id)}
                    disabled={queueActionLoading === item.id}
                    aria-label={`Reject donor ${item.donor_name}`}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            )}
          />
        );
      case DOCTOR_TABS.REQUEST_BLOOD:
        return (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">New Blood Request</h2>
            </div>
            <div className="card-body">
              <form
                onSubmit={handleBloodRequestSubmit}
                className="doctor-request-form-grid"
              >
                <div className="doctor-form-field">
                  <label className="stat-label doctor-field-label">
                    Blood Group Required
                  </label>
                  <select
                    name="blood_group"
                    required
                    className="doctor-form-control"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div className="doctor-form-field">
                  <label className="stat-label doctor-field-label">
                    Units Needed
                  </label>
                  <input
                    name="units_requested"
                    type="number"
                    min="1"
                    defaultValue="1"
                    required
                    className="doctor-form-control"
                  />
                </div>
                <div className="doctor-form-field">
                  <label className="stat-label doctor-field-label">
                    Urgency Level
                  </label>
                  <select name="urgency" className="doctor-form-control">
                    {REQUEST_URGENCY_OPTIONS.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div className="doctor-form-field doctor-form-field--full">
                  <label className="stat-label doctor-field-label">
                    Reason for Transfusion
                  </label>
                  <textarea
                    name="reason"
                    rows="2"
                    placeholder="Surgery, Accident, etc."
                    required
                    className="doctor-form-control doctor-textarea"
                  />
                </div>
                <div className="doctor-form-actions">
                  <button
                    type="submit"
                    className="dashboard btn btn-primary doctor-submit-button"
                    disabled={requestSubmitting}
                  >
                    {requestSubmitting ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      case DOCTOR_TABS.REQUESTS:
        return (
          <DataTable
            columns={[
              "Date",
              "Blood Group",
              "Units",
              "Priority",
              "Status",
              "Notes",
            ]}
            data={requests}
            emptyMessage="No requests found."
            renderRow={(req) => (
              <tr key={req.id}>
                <td>{new Date(req.created_at).toLocaleDateString()}</td>
                <td>
                  <strong>{req.blood_group}</strong>
                </td>
                <td>{req.units_requested}</td>
                <td>
                  <StatusBadge status={req.priority_level} />
                </td>
                <td>
                  <StatusBadge status={req.status} />
                </td>
                <td className="text-muted text-sm">
                  {req.status === "REJECTED"
                    ? req.rejection_note
                    : req.status === "APPROVED"
                      ? req.approval_note
                      : "-"}
                </td>
              </tr>
            )}
          />
        );
      case DOCTOR_TABS.AVAILABILITY:
        return (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                Blood Availability (Live Inventory)
              </h2>
            </div>
            <div className="card-body">
              {Object.keys(inventory).length === 0 ? (
                <div className="doctor-empty-state">
                  <p>Inventory data currently unavailable.</p>
                  <button
                    type="button"
                    className="dashboard btn btn-outline"
                    onClick={fetchDashboardData}
                  >
                    Retry Fetch
                  </button>
                </div>
              ) : (
                <div className="doctor-inventory-grid">
                  {Object.entries(inventory).map(([group, data]) => {
                    const isLow =
                      data.status === "LOW" || data.status === "CRITICAL";
                    return (
                      <div
                        key={group}
                        className={`doctor-inventory-card ${isLow ? "doctor-inventory-card--low" : "doctor-inventory-card--safe"}`}
                      >
                        <h3>{group}</h3>
                        <div className="doctor-inventory-units">
                          {data.units} Units
                        </div>
                        <div className="doctor-inventory-status">
                          {data.status}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      case DOCTOR_TABS.SCANNER:
        return (
          <div className="card">
            <div className="card-body">
              <QRScanner />
            </div>
          </div>
        );
      case DOCTOR_TABS.PROFILE:
        return (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">My Profile</h2>
            </div>
            <div className="card-body">
              {profileLoading && !profileData && !userProfileData ? (
                <div className="doctor-loading-state">
                  Loading profile details...
                </div>
              ) : (
                <div className="doctor-profile-layout">
                  <div className="doctor-profile-avatar-panel">
                    <div className="doctor-profile-avatar">
                      {profileImage ? (
                        <img src={profileImage} alt="Profile" />
                      ) : (
                        <User size={80} color="var(--color-text-muted)" />
                      )}
                    </div>
                    <label className="dashboard btn btn-outline doctor-upload-label">
                      {profileUploading ? (
                        <span className="doctor-upload-loading">
                          <span className="doctor-spinner" aria-hidden="true" />
                          Uploading...
                        </span>
                      ) : (
                        <>
                          <Camera size={16} /> Upload Photo
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={profileUploading}
                        aria-label="Upload profile photo"
                      />
                    </label>
                  </div>
                  <div className="doctor-profile-fields">
                    <div className="doctor-form-field">
                      <label className="stat-label doctor-field-label">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        readOnly
                        className="doctor-readonly-input"
                      />
                    </div>
                    <div className="doctor-form-field">
                      <label className="stat-label doctor-field-label">
                        Email
                      </label>
                      <input
                        type="email"
                        value={displayEmail}
                        readOnly
                        className="doctor-readonly-input"
                      />
                    </div>
                    <div className="doctor-form-field">
                      <label className="stat-label doctor-field-label">
                        Hospital
                      </label>
                      <input
                        type="text"
                        value={displayHospital}
                        readOnly
                        className="doctor-readonly-input"
                      />
                    </div>
                    <div className="doctor-form-field">
                      <label className="stat-label doctor-field-label">
                        Department
                      </label>
                      <input
                        type="text"
                        value={displayDepartment}
                        readOnly
                        className="doctor-readonly-input"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case DOCTOR_TABS.DASHBOARD:
      default: {
        const pendingCount = requests.filter(
          (r) => String(r.status).toUpperCase() === "PENDING",
        ).length;
        const completedCount = requests.filter((r) =>
          isCompletedRequest(r.status),
        ).length;

        return (
          <>
            <div className="stats-grid">
              <StatCard
                title="Total Requests"
                value={requests.length}
                Icon={ClipboardList}
                colorClass="text-primary"
              />
              <StatCard
                title="Pending Requests"
                value={pendingCount}
                Icon={Clock}
                colorClass="text-warning"
              />
              <StatCard
                title="Donors Waiting Screening"
                value={screeningQueue.length}
                Icon={Stethoscope}
                colorClass="text-info"
              />
              <StatCard
                title="Completed Requests"
                value={completedCount}
                Icon={CheckCircle}
                colorClass="text-success"
              />
            </div>
            {refreshing && (
              <div className="doctor-refreshing-state">
                Refreshing dashboard...
              </div>
            )}
          </>
        );
      }
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const headerActions = (
    <div className="doctor-header-actions">
      <button
        type="button"
        className="doctor-notification-button"
        onClick={handleOpenNotifications}
        aria-label={`Open notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        title="Notifications"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="doctor-notification-badge">{unreadCount}</span>
        )}
      </button>
      <button
        type="button"
        onClick={handleEmergencyRequest}
        className="dashboard btn doctor-emergency-button"
        aria-label="Create emergency blood request"
      >
        <Ambulance size={20} />
        <span>EMERGENCY</span>
      </button>
    </div>
  );

  return (
    <DashboardLayout
      title={displayName}
      subtitle={`${displayHospital} • ${displayDepartment}`}
      brandLabel="Doctor Portal"
      menuItems={MENU_ITEMS} // <-- Using the stable constant here stops the sidebar flash!
      activeTab={activeTab}
      onTabChange={setActiveTab}
      headerActions={headerActions}
    >
      <div className="doctor-dashboard-page">{renderContent()}</div>
    </DashboardLayout>
  );
};

export default DoctorDashboard;
