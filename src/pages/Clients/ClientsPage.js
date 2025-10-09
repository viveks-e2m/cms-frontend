import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/Layout/DashboardLayout/DashboardLayout";
import { useNotificationContext } from "../../contexts/NotificationContext";
import { clientAPI, meetingAPI, openPointsAPI } from "../../utils/apiServices";
import LoadingSpinner from "../../components/UI/LoadingSpinner/LoadingSpinner";
import {
  MeetingsList,
  MeetingDetails,
  MeetingForm,
} from "../../components/Meetings";
import OnboardingInfo from "../../components/Clients/OnboardingInfo";
import {
  People as PeopleIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  PersonOutline as PersonOutlineIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  VideoCall as VideoCallIcon,
  Assignment as AssignmentIcon,
  Security as SecurityIcon,
  AccountTree as WorkflowIcon,
  ArrowBack as ArrowBackIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  ViewModule as GridViewIcon,
  ViewList as ListViewIcon,
} from "@mui/icons-material";
import "./ClientsPage.css";

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientDetails, setClientDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Meeting-related state
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [meetingsView, setMeetingsView] = useState("list"); // 'list' or 'details'

  const { showError, showSuccess } = useNotificationContext();

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const clientsData = await clientAPI.getAll();
      setClients(clientsData);
    } catch (error) {
      showError("Failed to load clients");
      console.error("Error loading clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadClientDetails = async (clientId) => {
    try {
      setDetailsLoading(true);

      // Load client basic info
      const client = clients.find((c) => c.id === clientId);

      // Load related data
      const [meetings, tasks] = await Promise.all([
        meetingAPI.getByClient(clientId).catch(() => []),
        openPointsAPI.getByClient(clientId).catch(() => []),
      ]);

      setClientDetails({
        ...client,
        meetings,
        tasks,
        workflows: [], // Placeholder for workflows
        secrets: [], // Placeholder for secrets
      });
    } catch (error) {
      showError("Failed to load client details");
      console.error("Error loading client details:", error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    loadClientDetails(client.id);
  };

  const handleBackToList = () => {
    setSelectedClient(null);
    setClientDetails(null);
    setActiveTab("overview");
    setSelectedMeeting(null);
    setShowMeetingForm(false);
    setEditingMeeting(null);
    setMeetingsView("list");
  };

  // Meeting handlers
  const handleMeetingSelect = (meeting) => {
    setSelectedMeeting(meeting);
    setMeetingsView("details");
  };

  const handleBackToMeetings = () => {
    setSelectedMeeting(null);
    setMeetingsView("list");
  };

  const handleAddMeeting = () => {
    setEditingMeeting(null);
    setShowMeetingForm(true);
  };

  const handleEditMeeting = (meeting) => {
    setEditingMeeting(meeting);
    setShowMeetingForm(true);
  };

  const handleDeleteMeeting = async (meeting) => {
    if (
      !window.confirm(`Are you sure you want to delete "${meeting.title}"?`)
    ) {
      return;
    }

    try {
      await meetingAPI.delete(meeting.id);
      showSuccess("Meeting deleted successfully");
      loadClientDetails(selectedClient.id);
    } catch (error) {
      showError("Failed to delete meeting");
      console.error("Error deleting meeting:", error);
    }
  };

  const handleMeetingFormSave = () => {
    setShowMeetingForm(false);
    setEditingMeeting(null);
    loadClientDetails(selectedClient.id);
  };

  const handleMeetingFormCancel = () => {
    setShowMeetingForm(false);
    setEditingMeeting(null);
  };

  // Enhanced filtering and sorting logic
  const getClientStatus = (client) => {
    // Determine client status based on various factors
    if (client.status) {
      return client.status.toLowerCase();
    }
    // Default logic: consider active if created within last 90 days or has recent activity
    const createdDate = new Date(client.created_at);
    const daysSinceCreated =
      (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCreated <= 90 ? "active" : "inactive";
  };

  const filteredAndSortedClients = clients
    .filter((client) => {
      // Search filter
      const matchesSearch =
        client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.company?.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus =
        !statusFilter || getClientStatus(client) === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "name":
          aValue = a.name?.toLowerCase() || "";
          bValue = b.name?.toLowerCase() || "";
          break;
        case "email":
          aValue = a.email?.toLowerCase() || "";
          bValue = b.email?.toLowerCase() || "";
          break;
        case "company":
          aValue = a.company?.toLowerCase() || "";
          bValue = b.company?.toLowerCase() || "";
          break;
        case "created":
          aValue = new Date(a.created_at || 0);
          bValue = new Date(b.created_at || 0);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="page-loading">
          <LoadingSpinner message="Loading clients..." />
        </div>
      </DashboardLayout>
    );
  }

  // Render client details view
  if (selectedClient) {
    return (
      <DashboardLayout>
        <div className="clients-page">
          <div className="client-details-header">
            <button className="back-btn" onClick={handleBackToList}>
              <ArrowBackIcon />
            </button>
            <div className="client-details-title">
              <div className="client-avatar-large">
                <PersonOutlineIcon />
              </div>
              <div className="client-title-info">
                <h1>{selectedClient.name || "Unnamed Client"}</h1>
                <p>{selectedClient.email}</p>
              </div>
            </div>
          </div>

          <div className="client-details-tabs">
            <button
              className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              <PersonIcon />
              Overview
            </button>
            <button
              className={`tab-btn ${activeTab === "meetings" ? "active" : ""}`}
              onClick={() => setActiveTab("meetings")}
            >
              <VideoCallIcon />
              Meetings
            </button>
            <button
              className={`tab-btn ${activeTab === "tasks" ? "active" : ""}`}
              onClick={() => setActiveTab("tasks")}
            >
              <AssignmentIcon />
              Open Points
            </button>
            <button
              className={`tab-btn ${activeTab === "workflows" ? "active" : ""}`}
              onClick={() => setActiveTab("workflows")}
            >
              <WorkflowIcon />
              Workflows
            </button>
            <button
              className={`tab-btn ${activeTab === "secrets" ? "active" : ""}`}
              onClick={() => setActiveTab("secrets")}
            >
              <SecurityIcon />
              Secrets
            </button>
          </div>

          <div className="client-details-content">
            {detailsLoading ? (
              <div className="details-loading">
                <LoadingSpinner message="Loading client details..." />
              </div>
            ) : (
              <>
                {activeTab === "overview" && (
                  <div className="overview-tab">
                    <div className="overview-cards">
                      <div className="overview-card">
                        <h3>Client Information</h3>
                        <div className="info-grid">
                          <div className="info-item">
                            <PersonIcon className="info-icon" />
                            <div>
                              <label>Name</label>
                              <span>
                                {selectedClient.name || "Not provided"}
                              </span>
                            </div>
                          </div>
                          <div className="info-item">
                            <EmailIcon className="info-icon" />
                            <div>
                              <label>Email</label>
                              <span>
                                {selectedClient.email || "Not provided"}
                              </span>
                            </div>
                          </div>
                          <div className="info-item">
                            <PhoneIcon className="info-icon" />
                            <div>
                              <label>Phone</label>
                              <span>
                                {selectedClient.phone || "Not provided"}
                              </span>
                            </div>
                          </div>
                          <div className="info-item">
                            <BusinessIcon className="info-icon" />
                            <div>
                              <label>Company</label>
                              <span>
                                {selectedClient.company || "Not provided"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="overview-card">
                        <h3>Statistics</h3>
                        <div className="stats-grid">
                          <div className="stat-item">
                            <VideoCallIcon className="stat-icon meetings" />
                            <div>
                              <span className="stat-number">
                                {clientDetails?.meetings?.length || 0}
                              </span>
                              <label>Meetings</label>
                            </div>
                          </div>
                          <div className="stat-item">
                            <AssignmentIcon className="stat-icon tasks" />
                            <div>
                              <span className="stat-number">
                                {clientDetails?.tasks?.length || 0}
                              </span>
                              <label>Open Points</label>
                            </div>
                          </div>
                          <div className="stat-item">
                            <WorkflowIcon className="stat-icon workflows" />
                            <div>
                              <span className="stat-number">
                                {clientDetails?.workflows?.length || 0}
                              </span>
                              <label>Workflows</label>
                            </div>
                          </div>
                          <div className="stat-item">
                            <SecurityIcon className="stat-icon secrets" />
                            <div>
                              <span className="stat-number">
                                {clientDetails?.secrets?.length || 0}
                              </span>
                              <label>Secrets</label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Activity Section */}
                    <div className="recent-activity-section">
                      <h3>Recent Activity</h3>
                      <div className="activity-cards">
                        {/* Recent Meetings */}
                        <div className="activity-card">
                          <div className="activity-header">
                            <VideoCallIcon className="activity-icon meetings" />
                            <h4>Recent Meetings</h4>
                            <button
                              className="view-all-btn"
                              onClick={() => setActiveTab("meetings")}
                            >
                              View All
                            </button>
                          </div>
                          <div className="activity-content">
                            {clientDetails?.meetings?.length > 0 ? (
                              clientDetails.meetings
                                .slice(0, 3)
                                .map((meeting) => (
                                  <div
                                    key={meeting.id}
                                    className="activity-item"
                                  >
                                    <div className="activity-item-info">
                                      <h5>
                                        {meeting.title || "Untitled Meeting"}
                                      </h5>
                                      <p>
                                        {meeting.summary ||
                                          "No summary available"}
                                      </p>
                                      <span className="activity-date">
                                        {new Date(
                                          meeting.created_at
                                        ).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                ))
                            ) : (
                              <div className="activity-empty">
                                <VideoCallIcon className="empty-icon" />
                                <p>No meetings yet</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Recent Open Points */}
                        <div className="activity-card">
                          <div className="activity-header">
                            <AssignmentIcon className="activity-icon tasks" />
                            <h4>Recent Open Points</h4>
                            <button
                              className="view-all-btn"
                              onClick={() => setActiveTab("tasks")}
                            >
                              View All
                            </button>
                          </div>
                          <div className="activity-content">
                            {clientDetails?.tasks?.length > 0 ? (
                              clientDetails.tasks.slice(0, 3).map((task) => (
                                <div key={task.id} className="activity-item">
                                  <div className="activity-item-info">
                                    <h5>{task.message || "Untitled Task"}</h5>
                                    <div className="task-meta">
                                      <span
                                        className={`task-status ${task.status}`}
                                      >
                                        {task.status?.replace("_", " ") ||
                                          "Open"}
                                      </span>
                                      {task.due_date && (
                                        <span className="due-date">
                                          Due:{" "}
                                          {new Date(
                                            task.due_date
                                          ).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="activity-empty">
                                <AssignmentIcon className="empty-icon" />
                                <p>No open points yet</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Onboarding Information Section */}
                    <div className="onboarding-section-wrapper">
                      <OnboardingInfo
                        clientId={selectedClient.id}
                        existingOnboardingInfo={selectedClient.onboarding_info}
                      />
                    </div>
                  </div>
                )}

                {activeTab === "meetings" && (
                  <div className="meetings-tab">
                    {meetingsView === "list" ? (
                      <MeetingsList
                        meetings={clientDetails?.meetings || []}
                        onMeetingSelect={handleMeetingSelect}
                        onAddMeeting={handleAddMeeting}
                        onEditMeeting={handleEditMeeting}
                        onDeleteMeeting={handleDeleteMeeting}
                        loading={detailsLoading}
                      />
                    ) : (
                      <MeetingDetails
                        meetingId={selectedMeeting?.id}
                        onBack={handleBackToMeetings}
                        onEdit={handleEditMeeting}
                        onDelete={handleDeleteMeeting}
                        clientName={selectedClient?.name}
                      />
                    )}
                  </div>
                )}

                {activeTab === "tasks" && (
                  <div className="tasks-tab">
                    <div className="tab-header">
                      <h3>Open Points</h3>
                      <button className="btn btn-primary">
                        <AddIcon />
                        Add Task
                      </button>
                    </div>
                    <div className="tasks-list">
                      {clientDetails?.tasks?.length > 0 ? (
                        clientDetails.tasks.map((task) => (
                          <div key={task.id} className="task-item">
                            <AssignmentIcon className="task-icon" />
                            <div className="task-info">
                              <h4>{task.title || "Untitled Task"}</h4>
                              <p>{task.description || "No description"}</p>
                              <span className={`task-status ${task.status}`}>
                                {task.status?.replace("_", " ") || "Open"}
                              </span>
                            </div>
                            <button className="action-btn">
                              <MoreVertIcon />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="empty-tab-state">
                          <AssignmentIcon className="empty-icon" />
                          <h4>No open points found</h4>
                          <p>
                            All tasks are completed or no tasks have been
                            created yet.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "workflows" && (
                  <div className="workflows-tab">
                    <div className="tab-header">
                      <h3>Workflows</h3>
                      <button className="btn btn-primary">
                        <AddIcon />
                        Add Workflow
                      </button>
                    </div>
                    <div className="empty-tab-state">
                      <WorkflowIcon className="empty-icon" />
                      <h4>No workflows found</h4>
                      <p>Workflows feature coming soon.</p>
                    </div>
                  </div>
                )}

                {activeTab === "secrets" && (
                  <div className="secrets-tab">
                    <div className="tab-header">
                      <h3>Client Secrets</h3>
                      <button className="btn btn-primary">
                        <AddIcon />
                        Add Secret
                      </button>
                    </div>
                    <div className="empty-tab-state">
                      <SecurityIcon className="empty-icon" />
                      <h4>No secrets found</h4>
                      <p>Secrets are securely stored and managed.</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Meeting Form Modal */}
          <MeetingForm
            meeting={editingMeeting}
            clientId={selectedClient?.id}
            clientName={selectedClient?.name}
            onSave={handleMeetingFormSave}
            onCancel={handleMeetingFormCancel}
            isOpen={showMeetingForm}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="clients-page">
        <div className="page-header">
          <div className="page-title-section">
            <h1 className="page-title">
              <PeopleIcon className="page-icon" />
              Manage Clients
            </h1>
            <p className="page-subtitle">
              Manage your client information, assignments, and relationships
            </p>
          </div>
          <button className="btn btn-primary">
            <AddIcon />
            Add New Client
          </button>
        </div>

        <div className="page-content">
          <div className="content-header">
            <div className="search-section">
              <div className="search-input-wrapper">
                <SearchIcon className="search-icon" />
                <input
                  type="text"
                  placeholder="Search clients by name, email, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            <div className="controls-section">
              <div className="filter-controls">
                <div className="filter-group">
                  <FilterIcon className="filter-icon" />
                  <select
                    className="filter-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="sort-group">
                  <SortIcon className="sort-icon" />
                  <select
                    className="sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="name">Sort by Name</option>
                    <option value="email">Sort by Email</option>
                    <option value="company">Sort by Company</option>
                    <option value="created">Sort by Date Added</option>
                  </select>

                  <button
                    className={`sort-order-btn ${
                      sortOrder === "desc" ? "desc" : "asc"
                    }`}
                    onClick={() =>
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                    }
                    title={`Sort ${
                      sortOrder === "asc" ? "Descending" : "Ascending"
                    }`}
                  >
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </button>
                </div>
              </div>

              <div className="results-info">
                <span className="results-count">
                  {filteredAndSortedClients.length} of {clients.length} clients
                </span>
              </div>
            </div>
          </div>

          <div className="clients-grid">
            {filteredAndSortedClients.length > 0 ? (
              filteredAndSortedClients.map((client) => {
                const clientStatus = getClientStatus(client);

                return (
                  <div
                    key={client.id}
                    className="client-card"
                    onClick={() => handleClientSelect(client)}
                  >
                    <div className="client-avatar">
                      <PersonOutlineIcon />
                    </div>
                    <div className="client-info">
                      <h3 className="client-name">
                        {client.name || "Unnamed Client"}
                      </h3>
                      <p className="client-email">
                        <EmailIcon className="email-icon" />
                        {client.email}
                      </p>
                      {client.company && (
                        <p className="client-company">
                          <BusinessIcon className="company-icon" />
                          {client.company}
                        </p>
                      )}
                      <div className="client-meta">
                        <span className={`client-status ${clientStatus}`}>
                          {clientStatus === "active" ? "Active" : "Inactive"}
                        </span>
                        <span className="client-date">
                          Added{" "}
                          {new Date(
                            client.created_at || Date.now()
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div
                      className="client-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button className="action-btn edit" title="Edit Client">
                        <EditIcon />
                      </button>
                      <button
                        className="action-btn view"
                        title="View Details"
                        onClick={() => handleClientSelect(client)}
                      >
                        <VisibilityIcon />
                      </button>
                      <button
                        className="action-btn delete"
                        title="Delete Client"
                      >
                        <DeleteIcon />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <PeopleIcon className="empty-icon" />
                <h3>No Clients Found</h3>
                <p>
                  {searchTerm || statusFilter
                    ? `No clients match your current filters. Try adjusting your search criteria.`
                    : "Start by adding your first client to get started with the CMS."}
                </p>
                {!searchTerm && !statusFilter && (
                  <button className="btn btn-primary">
                    <AddIcon />
                    Add Your First Client
                  </button>
                )}
                {(searchTerm || statusFilter) && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("");
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClientsPage;
