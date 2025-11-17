import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/Layout/DashboardLayout/DashboardLayout";
import { useNotificationContext } from "../../contexts/NotificationContext";
import { PermissionGuard } from "../../components/PermissionGuard";
import { PERMISSIONS } from "../../constants/permissions";
import {
  useClients,
  useMeetingSummary,
  // useWorkflows,
  useSecrets,
  useMeeting,
  useActionItemsByClient,
  useUsers,
} from "../../hooks/useQueries";
import {
  useDeleteClient,
  useDeleteMeeting,
} from "../../hooks/useMutations";
import { useQueryClient } from "@tanstack/react-query";
import LoadingSpinner from "../../components/UI/LoadingSpinner/LoadingSpinner";
import Pagination from "../../components/UI/Pagination/Pagination";
import {
  MeetingsList,
  MeetingDetails,
  MeetingForm,
} from "../../components/Meetings";
import { ActionItemsList } from "../../components/ActionItems";
import OnboardingInfo from "../../components/Clients/OnboardingInfo";
import SecretsManager from "../../components/Clients/SecretsManager";
// import WorkflowManager from "../../components/Clients/WorkflowManager/WorkflowManager";
import ClientForm from "../../components/Clients/ClientForm";
import ClientNotes from "../../components/Clients/ClientNotes/ClientNotes";
import ClientAvatar from "../../components/UI/ClientAvatar";
import {
  People as PeopleIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  AccountCircle as AccountManagerIcon,
  Support as AdoptionSpecialistIcon,
  Language as WebsiteIcon,
  VideoCall as VideoCallIcon,
  Security as SecurityIcon,
  ArrowBack as ArrowBackIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  Info as OnboardingIcon,
  Notes as NotesIcon,
  Assignment as PlanIcon,
  Chat as CommunicationIcon,
  SmartToy as AIExecutorIcon,
  School as InternIcon,
  DateRange as DateIcon,
  Link as LinkIcon,
  Assessment as AuditIcon,
  Assignment as ActionItemsIcon,
  ViewModule as GridViewIcon,
  TableChart as TableViewIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import "./ClientsPage.css";

const ClientsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showError } = useNotificationContext();
  const queryClient = useQueryClient();

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [accountManagerFilter, setAccountManagerFilter] = useState("");
  const [adoptionSpecialistFilter, setAdoptionSpecialistFilter] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'table'

  // Meeting-related state
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [meetingsView, setMeetingsView] = useState("list"); // 'list' or 'details'

  // Client form state
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  // Status group collapse state - inactive is collapsed by default
  const [collapsedStatusGroups, setCollapsedStatusGroups] = useState(new Set(["inactive"]));

  // Pagination state for client action items
  const [clientActionItemsPage, setClientActionItemsPage] = useState(1);
  const [clientActionItemsPageSize, setClientActionItemsPageSize] = useState(20);

  // Use cached queries
  const {
    data: clientsData,
    isLoading: loadingClients,
    error: clientsError,
  } = useClients();

  // Fetch users to map IDs to names
  const {
    data: usersData,
    isLoading: loadingUsers,
  } = useUsers();

  // Load client details when selected
  const {
    data: meetingsSummary,
    isLoading: loadingMeetings,
  } = useMeetingSummary(selectedClient?.id, { enabled: !!selectedClient });

  // const {
  //   data: workflowsData,
  //   isLoading: loadingWorkflows,
  // } = useWorkflows(selectedClient?.id, { enabled: !!selectedClient });

  const {
    data: secretsData,
    isLoading: loadingSecrets,
  } = useSecrets(selectedClient?.id, { enabled: !!selectedClient });

  // Fetch action items for the client with backend pagination
  const {
    data: actionItemsData,
    isLoading: loadingActionItems,
  } = useActionItemsByClient(
    selectedClient?.id,
    {
      page: clientActionItemsPage,
      page_size: clientActionItemsPageSize
    },
    { enabled: !!selectedClient }
  );

  // Load full meeting details when selected
  const {
    data: fullMeetingDetails,
    isLoading: loadingMeetingDetails,
  } = useMeeting(selectedMeeting?.id, { enabled: !!selectedMeeting?.id });

  // Mutations
  const deleteClientMutation = useDeleteClient();
  const deleteMeetingMutation = useDeleteMeeting();

  // Handle URL parameters on mount and location change
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const statusParam = searchParams.get('status');
    const clientIdParam = searchParams.get('clientId');

    // Apply status filter from URL
    if (statusParam) {
      setStatusFilter(statusParam);
    }

    // Auto-select client from URL
    if (clientIdParam && clientsData) {
      const client = clientsData.find(c => c.id === clientIdParam);
      if (client) {
        setSelectedClient(client);
        setActiveTab('overview');
      }
    }
  }, [location.search, clientsData]);

  // Combine client data with related data
  const clientDetails = useMemo(() => {
    if (!selectedClient) return null;
    const client = (clientsData || []).find((c) => c.id === selectedClient.id);
    if (!client) return null;

    return {
      ...client,
      meetings: meetingsSummary || [],
      // workflows: workflowsData || [],
      secrets: secretsData || [],
      actionItems: actionItemsData?.items || actionItemsData || [], // Handle both paginated and non-paginated responses
    };
  }, [selectedClient, clientsData, meetingsSummary, /* workflowsData, */ secretsData, actionItemsData]);

  const loadingState = loadingClients || loadingUsers;
  const detailsLoadingState = loadingMeetings || /* loadingWorkflows || */ loadingSecrets || loadingMeetingDetails || loadingActionItems;

  // Create user ID to name mapping
  const userMap = useMemo(() => {
    if (!usersData || !Array.isArray(usersData)) return {};
    const map = {};
    usersData.forEach(user => {
      map[user.id] = user.full_name || user.name || user.email;
    });
    return map;
  }, [usersData]);

  // Extract unique users from clients data for filters
  const usersFromClients = useMemo(() => {
    if (!clientsData || !Array.isArray(clientsData)) return { accountManagers: [], adoptionSpecialists: [] };
    
    const accountManagerIds = new Set();
    const adoptionSpecialistIds = new Set();
    
    clientsData.forEach((client) => {
      if (client.account_manager) {
        accountManagerIds.add(client.account_manager);
      }
      if (client.adoption_specialist) {
        adoptionSpecialistIds.add(client.adoption_specialist);
      }
    });
    
    return {
      accountManagers: Array.from(accountManagerIds).map(id => ({ 
        id,
        name: userMap[id] || `User ${id.slice(0, 8)}...`
      })),
      adoptionSpecialists: Array.from(adoptionSpecialistIds).map(id => ({ 
        id,
        name: userMap[id] || `User ${id.slice(0, 8)}...`
      })),
    };
  }, [clientsData, userMap]);

  // Handle errors
  React.useEffect(() => {
    if (clientsError) {
      showError("Failed to load clients");
    }
  }, [clientsError, showError]);

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    // Reset pagination when selecting a new client
    setClientActionItemsPage(1);
    // Update URL with client ID
    navigate(`/clients?clientId=${client.id}`);
  };

  const handleBackToList = () => {
    setSelectedClient(null);
    setActiveTab("overview");
    setSelectedMeeting(null);
    setShowMeetingForm(false);
    setEditingMeeting(null);
    setMeetingsView("list");
    // Reset pagination
    setClientActionItemsPage(1);
    setClientActionItemsPageSize(20);
    // Clear URL parameters
    navigate('/clients');
  };

  // Pagination handlers for client action items
  const handleClientActionItemsPageChange = (newPage) => {
    setClientActionItemsPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClientActionItemsPageSizeChange = (newPageSize) => {
    setClientActionItemsPageSize(newPageSize);
    setClientActionItemsPage(1); // Reset to first page
  };

  // Meeting handlers
  const handleMeetingSelect = async (meeting) => {
    setSelectedMeeting(meeting);
    setMeetingsView("details");
    // Meeting details will be loaded via useMeeting hook
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

    deleteMeetingMutation.mutate(meeting.id, {
      onSuccess: () => {
        // Invalidate client details to refresh meetings list
        queryClient.invalidateQueries({ queryKey: ['clients', 'meetings', selectedClient?.id] });
        queryClient.invalidateQueries({ queryKey: ['meetings'] });
      },
    });
  };

  const handleMeetingFormSave = () => {
    setShowMeetingForm(false);
    setEditingMeeting(null);
    // Cache will be invalidated by mutation hooks
    queryClient.invalidateQueries({ queryKey: ['clients', 'meetings', selectedClient?.id] });
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
    // Cache will be invalidated by mutation hooks
  };

  const handleClientFormCancel = () => {
    setShowClientForm(false);
    setEditingClient(null);
  };

  const handleDeleteClient = async (client) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${client.name}"? This will permanently delete the client and all associated data including meetings, and secrets.`
      )
    ) {
      return;
    }

    deleteClientMutation.mutate(client.id, {
      onSuccess: () => {
        // If the deleted client was currently selected, go back to list
        if (selectedClient && selectedClient.id === client.id) {
          handleBackToList();
        }
      },
    });
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
        return "Execution";
      case "inactive":
        return "Inactive";
      default:
        return "Pre-boarding";
    }
  };

  const getUserName = (userId, userNameField) => {
    // If user name is provided directly from backend, use it
    if (userNameField) return userNameField;
    // Look up user name from userMap
    if (userId && userMap[userId]) return userMap[userId];
    // Fallback: return formatted ID if name not available
    if (!userId) return null;
    return `User ${userId.slice(0, 8)}...`;
  };

  // Count active filters
  const activeFilterCount = [
    statusFilter,
    accountManagerFilter,
    adoptionSpecialistFilter
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    setStatusFilter("");
    setAccountManagerFilter("");
    setAdoptionSpecialistFilter("");
  };

  const filteredAndSortedClients = (clientsData || [])
    .filter((client) => {
      // Search filter
      const matchesSearch =
        client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.company?.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus =
        !statusFilter || getClientStatus(client) === statusFilter;

      // Account Manager filter
      const matchesAccountManager =
        !accountManagerFilter || client.account_manager === accountManagerFilter;

      // Adoption Specialist filter
      const matchesAdoptionSpecialist =
        !adoptionSpecialistFilter || client.adoption_specialist === adoptionSpecialistFilter;

      return matchesSearch && matchesStatus && matchesAccountManager && matchesAdoptionSpecialist;
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

  // Group clients by status
  const clientsByStatus = useMemo(() => {
    const grouped = {};
    filteredAndSortedClients.forEach((client) => {
      const status = getClientStatus(client);
      if (!grouped[status]) {
        grouped[status] = [];
      }
      grouped[status].push(client);
    });
    return grouped;
  }, [filteredAndSortedClients]);

  // Order status groups: pre-boarding, onboarding, assessment, execution (active), inactive last
  const statusOrder = ["pre-boarding", "onboarding", "assessment", "active", "inactive"];
  const orderedStatusGroups = useMemo(() => {
    const ordered = [];
    const statusSet = new Set(Object.keys(clientsByStatus));
    
    // Add statuses in order (if they exist)
    statusOrder.forEach((status) => {
      if (statusSet.has(status)) {
        ordered.push(status);
        statusSet.delete(status);
      }
    });
    
    // Add any remaining statuses
    statusSet.forEach((status) => {
      ordered.push(status);
    });
    
    return ordered;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientsByStatus]);

  const toggleStatusGroup = (status) => {
    setCollapsedStatusGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(status)) {
        newSet.delete(status);
      } else {
        newSet.add(status);
      }
      return newSet;
    });
  };

  if (loadingState) {
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
              Dashboard
            </button>
            <button
              className={`tab-btn ${activeTab === "meetings" ? "active" : ""}`}
              onClick={() => setActiveTab("meetings")}
            >
              <VideoCallIcon />
              Meetings ({clientDetails?.meetings?.length || 0})
            </button>
            <button
              className={`tab-btn ${activeTab === "action-items" ? "active" : ""}`}
              onClick={() => setActiveTab("action-items")}
            >
              <ActionItemsIcon />
              Action Items ({actionItemsData?.total || 0})
            </button>
            <button
              className={`tab-btn ${
                activeTab === "onboarding" ? "active" : ""
              }`}
              onClick={() => setActiveTab("onboarding")}
            >
              <OnboardingIcon />
              Company Information
            </button>
            {/* <button
              className={`tab-btn ${activeTab === "workflows" ? "active" : ""}`}
              onClick={() => setActiveTab("workflows")}
            >
              <WorkflowIcon />
              Workflows
            </button> */}
            {/* Temporarily hidden - Secrets tab */}
            {/* <button
              className={`tab-btn ${activeTab === "secrets" ? "active" : ""}`}
              onClick={() => setActiveTab("secrets")}
            >
              <SecurityIcon />
              Secrets ({clientDetails?.secrets?.length || 0})
            </button> */}
            <button
              className={`tab-btn ${activeTab === "notes" ? "active" : ""}`}
              onClick={() => setActiveTab("notes")}
            >
              <NotesIcon />
              Notes
            </button>
          </div>

          <div className="client-details-content">
            {detailsLoadingState ? (
              <div className="details-loading">
                <LoadingSpinner message="Loading client details and meetings... This may take up to 2 minutes." />
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
                      {/* Main Content Grid */}
                      <div className="overview-cards">
                        <div className="overview-card info-card">
                          <div className="card-header">
                            <PersonIcon className="card-header-icon" />
                            <h3>Client Information</h3>
                          </div>
                          <div className="info-grid">
                            <div className="client-info-item">
                              <div className="info-item-icon-wrapper">
                                <PersonIcon className="info-icon" />
                              </div>
                              <div className="info-item-content">
                                <label>Name</label>
                                <span>
                                  {selectedClient.name || "Not provided"}
                                </span>
                              </div>
                            </div>

                            {selectedClient.website && (
                              <div className="client-info-item">
                                <div className="info-item-icon-wrapper">
                                  <WebsiteIcon className="info-icon" />
                                </div>
                                <div className="info-item-content">
                                  <label>Website</label>
                                  <span>
                                    <a
                                      href={selectedClient.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="website-link"
                                    >
                                      {selectedClient.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                    </a>
                                  </span>
                                </div>
                              </div>
                            )}

                            <div className="client-info-item">
                              <div className="info-item-icon-wrapper">
                                <AccountManagerIcon className="info-icon" />
                              </div>
                              <div className="info-item-content">
                                <label>Account Manager</label>
                                <span>
                                  {getUserName(
                                    selectedClient.account_manager
                                  ) || "Not assigned"}
                                </span>
                              </div>
                            </div>

                            <div className="client-info-item">
                              <div className="info-item-icon-wrapper">
                                <AdoptionSpecialistIcon className="info-icon" />
                              </div>
                              <div className="info-item-content">
                                <label>Adoption Specialist</label>
                                <span>
                                  {getUserName(
                                    selectedClient.adoption_specialist
                                  ) || "Not assigned"}
                                </span>
                              </div>
                            </div>

                            {selectedClient.plan_details && (
                              <div className="client-info-item">
                                <div className="info-item-icon-wrapper">
                                  <PlanIcon className="info-icon" />
                                </div>
                                <div className="info-item-content">
                                  <label>Plan Details</label>
                                  <span>
                                    {selectedClient.plan_details.replace(/_/g, ' ').replace(/AI /g, 'AI ')}
                                  </span>
                                </div>
                              </div>
                            )}

                            {selectedClient.communication_tool && (
                              <div className="client-info-item">
                                <div className="info-item-icon-wrapper">
                                  <CommunicationIcon className="info-icon" />
                                </div>
                                <div className="info-item-content">
                                  <label>Communication Tool</label>
                                  <span>{selectedClient.communication_tool}</span>
                                </div>
                              </div>
                            )}

                            {selectedClient.ai_executor && (
                              <div className="client-info-item">
                                <div className="info-item-icon-wrapper">
                                  <AIExecutorIcon className="info-icon" />
                                </div>
                                <div className="info-item-content">
                                  <label>AI Executor</label>
                                  <span>
                                    {getUserName(selectedClient.ai_executor) || "Not assigned"}
                                  </span>
                                </div>
                              </div>
                            )}

                            {Array.isArray(selectedClient.interns) && selectedClient.interns.length > 0 && (
                              <div className="client-info-item">
                                <div className="info-item-icon-wrapper">
                                  <InternIcon className="info-icon" />
                                </div>
                                <div className="info-item-content">
                                  <label>Interns</label>
                                  <div className="assignment-chip-list">
                                    {selectedClient.interns.map((internId) => (
                                      <span key={internId} className="assignment-chip">
                                        {getUserName(internId) || `User ${internId.slice(0, 8)}...`}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {(selectedClient.assessment_start_date || selectedClient.assessment_end_date) && (
                              <div className="client-info-item">
                                <div className="info-item-icon-wrapper">
                                  <DateIcon className="info-icon" />
                                </div>
                                <div className="info-item-content">
                                  <label>Assessment Period</label>
                                  <span>
                                    {selectedClient.assessment_start_date && selectedClient.assessment_end_date
                                      ? `${new Date(selectedClient.assessment_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${new Date(selectedClient.assessment_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                                      : selectedClient.assessment_start_date
                                      ? `From ${new Date(selectedClient.assessment_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                                      : `Until ${new Date(selectedClient.assessment_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                                    }
                                  </span>
                                </div>
                              </div>
                            )}

                            {selectedClient.document_link && (
                              <div className="client-info-item">
                                <div className="info-item-icon-wrapper">
                                  <LinkIcon className="info-icon" />
                                </div>
                                <div className="info-item-content">
                                  <label>Drive Link</label>
                                  <span>
                                    <a
                                      href={selectedClient.document_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="website-link"
                                    >
                                      View Drive
                                    </a>
                                  </span>
                                </div>
                              </div>
                            )}

                            {selectedClient.task_audit_sheet_link && (
                              <div className="client-info-item">
                                <div className="info-item-icon-wrapper">
                                  <AuditIcon className="info-icon" />
                                </div>
                                <div className="info-item-content">
                                  <label>Task Audit Sheet</label>
                                  <span>
                                    <a
                                      href={selectedClient.task_audit_sheet_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="website-link"
                                    >
                                      View Audit Sheet
                                    </a>
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Recent Activity Section */}
                        <div className="overview-card activity-card-main">
                          <div className="card-header">
                            <VideoCallIcon className="card-header-icon" />
                            <h3>Recent Activity</h3>
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
                                .map((meeting, index) => (
                                  <div
                                    key={meeting.id}
                                    className="activity-item"
                                    onClick={() => handleMeetingSelect(meeting)}
                                  >
                                    <div className="activity-item-bullet"></div>
                                    <div className="activity-item-content">
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
                                        ).toLocaleDateString('en-US', { 
                                          month: 'short', 
                                          day: 'numeric'
                                        })}
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

                        {/* Recent Action Items Section */}
                        <div className="overview-card action-items-card-main">
                          <div className="card-header">
                            <ActionItemsIcon className="card-header-icon" />
                            <h3>Recent Action Items</h3>
                            <button
                              className="view-all-btn"
                              onClick={() => setActiveTab("action-items")}
                            >
                              View All
                            </button>
                          </div>
                          <div className="activity-content">
                            {clientDetails?.actionItems?.length > 0 ? (
                              clientDetails.actionItems
                                .slice(0, 3)
                                .map((item, index) => (
                                  <div
                                    key={item.id}
                                    className="activity-item"
                                    onClick={() => setActiveTab("action-items")}
                                  >
                                    <div className="activity-item-bullet"></div>
                                    <div className="activity-item-content">
                                      <h5>
                                        {item.message || item.task || `Action Item #${item.id?.slice(-8) || "Unknown"}`}
                                      </h5>
                                      <div className="task-meta">
                                        <span className={`status-badge status-${item.status || "open"}`}>
                                          {item.status === "completed" ? "Done" : 
                                           item.status === "in_progress" ? "In Progress" : "Open"}
                                        </span>
                                        {item.due_date && (
                                          <span className="activity-date">
                                            Due {new Date(item.due_date).toLocaleDateString('en-US', { 
                                              month: 'short', 
                                              day: 'numeric'
                                            })}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))
                            ) : (
                              <div className="activity-empty">
                                <ActionItemsIcon className="empty-icon" />
                                <p>No action items yet</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </PermissionGuard>
                )}

                {activeTab === "meetings" && (
                  <PermissionGuard
                    permissions={[PERMISSIONS.READ_MEETING]}
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
                          loading={detailsLoadingState}
                        />
                      ) : (
                        <MeetingDetails
                          meetingId={selectedMeeting?.id}
                          meeting={fullMeetingDetails || selectedMeeting}
                          onBack={handleBackToMeetings}
                          onEdit={handleEditMeeting}
                          onDelete={handleDeleteMeeting}
                          clientName={selectedClient?.name}
                        />
                      )}
                    </div>
                  </PermissionGuard>
                )}

                {activeTab === "action-items" && (
                  <PermissionGuard
                    permissions={[PERMISSIONS.READ_TASK]}
                    fallback={
                      <div className="access-denied-message">
                        <p>You don't have permission to view action items.</p>
                      </div>
                    }
                  >
                    <div className="action-items-tab">
                      <ActionItemsList
                        actionItems={clientDetails?.actionItems || []}
                        onRefresh={() => {
                          queryClient.invalidateQueries({ queryKey: ['action-items'] });
                        }}
                        meetings={clientDetails?.meetings || []}
                        clients={clientsData || []}
                        users={usersData || []}
                        hideClientColumn={true}
                      />
                      <Pagination
                        currentPage={actionItemsData?.page || 1}
                        totalPages={actionItemsData?.total_pages || 1}
                        totalItems={actionItemsData?.total || 0}
                        pageSize={actionItemsData?.page_size || clientActionItemsPageSize}
                        onPageChange={handleClientActionItemsPageChange}
                        onPageSizeChange={handleClientActionItemsPageSizeChange}
                        pageSizeOptions={[10, 20, 50, 100]}
                      />
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

                {/* {activeTab === "workflows" && (
                  <div className="workflows-tab">
                    <WorkflowManager
                      clientId={selectedClient.id}
                      clientName={selectedClient.name}
                    />
                  </div>
                )} */}

                {activeTab === "secrets" && (
                  <div className="secrets-tab">
                    <SecretsManager
                      clientId={selectedClient.id}
                      clientName={selectedClient.name}
                    />
                  </div>
                )}

                {activeTab === "notes" && (
                  <div className="notes-tab">
                    <ClientNotes
                      clientId={selectedClient.id}
                      onNotesUpdate={() => {
                        queryClient.invalidateQueries({ queryKey: ['clients', 'notes', selectedClient.id] });
                      }}
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
        {/* Compact Controls Bar */}
        <div className="compact-controls-bar">
          <div className="controls-left">
            <div className="search-input-wrapper">
              <SearchIcon className="search-icon" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <button
              className={`filter-btn ${activeFilterCount > 0 ? "active" : ""}`}
              onClick={() => setShowFilterPopup(!showFilterPopup)}
            >
              <FilterIcon />
              Filters
              {activeFilterCount > 0 && (
                <span className="filter-badge">{activeFilterCount}</span>
              )}
            </button>
            <div className="sort-group">
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
          <div className="controls-right">
            <div className="results-info">
              <span className="results-count">
                {filteredAndSortedClients.length} of {clientsData?.length || 0} clients
              </span>
            </div>
            <div className="view-toggle">
              <button
                className={`view-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => setViewMode("grid")}
                title="Grid View"
              >
                <GridViewIcon />
              </button>
              <button
                className={`view-toggle-btn ${viewMode === "table" ? "active" : ""}`}
                onClick={() => setViewMode("table")}
                title="Table View"
              >
                <TableViewIcon />
              </button>
            </div>
            <PermissionGuard permissions={["create_client"]}>
              <button className="btn btn-primary" onClick={handleAddClient}>
                <AddIcon />
                Add
              </button>
            </PermissionGuard>
          </div>
        </div>

        {/* Filter Popup */}
        {showFilterPopup && (
          <>
            <div
              className="filter-popup-overlay"
              onClick={() => setShowFilterPopup(false)}
            />
            <div className="filter-popup">
              <div className="filter-popup-header">
                <h3>Filter Clients</h3>
                <button
                  className="close-btn"
                  onClick={() => setShowFilterPopup(false)}
                >
                  <CloseIcon />
                </button>
              </div>
              <div className="filter-popup-content">
                <div className="filter-field">
                  <label>Status</label>
                  <select
                    className="filter-popup-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="pre-boarding">Pre-boarding</option>
                    <option value="onboarding">Onboarding</option>
                    <option value="assessment">Assessment</option>
                    <option value="active">Execution</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="filter-field">
                  <label>Account Manager</label>
                  <select
                    className="filter-popup-select"
                    value={accountManagerFilter}
                    onChange={(e) => setAccountManagerFilter(e.target.value)}
                  >
                    <option value="">All Account Managers</option>
                    {usersFromClients.accountManagers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {getUserName(user.id) || `User ${user.id.slice(0, 8)}...`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="filter-field">
                  <label>Adoption Specialist</label>
                  <select
                    className="filter-popup-select"
                    value={adoptionSpecialistFilter}
                    onChange={(e) => setAdoptionSpecialistFilter(e.target.value)}
                  >
                    <option value="">All Adoption Specialists</option>
                    {usersFromClients.adoptionSpecialists.map((user) => (
                      <option key={user.id} value={user.id}>
                        {getUserName(user.id) || `User ${user.id.slice(0, 8)}...`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="filter-popup-footer">
                <button
                  className="btn btn-secondary"
                  onClick={handleClearFilters}
                  disabled={activeFilterCount === 0}
                >
                  Clear Filters
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowFilterPopup(false)}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </>
        )}

        <div className="page-content">

          {viewMode === "grid" ? (
            <div className="clients-grouped-container">
              {orderedStatusGroups.length > 0 ? (
                orderedStatusGroups
                  .filter((status) => {
                    const clients = clientsByStatus[status] || [];
                    return clients.length > 0;
                  })
                  .map((status) => {
                    const clients = clientsByStatus[status] || [];
                    const isCollapsed = collapsedStatusGroups.has(status);
                    const isInactive = status === "inactive";

                  return (
                    <div key={status} className="status-group">
                      <div 
                        className={`status-group-header ${isInactive ? 'inactive-group' : ''}`}
                        onClick={isInactive ? () => toggleStatusGroup(status) : undefined}
                        style={isInactive ? { cursor: 'pointer' } : {}}
                      >
                        <div className="status-group-title">
                          <h3 className="status-group-name">
                            {getStatusLabel(status)}
                          </h3>
                          <span className="status-group-count">
                            ({clients.length})
                          </span>
                        </div>
                        {isInactive && (
                          <button 
                            className="status-group-toggle"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStatusGroup(status);
                            }}
                          >
                            {isCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                          </button>
                        )}
                      </div>
                      {(!isInactive || !isCollapsed) && (
                        <div className="clients-grid">
                          {clients.map((client) => {
                            const clientStatus = getClientStatus(client);

                            return (
                              <div
                                key={client.id}
                                className="client-card-modern"
                                onClick={() => handleClientSelect(client)}
                              >
                                <div className="client-card-header">
                                  <div className="client-card-header-left">
                                    <ClientAvatar client={client} size="medium" />
                                    <div className="client-card-title-section">
                                      <h3 className="client-name-modern">
                                        {client.name || "Unnamed Client"}
                                      </h3>
                                      {client.company && (
                                        <p className="client-company-modern">
                                          {client.company}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="client-card-status-badge">
                                    <span className={`client-status-modern ${clientStatus}`}>
                                      {getStatusLabel(clientStatus)}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="client-card-body">
                                  <div className="client-card-assignments">
                                    <div className="assignment-item-modern">
                                      <AccountManagerIcon className="assignment-icon-modern" />
                                      <span className={`assignment-text ${!getUserName(client.account_manager) ? 'unassigned' : ''}`}>
                                        {getUserName(client.account_manager) || "Unassigned"}
                                      </span>
                                    </div>
                                    <div className="assignment-item-modern">
                                      <AdoptionSpecialistIcon className="assignment-icon-modern" />
                                      <span className={`assignment-text ${!getUserName(client.adoption_specialist) ? 'unassigned' : ''}`}>
                                        {getUserName(client.adoption_specialist) || "Unassigned"}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="client-card-footer">
                                  <div className="client-card-date">
                                    <DateIcon className="date-icon-modern" />
                                    <span>
                                      {new Date(client.created_at || Date.now()).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                  <div
                                    className="client-card-actions"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <PermissionGuard permissions={["read_client"]}>
                                      <button
                                        className="card-action-btn"
                                        title="View Details"
                                        onClick={() => handleClientSelect(client)}
                                      >
                                        <VisibilityIcon />
                                      </button>
                                    </PermissionGuard>
                                    <PermissionGuard permissions={["update_client"]}>
                                      <button
                                        className="card-action-btn"
                                        title="Edit Client"
                                        onClick={() => handleEditClient(client)}
                                      >
                                        <EditIcon />
                                      </button>
                                    </PermissionGuard>
                                    <PermissionGuard permissions={["delete_client"]}>
                                      <button
                                        className="card-action-btn delete"
                                        title="Delete Client"
                                        onClick={() => handleDeleteClient(client)}
                                      >
                                        <DeleteIcon />
                                      </button>
                                    </PermissionGuard>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
              <div className="empty-state">
                <PeopleIcon className="empty-icon" />
                <h3>No Clients Found</h3>
                <p>
                  {searchTerm || statusFilter || accountManagerFilter || adoptionSpecialistFilter
                    ? `No clients match your current filters. Try adjusting your search criteria.`
                    : "Start by adding your first client to get started with the CMS."}
                </p>
                {!searchTerm && !statusFilter && !accountManagerFilter && !adoptionSpecialistFilter && (
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
                {(searchTerm || statusFilter || accountManagerFilter || adoptionSpecialistFilter) && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("");
                      setAccountManagerFilter("");
                      setAdoptionSpecialistFilter("");
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
          ) : (
            <div className="clients-table-wrapper">
              <table className="clients-table">
                <thead>
                  <tr>
                    <th className="table-header-client">Client</th>
                    <th className="table-header-assignments">Account Manager</th>
                    <th className="table-header-assignments">Adoption Specialist</th>
                    <th className="table-header-status">Status</th>
                    <th className="table-header-date">Added Date</th>
                    <th className="table-header-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedClients.length > 0 ? (
                    filteredAndSortedClients.map((client) => {
                      const clientStatus = getClientStatus(client);
                      return (
                        <tr
                          key={client.id}
                          className="client-table-row"
                          onClick={() => handleClientSelect(client)}
                        >
                          <td className="client-name-cell">
                            <div className="client-name-content">
                              <ClientAvatar client={client} size="small" />
                              <div className="client-name-info">
                                <span className="client-name-text">
                                  {client.name || "Unnamed Client"}
                                </span>
                                {client.company && (
                                  <span className="client-company-text">
                                    {client.company}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="client-assignment-cell">
                            <div className="client-assignment-content">
                              <AccountManagerIcon className="assignment-icon-small" />
                              <span>
                                {getUserName(client.account_manager) || "Unassigned"}
                              </span>
                            </div>
                          </td>
                          <td className="client-assignment-cell">
                            <div className="client-assignment-content">
                              <AdoptionSpecialistIcon className="assignment-icon-small" />
                              <span>
                                {getUserName(client.adoption_specialist) || "Unassigned"}
                              </span>
                            </div>
                          </td>
                          <td className="client-status-cell">
                            <span className={`client-status ${clientStatus}`}>
                              {getStatusLabel(clientStatus)}
                            </span>
                          </td>
                          <td className="client-date-cell">
                            <div className="client-date-content">
                              <DateIcon className="client-date-icon" />
                              <span>
                                {new Date(client.created_at || Date.now()).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          </td>
                          <td className="client-actions-cell">
                            <div className="client-table-actions" onClick={(e) => e.stopPropagation()}>
                              <PermissionGuard permissions={["update_client"]}>
                                <button
                                  className="action-btn edit"
                          title="Edit Client"
                          onClick={() => handleEditClient(client)}
                        >
                          <EditIcon />
                        </button>
                      </PermissionGuard>
                      <PermissionGuard permissions={["read_client"]}>
                        <button
                                  className="action-btn view"
                          title="View Details"
                          onClick={() => handleClientSelect(client)}
                        >
                          <VisibilityIcon />
                        </button>
                      </PermissionGuard>
                      <PermissionGuard permissions={["delete_client"]}>
                        <button
                                  className="action-btn delete"
                          title="Delete Client"
                          onClick={() => handleDeleteClient(client)}
                        >
                          <DeleteIcon />
                        </button>
                      </PermissionGuard>
                    </div>
                          </td>
                        </tr>
                );
              })
            ) : (
                    <tr>
                      <td colSpan={6} className="empty-table-cell">
              <div className="empty-state">
                <PeopleIcon className="empty-icon" />
                <h3>No Clients Found</h3>
                <p>
                  {searchTerm || statusFilter || accountManagerFilter || adoptionSpecialistFilter
                    ? `No clients match your current filters. Try adjusting your search criteria.`
                    : "Start by adding your first client to get started with the CMS."}
                </p>
                {!searchTerm && !statusFilter && !accountManagerFilter && !adoptionSpecialistFilter && (
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
                {(searchTerm || statusFilter || accountManagerFilter || adoptionSpecialistFilter) && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("");
                      setAccountManagerFilter("");
                      setAdoptionSpecialistFilter("");
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
                      </td>
                    </tr>
            )}
                </tbody>
              </table>
          </div>
          )}
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
