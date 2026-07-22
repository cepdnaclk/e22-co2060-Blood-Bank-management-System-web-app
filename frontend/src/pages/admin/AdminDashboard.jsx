import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Users,
  Building,
  Droplet,
  AlertCircle,
  Heart,
  Search,
  Download,
  Edit,
  Trash2,
  Bell,
  Clock,
  Activity,
  CheckCircle,
} from "lucide-react";
import {
  getAdminDashboardStats,
  getAdminDonors,
  getAdminCamps,
} from "../../services/adminDashboardService";
import {
  getWorkflowNotifications,
  markWorkflowNotificationRead,
} from "../../services/campService";
import Swal from "sweetalert2";
import StatCard from "../../components/ui/StatCard";
import DataTable from "../../components/ui/DataTable";
import StatusBadge from "../../components/ui/StatusBadge";

const AdminDashboard = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const activeTab = queryParams.get("tab") || "overview";

  const [donorSearch, setDonorSearch] = useState("");
  const [campSearch, setCampSearch] = useState("");

  const [dashboardStats, setDashboardStats] = useState({
    total_doctors: 0,
    total_hospitals: 0,
    total_units: 0,
    pending_requests: 0,
    approved_donations: 0,
    workflow_status_counts: {},
    today_donated_count: 0,
    rejection_reason_summary: [],
  });
  const [donors, setDonors] = useState([]);
  const [camps, setCamps] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async (isSilent = false) => {
      if (!isSilent) {
        setLoading(true);
      }
      try {
        if (activeTab === "overview") {
          const [statsData, notificationData] = await Promise.all([
            getAdminDashboardStats(),
            getWorkflowNotifications(),
          ]);
          setDashboardStats(statsData);
          setNotifications(notificationData);
          const donorsData = await getAdminDonors();
          const campsData = await getAdminCamps();
          setDonors(donorsData);
          setCamps(campsData);
        } else if (activeTab === "donors") {
          const donorsData = await getAdminDonors();
          setDonors(donorsData);
        } else if (activeTab === "camps") {
          const campsData = await getAdminCamps();
          setCamps(campsData);
        }
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const timer = setInterval(fetchData, 8000);
    return () => clearInterval(timer);
  }, [activeTab]);

  // Handlers for Donors
  const filteredDonors = donors.filter(
    (d) =>
      d.name.toLowerCase().includes(donorSearch.toLowerCase()) ||
      d.bloodGroup.toLowerCase().includes(donorSearch.toLowerCase()),
  );

  const handleDeleteDonor = (id) => {
    if (window.confirm("Are you sure you want to delete this donor?")) {
      setDonors(donors.filter((d) => d.id !== id));
    }
  };

  const handleExportDonors = () => {
    alert("Exporting Donor List to CSV...");
  };

  // Handlers for Camps
  const filteredCamps = camps.filter(
    (c) =>
      c.name.toLowerCase().includes(campSearch.toLowerCase()) ||
      c.organizer.toLowerCase().includes(campSearch.toLowerCase()),
  );

  const handleDeleteCamp = (id) => {
    if (
      window.confirm("Are you sure you want to delete this camp organizer?")
    ) {
      setCamps(camps.filter((c) => c.id !== id));
    }
  };

  const handleExportCamps = () => {
    alert("Exporting Camp Organizers List to CSV...");
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleOpenNotifications = async () => {
    const html = notifications.length
      ? `<div style="text-align:left;max-height:300px;overflow:auto;">${notifications
          .map(
            (
              n,
            ) => `<div style="padding:8px 0;border-bottom:1px solid var(--color-border);">
              <strong style="color:var(--color-text-main);">${n.event_type}</strong><br/>
              <span style="color:var(--color-text-muted);">${n.message}</span><br/>
              <small style="color:var(--color-text-muted);">${new Date(n.created_at).toLocaleString()}</small>
            </div>`,
          )
          .join("")}</div>`
      : "<p>No notifications.</p>";
    await Swal.fire({ title: "Workflow Notifications", html, width: 700 });
    await Promise.all(
      notifications
        .filter((n) => !n.is_read)
        .map((n) => markWorkflowNotificationRead(n.id)),
    );
  };

  return (
    <div>
      {/* Notifications Button outside since we don't have header actions here unless passed down. 
          Actually, DashboardLayout has headerActions. We can pass it from AdminLayout in a real app, 
          but for now we can show a floating button or a button here if needed. 
          I'll just add it to the top of the tab content for now. */}
      {loading && <p>Loading dashboard data...</p>}

      {!loading && activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "-10px",
            }}
          >
            <button
              className="dashboard btn btn-outline"
              onClick={handleOpenNotifications}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Bell size={18} /> Notifications ({unreadCount})
            </button>
          </div>

          <div className="stats-grid">
            <StatCard
              title="Total Donors"
              value={donors.length}
              Icon={Users}
              colorClass="text-info"
            />
            <StatCard
              title="Active Camps"
              value={camps.length}
              Icon={Building}
              colorClass="text-primary"
            />
            <StatCard
              title="Blood Units"
              value={dashboardStats.total_units}
              Icon={Droplet}
              colorClass="text-critical"
            />
            <StatCard
              title="Pending Requests"
              value={dashboardStats.pending_requests}
              Icon={AlertCircle}
              colorClass="text-warning"
            />
            <StatCard
              title="Approved Donations"
              value={dashboardStats.approved_donations}
              Icon={CheckCircle}
              colorClass="text-success"
            />
            <StatCard
              title="Today Donated"
              value={dashboardStats.today_donated_count}
              Icon={Heart}
              colorClass="text-primary"
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "24px",
            }}
          >
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Workflow Status Counts</h4>
              </div>
              <div className="card-body">
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {Object.entries(
                    dashboardStats.workflow_status_counts || {},
                  ).map(([key, value]) => (
                    <li
                      key={key}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        borderBottom: "1px solid var(--color-border)",
                        paddingBottom: "8px",
                      }}
                    >
                      <span style={{ textTransform: "capitalize" }}>{key}</span>
                      <strong>{value}</strong>
                    </li>
                  ))}
                  {Object.keys(dashboardStats.workflow_status_counts || {})
                    .length === 0 && <li>No workflow data yet.</li>}
                </ul>
              </div>
            </div>
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Top Rejection Reasons</h4>
              </div>
              <div className="card-body">
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {(dashboardStats.rejection_reason_summary || []).map(
                    (item) => (
                      <li
                        key={item.rejection_reason}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          borderBottom: "1px solid var(--color-border)",
                          paddingBottom: "8px",
                        }}
                      >
                        <span>{item.rejection_reason}</span>
                        <strong>{item.count}</strong>
                      </li>
                    ),
                  )}
                  {(dashboardStats.rejection_reason_summary || []).length ===
                    0 && <li>No rejection records.</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && activeTab === "donors" && (
        <div className="card">
          <div
            className="card-header"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ position: "relative", width: "300px" }}>
              <Search
                size={18}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "10px",
                  color: "var(--color-text-muted)",
                }}
              />
              <input
                type="text"
                placeholder="Search donors by name or blood group..."
                value={donorSearch}
                onChange={(e) => setDonorSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 36px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text-main)",
                }}
              />
            </div>
            <button
              className="dashboard btn btn-outline"
              onClick={handleExportDonors}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Download size={18} /> Export CSV
            </button>
          </div>
          <DataTable
            columns={[
              "ID",
              "Name",
              "Blood Group",
              "Contact",
              "Last Donation",
              "Status",
              "Actions",
            ]}
            data={filteredDonors}
            emptyMessage="No donors found."
            renderRow={(donor) => (
              <tr key={donor.id}>
                <td>#{donor.id}</td>
                <td>
                  <strong>{donor.name}</strong>
                </td>
                <td>
                  <strong>{donor.bloodGroup}</strong>
                </td>
                <td>{donor.contact}</td>
                <td>{donor.lastDonation}</td>
                <td>
                  <StatusBadge status={donor.status} />
                </td>
                <td style={{ display: "flex", gap: "8px" }}>
                  <button
                    className="dashboard btn btn-outline"
                    title="Edit"
                    style={{ padding: "6px" }}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    className="dashboard btn btn-outline"
                    title="Delete"
                    onClick={() => handleDeleteDonor(donor.id)}
                    style={{ padding: "6px", color: "var(--color-critical)" }}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            )}
          />
        </div>
      )}

      {!loading && activeTab === "camps" && (
        <div className="card">
          <div
            className="card-header"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ position: "relative", width: "300px" }}>
              <Search
                size={18}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "10px",
                  color: "var(--color-text-muted)",
                }}
              />
              <input
                type="text"
                placeholder="Search camps or organizers..."
                value={campSearch}
                onChange={(e) => setCampSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 36px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text-main)",
                }}
              />
            </div>
            <button
              className="dashboard btn btn-outline"
              onClick={handleExportCamps}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Download size={18} /> Export CSV
            </button>
          </div>
          <DataTable
            columns={[
              "ID",
              "Camp Name",
              "Organizer",
              "Date",
              "Location",
              "Expected Donors",
              "Actions",
            ]}
            data={filteredCamps}
            emptyMessage="No camps found."
            renderRow={(camp) => (
              <tr key={camp.id}>
                <td>#{camp.id}</td>
                <td>
                  <strong>{camp.name}</strong>
                </td>
                <td>{camp.organizer}</td>
                <td>{camp.date}</td>
                <td>{camp.location}</td>
                <td>{camp.expectedDonors}</td>
                <td style={{ display: "flex", gap: "8px" }}>
                  <button
                    className="dashboard btn btn-outline"
                    title="Edit"
                    style={{ padding: "6px" }}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    className="dashboard btn btn-outline"
                    title="Delete"
                    onClick={() => handleDeleteCamp(camp.id)}
                    style={{ padding: "6px", color: "var(--color-critical)" }}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            )}
          />
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
