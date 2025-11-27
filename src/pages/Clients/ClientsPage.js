import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/Layout/DashboardLayout/DashboardLayout";
import { useNotificationContext } from "../../contexts/NotificationContext";
import { PermissionGuard } from "../../components/PermissionGuard";
import { PERMISSIONS } from "../../constants/permissions";
import {
  useClients,
  useClientOverview,
  // useWorkflows,
  // useSecrets, // Secrets tab is commented out
  useMeeting,
  useActionItemsByClient,
  useUsers,
} from "../../hooks/useQueries";
import {
  useDeleteClient,
  useDeleteMeeting,
} from "../../hooks/useMutations";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../utils/queryClient";
import { clientAPI } from "../../utils/apiServices";
import LoadingSpinner from "../../components/UI/LoadingSpinner/LoadingSpinner";
import Pagination from "../../components/UI/Pagination/Pagination";
import {
  MeetingsList,
  MeetingDetails,
  MeetingForm,
} from "../../components/Meetings";
import { ActionItemsList } from "../../components/ActionItems";
import OnboardingInfo from "../../components/Clients/OnboardingInfo";
// import SecretsManager from "../../components/Clients/SecretsManager"; // Secrets tab is commented out
// import WorkflowManager from "../../components/Clients/WorkflowManager/WorkflowManager";
import ClientForm from "../../components/Clients/ClientForm";
import ClientNotes from "../../components/Clients/ClientNotes/ClientNotes";
import ClientAvatar from "../../components/UI/ClientAvatar";
import MonthlySummaryCueCard from "../../components/Clients/MonthlySummaryCueCard/MonthlySummaryCueCard";
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
  const [clientFormMode, setClientFormMode] = useState("create");
  const [isLoadingClientForEdit, setIsLoadingClientForEdit] = useState(false);

  // Status group collapse state - inactive is collapsed by default
  const [collapsedStatusGroups, setCollapsedStatusGroups] = useState(new Set(["inactive", "paused"]));

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

  // Load consolidated client overview when selected
  const {
    data: clientOverview,
    isLoading: loadingClientOverview,
  } = useClientOverview(selectedClient?.id, { 
    enabled: !!selectedClient,
    actionItemsPageSize: clientActionItemsPageSize,
  });

  // const {
  //   data: workflowsData,
  //   isLoading: loadingWorkflows,
  // } = useWorkflows(selectedClient?.id, { enabled: !!selectedClient });

  // Secrets tab is commented out, so we don't fetch secrets data
  // const {
  //   data: secretsData,
  //   isLoading: loadingSecrets,
  // } = useSecrets(selectedClient?.id, { enabled: !!selectedClient });
  const secretsData = [];
  const loadingSecrets = false;

  // Fetch action items for the client with backend pagination
  const {
    data: paginatedActionItemsData,
    isLoading: loadingActionItems,
  } = useActionItemsByClient(
    selectedClient?.id,
    {
      page: clientActionItemsPage,
      page_size: clientActionItemsPageSize
    },
    { enabled: !!selectedClient && clientActionItemsPage > 1 }
  );

  // Load full meeting details when selected
  const {
    data: fullMeetingDetails,
    isLoading: loadingMeetingDetails,
  } = useMeeting(selectedMeeting?.id, { enabled: !!selectedMeeting?.id });

  // Mutations
  const deleteClientMutation = useDeleteClient();
  const deleteMeetingMutation = useDeleteMeeting();

  const getAccountManagerId = (client) =>
    client?.account_manager_id || client?.account_manager || "";

  const getAdoptionSpecialistId = (client) =>
    client?.adoption_specialist_id || client?.adoption_specialist || "";

  // Helper to get account manager name - handles both string names and IDs
  const getAccountManagerName = (client) => {
    // If account_manager is a string (name), use it directly
    if (client?.account_manager && typeof client.account_manager === 'string' && client.account_manager.trim()) {
      // Check if it's a UUID (ID) or a name
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(client.account_manager.trim())) {
        // It's a name, not an ID
        return client.account_manager.trim();
      }
    }
    // Otherwise, use the existing logic with account_manager_name or lookup by ID
    const userId = getAccountManagerId(client);
    return getUserName(userId, client?.account_manager_name);
  };

  // Helper to get adoption specialist name - handles both string names and IDs
  const getAdoptionSpecialistName = (client) => {
    // If adoption_specialist is a string (name), use it directly
    if (client?.adoption_specialist && typeof client.adoption_specialist === 'string' && client.adoption_specialist.trim()) {
      // Check if it's a UUID (ID) or a name
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(client.adoption_specialist.trim())) {
        // It's a name, not an ID
        return client.adoption_specialist.trim();
      }
    }
    // Otherwise, use the existing logic with adoption_specialist_name or lookup by ID
    const userId = getAdoptionSpecialistId(client);
    return getUserName(userId, client?.adoption_specialist_name);
  };

  const normalizeStatusValue = (value) => {
    if (!value || typeof value !== "string") return "";
    return value.trim().toLowerCase().replace(/_/g, "-");
  };

  // Handle URL parameters on mount and location change
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const statusParam = searchParams.get('status');
    const clientIdParam = searchParams.get('clientId');

    // Apply status filter from URL
    if (statusParam) {
      setStatusFilter(normalizeStatusValue(statusParam));
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

  const overviewMeetings = clientOverview?.meetings || [];
  const overviewActionItems = clientOverview?.action_items;
  const overviewActionItemsList = useMemo(() => {
    if (!overviewActionItems) return [];
    if (Array.isArray(overviewActionItems)) {
      return overviewActionItems;
    }
    if (Array.isArray(overviewActionItems.items)) {
      return overviewActionItems.items;
    }
    return [];
  }, [overviewActionItems]);

  const currentActionItemsData =
    clientActionItemsPage === 1
      ? overviewActionItems
      : paginatedActionItemsData;

  const currentActionItemsList =
    clientActionItemsPage === 1
      ? overviewActionItemsList
      : (paginatedActionItemsData?.items ??
        paginatedActionItemsData ??
        []);

  const actionItemsPageMeta = currentActionItemsData?.items
    ? {
        total: currentActionItemsData?.total ?? 0,
        page: currentActionItemsData?.page ?? clientActionItemsPage,
        page_size:
          currentActionItemsData?.page_size ?? clientActionItemsPageSize,
        total_pages: currentActionItemsData?.total_pages ?? 1,
      }
    : {
        total: currentActionItemsList.length,
        page: clientActionItemsPage,
        page_size: clientActionItemsPageSize,
        total_pages: 1,
      };

  const clientDetails = useMemo(() => {
    if (!selectedClient) return null;
    const listClient = (clientsData || []).find(
      (c) => c.id === selectedClient.id
    );
    if (!listClient && !clientOverview) return null;

    const mergedClient = clientOverview
      ? { ...listClient, ...clientOverview }
      : listClient;

    if (!mergedClient) return null;

    return {
      ...mergedClient,
      meetings: overviewMeetings,
      // workflows: workflowsData || [],
      secrets: secretsData || [],
      actionItems: currentActionItemsList,
    };
  }, [
    selectedClient,
    clientsData,
    clientOverview,
    overviewMeetings,
    /* workflowsData, */
    secretsData,
    currentActionItemsList,
  ]);

  const monthlySummary = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
      999
    );

    const parseDate = (value) => {
      if (!value) return null;
      if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value;
      }
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const meetings = Array.isArray(overviewMeetings) ? overviewMeetings : [];
    const meetingDates = meetings
      .map((meeting) =>
        parseDate(
          meeting.meeting_date ||
            meeting.meetingDate ||
            meeting.start_time ||
            meeting.startTime ||
            meeting.created_at ||
            meeting.createdAt ||
            meeting.date
        )
      )
      .filter(Boolean);

    const meetingsThisMonth = meetingDates.filter(
      (date) => date >= startOfMonth
    ).length;
    const meetingsLastMonth = meetingDates.filter(
      (date) => date >= startOfLastMonth && date <= endOfLastMonth
    ).length;
    const meetingTrend = meetingsThisMonth - meetingsLastMonth;

    const actionItemsSource = overviewActionItemsList || [];
    const monthlyActionItems = actionItemsSource.filter((item) => {
      const createdDate = parseDate(
        item.created_at ||
          item.createdAt ||
          item.created_on ||
          item.createdOn ||
          item.updated_at ||
          item.updatedAt ||
          item.due_date ||
          item.dueDate
      );
      return createdDate && createdDate >= startOfMonth;
    });

    const hasMonthlyData =
      monthlyActionItems.length > 0 || actionItemsSource.length === 0;
    const scopedItems = hasMonthlyData ? monthlyActionItems : actionItemsSource;

    const statusCounts = scopedItems.reduce(
      (acc, item) => {
        const status = (item.status || "open").toLowerCase();
        if (status === "completed") acc.completed += 1;
        else if (status === "in_progress") acc.inProgress += 1;
        else acc.open += 1;

        const dueDate = item.due_date || item.dueDate;
        if (dueDate && status !== "completed") {
          const parsedDue = parseDate(dueDate);
          if (parsedDue && parsedDue < now) {
            acc.overdue += 1;
          }
        }
        return acc;
      },
      { open: 0, inProgress: 0, completed: 0, overdue: 0 }
    );

    const totalActionItems = scopedItems.length;
    const completionRate =
      totalActionItems > 0
        ? Math.round((statusCounts.completed / totalActionItems) * 100)
        : 0;

    const monthLabel = now.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });

    const statusKey =
      normalizeStatusValue(selectedClient?.status) || "pre-boarding";

    return {
      monthLabel,
      statusLabel: getStatusLabel(selectedClient?.status),
      statusKey,
      actionItems: {
        total: totalActionItems,
        open: statusCounts.open,
        inProgress: statusCounts.inProgress,
        completed: statusCounts.completed,
        overdue: statusCounts.overdue,
        completionRate,
        scopeLabel: hasMonthlyData ? "This month" : "Latest activity",
        isMonthlyScope: hasMonthlyData,
      },
      meetings: {
        thisMonth: meetingsThisMonth,
        lastMonth: meetingsLastMonth,
        trend: meetingTrend,
      },
    };
  }, [overviewMeetings, overviewActionItemsList, selectedClient]);

  const loadingState = loadingClients || loadingUsers;
  const detailsLoadingState =
    loadingClientOverview ||
    /* loadingWorkflows || */
    loadingSecrets ||
    loadingMeetingDetails ||
    (clientActionItemsPage > 1 ? loadingActionItems : false);

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
    
    const accountManagerSet = new Map(); // Map to store id -> name pairs
    const adoptionSpecialistSet = new Map();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    clientsData.forEach((client) => {
      // Handle account manager
      const accountManagerValue = client?.account_manager;
      if (accountManagerValue) {
        if (typeof accountManagerValue === 'string' && accountManagerValue.trim()) {
          if (uuidRegex.test(accountManagerValue.trim())) {
            // It's an ID
            const name = userMap[accountManagerValue.trim()] || accountManagerValue.trim();
            accountManagerSet.set(accountManagerValue.trim(), name);
          } else {
            // It's a name
            accountManagerSet.set(accountManagerValue.trim(), accountManagerValue.trim());
          }
        }
      }
      
      // Handle adoption specialist
      const adoptionSpecialistValue = client?.adoption_specialist;
      if (adoptionSpecialistValue) {
        if (typeof adoptionSpecialistValue === 'string' && adoptionSpecialistValue.trim()) {
          if (uuidRegex.test(adoptionSpecialistValue.trim())) {
            // It's an ID
            const name = userMap[adoptionSpecialistValue.trim()] || adoptionSpecialistValue.trim();
            adoptionSpecialistSet.set(adoptionSpecialistValue.trim(), name);
          } else {
            // It's a name
            adoptionSpecialistSet.set(adoptionSpecialistValue.trim(), adoptionSpecialistValue.trim());
          }
        }
      }
    });
    
    return {
      accountManagers: Array.from(accountManagerSet.entries()).map(([id, name]) => ({
        id,
        name: (name && typeof name === 'string' && name.trim()) ? name.trim() : `Unknown (${id.slice(0, 8)}...)`
      })),
      adoptionSpecialists: Array.from(adoptionSpecialistSet.entries()).map(([id, name]) => ({
        id,
        name: (name && typeof name === 'string' && name.trim()) ? name.trim() : `Unknown (${id.slice(0, 8)}...)`
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

  const handleActionItemsRefresh = () => {
    if (!selectedClient) return;

    if (clientActionItemsPage === 1) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.clients.overview(
          selectedClient.id,
          clientActionItemsPageSize
        ),
      });
    } else {
      queryClient.invalidateQueries({
        queryKey: queryKeys.actionItems.byClient(selectedClient.id, {
          page: clientActionItemsPage,
          page_size: clientActionItemsPageSize,
        }),
      });
    }
  };

  // Meeting handlers
  const handleMeetingSelect = async (meeting) => {
    setActiveTab("meetings");
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
    const meetingName = meeting.meeting_name || meeting.title || 'this meeting';
    if (
      !window.confirm(`Are you sure you want to delete "${meetingName}"?`)
    ) {
      return;
    }

    deleteMeetingMutation.mutate(meeting.id, {
      onSuccess: () => {
        // Invalidate client overview to refresh meetings list
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.clients.overview(selectedClient?.id, clientActionItemsPageSize) 
        });
        // Also invalidate meetings list for this client
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.meetings.list(selectedClient?.id) 
        });
        // If viewing meeting details, go back to list
        if (meetingsView === 'details' && selectedMeeting?.id === meeting.id) {
          handleBackToMeetings();
        }
      },
    });
  };

  const handleMeetingFormSave = () => {
    const editedMeetingId = editingMeeting?.id;
    const clientId = selectedClient?.id;

    setShowMeetingForm(false);
    setEditingMeeting(null);

    if (clientId) {
      // Refresh consolidated client overview (meetings + action items)
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.clients.all, 'overview', clientId],
        exact: false,
      });

      // Refresh any cached meeting lists for this client
      queryClient.invalidateQueries({
        queryKey: queryKeys.meetings.list(clientId),
        exact: false,
      });
    }

    if (editedMeetingId) {
      // Ensure meeting details view shows the latest data
      queryClient.invalidateQueries({
        queryKey: queryKeys.meetings.detail(editedMeetingId),
      });
    }
  };

  const handleMeetingFormCancel = () => {
    setShowMeetingForm(false);
    setEditingMeeting(null);
  };

  // Client form handlers
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const extractIdValue = (...candidates) => {
    for (const candidate of candidates) {
      if (!candidate) continue;
      if (typeof candidate === "string") {
        const trimmed = candidate.trim();
        if (trimmed && UUID_REGEX.test(trimmed)) {
          return trimmed;
        }
      } else if (typeof candidate === "object") {
        if (candidate.id && UUID_REGEX.test(candidate.id)) {
          return candidate.id;
        }
        if (candidate.value && UUID_REGEX.test(candidate.value)) {
          return candidate.value;
        }
      }
    }
    return "";
  };

  const normalizeClientForForm = (client) => {
    if (!client) return null;
    const normalized = { ...client };

    normalized.account_manager =
      extractIdValue(
        client.account_manager_id,
        client.account_manager,
        client.account_manager_user,
        client.account_manager_details
      ) || client.account_manager || "";

    normalized.adoption_specialist =
      extractIdValue(
        client.adoption_specialist_id,
        client.adoption_specialist,
        client.adoption_specialist_user,
        client.adoption_specialist_details
      ) || client.adoption_specialist || "";

    normalized.ai_executor =
      extractIdValue(
        client.ai_executor_id,
        client.ai_executor,
        client.ai_executor_user,
        client.ai_executor_details
      ) || client.ai_executor || "";

    if (typeof client.plan_details === "object" && client.plan_details !== null) {
      normalized.plan_details =
        client.plan_details.value ||
        client.plan_details.id ||
        client.plan_details.name ||
        "";
    }

    return normalized;
  };

  const handleAddClient = () => {
    console.log("Add client button clicked"); // Debug log
    setClientFormMode("create");
    setEditingClient(null);
    setShowClientForm(true);
    console.log("showClientForm set to true"); // Debug log
  };

  const buildClientDataFromCache = (client) => {
    if (!client?.id) return null;
    const clientId = client.id;

    // Try to find client from list data first
    const listClient = (clientsData || []).find((c) => c.id === clientId) || client;

    // Attempt to get overview data from query cache (same key used by useClientOverview)
    const cachedOverview = queryClient.getQueryData(
      queryKeys.clients.overview(clientId, clientActionItemsPageSize)
    );

    if (cachedOverview && typeof cachedOverview === "object") {
      return { ...listClient, ...cachedOverview };
    }

    // Fallback to current clientOverview (if we're already viewing this client)
    if (clientOverview && clientOverview.id === clientId) {
      return { ...listClient, ...clientOverview };
    }

    return listClient || null;
  };

  const hasSufficientClientFields = (data) => {
    if (!data) return false;
    return Boolean(
      data.name &&
      data.website &&
      data.status !== undefined &&
      data.status !== null
    );
  };

  const handleEditClient = async (client) => {
    if (!client?.id) return;
    setClientFormMode("edit");
    try {
      // Prefer cached overview data when available to avoid extra network call
      const cachedClient = normalizeClientForForm(
        buildClientDataFromCache(client)
      );
      if (hasSufficientClientFields(cachedClient)) {
        setEditingClient(cachedClient);
        setShowClientForm(true);
        return;
      }

      // Fallback to API if required fields are missing
      setIsLoadingClientForEdit(true);
      const fullClient = await clientAPI.getById(client.id);
      setEditingClient(fullClient);
      setShowClientForm(true);
    } catch (error) {
      console.error("Failed to load client for editing:", error);
      showError("Failed to load client details for editing");
    } finally {
      setIsLoadingClientForEdit(false);
    }
  };

  const handleClientFormSave = () => {
    setShowClientForm(false);
    setEditingClient(null);
    setClientFormMode("create");
    // Cache will be invalidated by mutation hooks
  };

  const handleClientFormCancel = () => {
    setShowClientForm(false);
    setEditingClient(null);
    setClientFormMode("create");
  };

  const handleViewClientDetails = () => {
    if (!selectedClient) return;
    const mergedData =
      normalizeClientForForm(buildClientDataFromCache(selectedClient)) ||
      normalizeClientForForm(selectedClient) ||
      selectedClient;
    if (mergedData) {
      setEditingClient(mergedData);
    } else {
      setEditingClient(selectedClient);
    }
    setClientFormMode("view");
    setShowClientForm(true);
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
    // Return the normalized status from the client object
    const normalizedStatus = normalizeStatusValue(client?.status);
    // Default to pre-boarding for new clients
    return normalizedStatus || "pre-boarding";
  };

  function getStatusLabel(status) {
    switch (normalizeStatusValue(status)) {
      case "pre-boarding":
        return "Pre-boarding";
      case "onboarding":
        return "Onboarding";
      case "assessment":
        return "Assessment";
      case "active":
        return "Execution";
      case "paused":
        return "Paused";
      case "inactive":
        return "Inactive";
      default:
        return "Pre-boarding";
    }
  }

  const getUserName = (userId, userNameField) => {
    // If user name is provided directly from backend, use it (check for non-empty string)
    if (userNameField && typeof userNameField === 'string' && userNameField.trim()) {
      return userNameField.trim();
    }
    // Look up user name from userMap
    if (userId && userMap[userId]) {
      const name = userMap[userId];
      // Return the name if it's a valid non-empty string
      if (name && typeof name === 'string' && name.trim()) {
        return name.trim();
      }
    }
    // Return null if no name found (will show "Not assigned" in UI)
    return null;
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
        !statusFilter ||
        getClientStatus(client) === normalizeStatusValue(statusFilter);

      // Account Manager filter - compare the actual value (name or ID)
      const matchesAccountManager =
        !accountManagerFilter || 
        (client?.account_manager && 
         typeof client.account_manager === 'string' && 
         client.account_manager.trim() === accountManagerFilter.trim());

      // Adoption Specialist filter - compare the actual value (name or ID)
      const matchesAdoptionSpecialist =
        !adoptionSpecialistFilter || 
        (client?.adoption_specialist && 
         typeof client.adoption_specialist === 'string' && 
         client.adoption_specialist.trim() === adoptionSpecialistFilter.trim());

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

  // Order status groups: pre-boarding, onboarding, assessment, execution (active), paused, inactive last
  const statusOrder = ["pre-boarding", "onboarding", "assessment", "active", "paused", "inactive"];
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
  const clientFormModal = (
    <ClientForm
      client={editingClient}
      isOpen={showClientForm}
      onSave={handleClientFormSave}
      onCancel={handleClientFormCancel}
      mode={clientFormMode}
    />
  );

  if (selectedClient) {
    return (
      <DashboardLayout>
        <div className="clients-page">
          <div className="client-details-header">
            <button className="back-btn" onClick={handleBackToList}>
              <ArrowBackIcon />
            </button>
            <div className="client-details-title-row">
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
              <div className="client-header-actions">
                <PermissionGuard permissions={["read_client"]}>
                  <button
                    className="client-header-action-btn"
                    title="View client details"
                    onClick={handleViewClientDetails}
                  >
                    <VisibilityIcon />
                  </button>
                </PermissionGuard>
                <PermissionGuard permissions={["update_client"]}>
                  <button
                    className="client-header-action-btn"
                    title="Edit client"
                    onClick={() => handleEditClient(selectedClient)}
                  >
                    <EditIcon />
                  </button>
                </PermissionGuard>
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
              Action Items ({actionItemsPageMeta.total || 0})
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
                      <div className="overview-layout">
                        <div className="overview-row">
                          <div className="overview-column">
                            <MonthlySummaryCueCard
                              summary={monthlySummary}
                              onActionItemsClick={() => setActiveTab("action-items")}
                              onMeetingsClick={() => setActiveTab("meetings")}
                            />
                          </div>
                          <div className="overview-column">
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
                                      {getAccountManagerName(selectedClient) || "Not assigned"}
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
                                      {getAdoptionSpecialistName(selectedClient) || "Not assigned"}
                                    </span>
                                  </div>
                                </div>

                                {(clientDetails?.plan_details ||
                                  selectedClient.plan_details) && (
                                  <div className="client-info-item">
                                    <div className="info-item-icon-wrapper">
                                      <PlanIcon className="info-icon" />
                                    </div>
                                    <div className="info-item-content">
                                      <label>Plan Details</label>
                                      <span>
                                        {(clientDetails?.plan_details ||
                                          selectedClient.plan_details)
                                          ?.replace(/_/g, " ")
                                          ?.replace(/AI /g, "AI ")}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {(clientDetails?.communication_tool ||
                                  selectedClient.communication_tool) && (
                                  <div className="client-info-item">
                                    <div className="info-item-icon-wrapper">
                                      <CommunicationIcon className="info-icon" />
                                    </div>
                                    <div className="info-item-content">
                                      <label>Communication Tool</label>
                                      <span>
                                        {clientDetails?.communication_tool ||
                                          selectedClient.communication_tool}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {(clientDetails?.ai_executor ||
                                  clientDetails?.ai_executor_name ||
                                  selectedClient.ai_executor ||
                                  selectedClient.ai_executor_name) && (
                                  <div className="client-info-item">
                                    <div className="info-item-icon-wrapper">
                                      <AIExecutorIcon className="info-icon" />
                                    </div>
                                    <div className="info-item-content">
                                      <label>AI Executor</label>
                                      <span>
                                        {getUserName(
                                          clientDetails?.ai_executor ||
                                            selectedClient.ai_executor,
                                          clientDetails?.ai_executor_name ||
                                            selectedClient.ai_executor_name
                                        ) || "Not assigned"}
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
                                            {getUserName(internId) || `Unknown (${internId.slice(0, 8)}...)`}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {(clientDetails?.assessment_start_date ||
                                  clientDetails?.assessment_end_date ||
                                  selectedClient.assessment_start_date ||
                                  selectedClient.assessment_end_date) && (
                                  <div className="client-info-item">
                                    <div className="info-item-icon-wrapper">
                                      <DateIcon className="info-icon" />
                                    </div>
                                    <div className="info-item-content">
                                      <label>Assessment Period</label>
                                      <span>
                                        {(() => {
                                          const start =
                                            clientDetails?.assessment_start_date ||
                                            selectedClient.assessment_start_date;
                                          const end =
                                            clientDetails?.assessment_end_date ||
                                            selectedClient.assessment_end_date;
                                          if (start && end) {
                                            return `${new Date(start).toLocaleDateString(
                                              "en-US",
                                              {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                              }
                                            )} - ${new Date(end).toLocaleDateString(
                                              "en-US",
                                              {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                              }
                                            )}`;
                                          }
                                          if (start) {
                                            return `From ${new Date(
                                              start
                                            ).toLocaleDateString("en-US", {
                                              month: "short",
                                              day: "numeric",
                                              year: "numeric",
                                            })}`;
                                          }
                                          if (end) {
                                            return `Until ${new Date(
                                              end
                                            ).toLocaleDateString("en-US", {
                                              month: "short",
                                              day: "numeric",
                                              year: "numeric",
                                            })}`;
                                          }
                                          return null;
                                        })()}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {(clientDetails?.document_link ||
                                  selectedClient.document_link) && (
                                  <div className="client-info-item">
                                    <div className="info-item-icon-wrapper">
                                      <LinkIcon className="info-icon" />
                                    </div>
                                    <div className="info-item-content">
                                      <label>Drive Link</label>
                                      <span>
                                        <a
                                          href={
                                            clientDetails?.document_link ||
                                            selectedClient.document_link
                                          }
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

                                {(clientDetails?.task_audit_sheet_link ||
                                  selectedClient.task_audit_sheet_link) && (
                                  <div className="client-info-item">
                                    <div className="info-item-icon-wrapper">
                                      <AuditIcon className="info-icon" />
                                    </div>
                                    <div className="info-item-content">
                                      <label>Task Audit Sheet</label>
                                      <span>
                                        <a
                                          href={
                                            clientDetails?.task_audit_sheet_link ||
                                            selectedClient.task_audit_sheet_link
                                          }
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

                                {(clientDetails?.last_renewal_date ||
                                  clientDetails?.next_renewal_date ||
                                  selectedClient.last_renewal_date ||
                                  selectedClient.next_renewal_date) && (
                                  <>
                                    {(clientDetails?.last_renewal_date ||
                                      selectedClient.last_renewal_date) && (
                                      <div className="client-info-item">
                                        <div className="info-item-icon-wrapper">
                                          <DateIcon className="info-icon" />
                                        </div>
                                        <div className="info-item-content">
                                          <label>Last Renewal Date</label>
                                          <span>
                                            {new Date(
                                              clientDetails?.last_renewal_date ||
                                                selectedClient.last_renewal_date
                                            ).toLocaleDateString("en-US", {
                                              month: "short",
                                              day: "numeric",
                                              year: "numeric",
                                            })}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                    {(clientDetails?.next_renewal_date ||
                                      selectedClient.next_renewal_date) && (
                                      <div className="client-info-item">
                                        <div className="info-item-icon-wrapper">
                                          <DateIcon className="info-icon" />
                                        </div>
                                        <div className="info-item-content">
                                          <label>Next Renewal Date</label>
                                          <span>
                                            {new Date(
                                              clientDetails?.next_renewal_date ||
                                                selectedClient.next_renewal_date
                                            ).toLocaleDateString("en-US", {
                                              month: "short",
                                              day: "numeric",
                                              year: "numeric",
                                            })}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="overview-row">
                          <div className="overview-column">
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
                          </div>
                          <div className="overview-column">
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
                        onRefresh={handleActionItemsRefresh}
                        meetings={clientDetails?.meetings || []}
                        clients={clientsData || []}
                        users={usersData || []}
                        hideClientColumn={true}
                      />
                      <Pagination
                        currentPage={actionItemsPageMeta.page}
                        totalPages={actionItemsPageMeta.total_pages}
                        totalItems={actionItemsPageMeta.total}
                        pageSize={actionItemsPageMeta.page_size}
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
                      existingOnboardingInfo={
                        clientOverview?.onboarding_info !== undefined
                          ? clientOverview.onboarding_info
                          : (clientDetails?.onboarding_info !== undefined
                              ? clientDetails.onboarding_info
                              : selectedClient?.onboarding_info)
                      }
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

                {/* Secrets tab is commented out
                {activeTab === "secrets" && (
                  <div className="secrets-tab">
                    <SecretsManager
                      clientId={selectedClient.id}
                      clientName={selectedClient.name}
                    />
                  </div>
                )} */}

                {activeTab === "notes" && (
                  <div className="notes-tab">
                    <ClientNotes
                      clientId={selectedClient.id}
                      // Use notes from overview if available (to avoid separate API call)
                      // The overview endpoint already includes notes, so we pass it here
                      initialNotes={
                        clientOverview?.notes !== undefined 
                          ? clientOverview.notes 
                          : (clientDetails?.notes !== undefined 
                              ? clientDetails.notes 
                              : selectedClient?.client_notes)
                      }
                      onNotesUpdate={(updatedNotes) => {
                        // Update the overview cache directly with the new notes to avoid refetching
                        if (updatedNotes !== undefined) {
                          // Update all overview queries for this client (different page sizes)
                          queryClient.setQueriesData(
                            { 
                              queryKey: [...queryKeys.clients.all, 'overview', selectedClient.id],
                              exact: false 
                            },
                            (oldData) => {
                              if (!oldData) return oldData;
                              return {
                                ...oldData,
                                notes: updatedNotes,
                                client_notes: updatedNotes
                              };
                            }
                          );
                        }
                        // Only invalidate the separate notes query (not the overview)
                        queryClient.invalidateQueries({ 
                          queryKey: ['clients', 'notes', selectedClient.id],
                          refetchType: 'none' // Don't refetch, just mark as stale
                        });
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
          {clientFormModal}
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
                    <option value="paused">Paused</option>
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
                        {user.name}
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
                        {user.name}
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
                    const isPaused = status === "paused";
                    const isCollapsibleStatus = isInactive || isPaused;

                  return (
                    <div key={status} className="status-group">
                      <div 
                        className={`status-group-header ${isCollapsibleStatus ? 'inactive-group' : ''}`}
                        onClick={isCollapsibleStatus ? () => toggleStatusGroup(status) : undefined}
                        style={isCollapsibleStatus ? { cursor: 'pointer' } : {}}
                      >
                        <div className="status-group-title">
                          <h3 className="status-group-name">
                            {getStatusLabel(status)}
                          </h3>
                          <span className="status-group-count">
                            ({clients.length})
                          </span>
                        </div>
                        {isCollapsibleStatus && (
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
                      {(!isCollapsibleStatus || !isCollapsed) && (
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
                                      <span className={`assignment-text ${!getAccountManagerName(client) ? 'unassigned' : ''}`}>
                                        {getAccountManagerName(client) || "Unassigned"}
                                      </span>
                                    </div>
                                    <div className="assignment-item-modern">
                                      <AdoptionSpecialistIcon className="assignment-icon-modern" />
                                      <span className={`assignment-text ${!getAdoptionSpecialistName(client) ? 'unassigned' : ''}`}>
                                        {getAdoptionSpecialistName(client) || "Unassigned"}
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
                                {getAccountManagerName(client) || "Unassigned"}
                              </span>
                            </div>
                          </td>
                          <td className="client-assignment-cell">
                            <div className="client-assignment-content">
                              <AdoptionSpecialistIcon className="assignment-icon-small" />
                              <span>
                                {getAdoptionSpecialistName(client) || "Unassigned"}
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
        {clientFormModal}
      </div>
    </DashboardLayout>
  );
};

export default ClientsPage;
