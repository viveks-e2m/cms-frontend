import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/Layout/DashboardLayout/DashboardLayout";
import { useNotificationContext } from "../../contexts/NotificationContext";
import { useAuth } from "../../hooks/useAuth";
import { PermissionGuard } from "../../components/PermissionGuard";
import {
  clientAPI,
  meetingAPI,
  secretsAPI,
  workflowAPI,
} from "../../utils/apiServices";
import LoadingSpinner from "../../components/UI/LoadingSpinner/LoadingSpinner";
import {
  MeetingsList,
  MeetingDetails,
  MeetingForm,
} from "../../components/Meetings";
import OnboardingInfo from "../../components/Clients/OnboardingInfo";
import SecretsManager from "../../components/Clients/SecretsManager";
import WorkflowManager from "../../components/Clients/WorkflowManager/WorkflowManager";
import ClientForm from "../../components/Clients/ClientForm";
import ClientAvatar from "../../components/UI/ClientAvatar";
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
  Business as BusinessIcon,
  AccountCircle as AccountManagerIcon,
  Support as AdoptionSpecialistIcon,
  Language as WebsiteIcon,
  VideoCall as VideoCallIcon,
  Security as SecurityIcon,
  AccountTree as WorkflowIcon,
  ArrowBack as ArrowBackIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Info as OnboardingIcon,
} from "@mui/icons-material";
import "./ClientsPage.css";

const ClientsPage = () => {
  const { hasPermission } = useAuth();
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
  const [users, setUsers] = useState([]);

  // Meeting-related state
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [meetingsView, setMeetingsView] = useState("list"); // 'list' or 'details'

  // Client form state
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  const { showError, showSuccess } = useNotificationContext();

  useEffect(() => {
    loadClients();
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const usersData = await clientAPI.getAllUsers();
      setUsers(usersData || []);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

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
      const [meetings, workflows, secrets] = await Promise.all([
        meetingAPI.getByClient(clientId).catch(() => []),
        workflowAPI.getByClient(clientId).catch(() => []),
        secretsAPI.getByClient(clientId).catch(() => []),
      ]);

      setClientDetails({
        ...client,
        meetings,
        workflows: workflows || [],
        secrets: secrets || [],
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

  // Client form handlers
  const handleAddClient = () => {
    console.log("Add client button clicked"); // Debug log
    setEditingClient(null);
    setShowClientForm(true);
    console.log("showClientForm set to true"); // Debug log
  };

  const handleEditClient = (client) => {
    setEditingClient(client);
    setShowClientForm(true);
  };

  const handleClientFormSave = () => {
    setShowClientForm(false);
    setEditingClient(null);
    loadClients(); // Reload the clients list
  };

  const handleClientFormCancel = () => {
    setShowClientForm(false);
    setEditingClient(null);
  };

  const handleDeleteClient = async (client) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${client.name}"? This will permanently delete the client and all associated data including meetings, workflows, and secrets.`
      )
    ) {
      return;
    }

    try {
      await clientAPI.delete(client.id);
      showSuccess("Client deleted successfully");
      loadClients(); // Reload the clients list

      // If the deleted client was currently selected, go back to list
      if (selectedClient && selectedClient.id === client.id) {
        handleBackToList();
      }
    } catch (error) {
      showError("Failed to delete client");
      console.error("Error deleting client:", error);
    }
  };

  // Enhanced filtering and sorting logic
  const getClientStatus = (client) => {
    // Return the actual status from the client object
    if (client.status) {
      return client.status.toLowerCase();
    }
    // Default to pre-boarding for new clients
    return "pre-boarding";
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "pre-boarding":
        return "Pre-boarding";
      case "onboarding":
        return "Onboarding";
      case "assessment":
        return "Assessment";
      case "active":
        return "Active";
      default:
        return "Pre-boarding";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pre-boarding":
        return "warning";
      case "onboarding":
        return "info";
      case "assessment":
        return "secondary";
      case "active":
        return "success";
      default:
        return "warning";
    }
  };

  const getUserName = (userId) => {
    if (!userId) return null;
    const user = users.find((u) => u.id === userId);
    return user ? user.name || user.email : "Unknown User";
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
              <ClientAvatar
                client={selectedClient}
                size="large"
                className="client-avatar-large"
              />
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
              className={`tab-btn ${
                activeTab === "onboarding" ? "active" : ""
              }`}
              onClick={() => setActiveTab("onboarding")}
            >
              <OnboardingIcon />
              Onboarding
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
                  <PermissionGuard
                    permissions={["read_client"]}
                    fallback={
                      <div className="access-denied-message">
                        <p>You don't have permission to view client details.</p>
                      </div>
                    }
                  >
                    <div className="overview-tab">
                      <div className="overview-cards">
                        <div className="overview-card">
                          <h3>Client Information</h3>
                          <div className="info-grid">
                            <div className="client-info-item">
                              <PersonIcon className="info-icon" />
                              <div>
                                <label>Name</label>
                                <span>
                                  {selectedClient.name || "Not provided"}
                                </span>
                              </div>
                            </div>

                            <div className="client-info-item">
                              <WebsiteIcon className="info-icon" />
                              <div>
                                <label>Website</label>
                                <span>
                                  {selectedClient.website ? (
                                    <a
                                      href={selectedClient.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="website-link"
                                    >
                                      {selectedClient.website}
                                    </a>
                                  ) : (
                                    "Not provided"
                                  )}
                                </span>
                              </div>
                            </div>

                            <div className="client-info-item">
                              <AccountManagerIcon className="info-icon" />
                              <div>
                                <label>Account Manager</label>
                                <span>
                                  {getUserName(
                                    selectedClient.account_manager
                                  ) || "Not assigned"}
                                </span>
                              </div>
                            </div>

                            <div className="client-info-item">
                              <AdoptionSpecialistIcon className="info-icon" />
                              <div>
                                <label>Adoption Specialist</label>
                                <span>
                                  {getUserName(
                                    selectedClient.adoption_specialist
                                  ) || "Not assigned"}
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
                                          {meeting.meeting_name ||
                                            meeting.title ||
                                            `Meeting #${
                                              meeting.id?.slice(-8) || "Unknown"
                                            }`}
                                        </h5>
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
                        </div>
                      </div>
                    </div>
                  </PermissionGuard>
                )}

                {activeTab === "meetings" && (
                  <PermissionGuard
                    permissions={["read_meeting"]}
                    fallback={
                      <div className="access-denied-message">
                        <p>You don't have permission to view meetings.</p>
                      </div>
                    }
                  >
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
                  </PermissionGuard>
                )}

                {activeTab === "onboarding" && (
                  <div className="onboarding-tab">
                    <OnboardingInfo
                      clientId={selectedClient.id}
                      existingOnboardingInfo={selectedClient.onboarding_info}
                    />
                  </div>
                )}

                {activeTab === "workflows" && (
                  <div className="workflows-tab">
                    <WorkflowManager
                      clientId={selectedClient.id}
                      clientName={selectedClient.name}
                    />
                  </div>
                )}

                {activeTab === "secrets" && (
                  <div className="secrets-tab">
                    <SecretsManager
                      clientId={selectedClient.id}
                      clientName={selectedClient.name}
                    />
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
          <PermissionGuard permissions={["create_client"]}>
            <button className="btn btn-primary" onClick={handleAddClient}>
              <AddIcon />
              Add New Client
            </button>
          </PermissionGuard>
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
                    <option value="pre-boarding">Pre-boarding</option>
                    <option value="onboarding">Onboarding</option>
                    <option value="assessment">Assessment</option>
                    <option value="active">Active</option>
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
                    <ClientAvatar client={client} size="medium" />
                    <div className="client-info">
                      <h3 className="client-name">
                        {client.name || "Unnamed Client"}
                      </h3>
                      {client.company && (
                        <p className="client-company">
                          <BusinessIcon className="company-icon" />
                          {client.company}
                        </p>
                      )}
                      <div className="client-meta">
                        <span className={`client-status ${clientStatus}`}>
                          {getStatusLabel(clientStatus)}
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
                      <PermissionGuard permissions={["update_client"]}>
                        <button
                          className="client-action-btn edit"
                          title="Edit Client"
                          onClick={() => handleEditClient(client)}
                        >
                          <EditIcon />
                        </button>
                      </PermissionGuard>
                      <PermissionGuard permissions={["read_client"]}>
                        <button
                          className="client-action-btn view"
                          title="View Details"
                          onClick={() => handleClientSelect(client)}
                        >
                          <VisibilityIcon />
                        </button>
                      </PermissionGuard>
                      <PermissionGuard permissions={["delete_client"]}>
                        <button
                          className="client-action-btn delete"
                          title="Delete Client"
                          onClick={() => handleDeleteClient(client)}
                        >
                          <DeleteIcon />
                        </button>
                      </PermissionGuard>
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
                  <PermissionGuard permissions={["create_client"]}>
                    <button
                      className="btn btn-primary"
                      onClick={handleAddClient}
                    >
                      <AddIcon />
                      Add Your First Client
                    </button>
                  </PermissionGuard>
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

        {/* Client Form Modal - Available in both views */}
        <ClientForm
          client={editingClient}
          isOpen={showClientForm}
          onSave={handleClientFormSave}
          onCancel={handleClientFormCancel}
        />
      </div>
    </DashboardLayout>
  );
};

export default ClientsPage;
