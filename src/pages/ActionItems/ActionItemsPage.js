import React, { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  ViewList as ListViewIcon,
  ViewModule as KanbanViewIcon,
  Add as AddIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import DashboardLayout from "../../components/Layout/DashboardLayout/DashboardLayout";
import LoadingSpinner from "../../components/UI/LoadingSpinner/LoadingSpinner";
import Pagination from "../../components/UI/Pagination/Pagination";
import {
  ActionItemsList,
  ActionItemsKanban,
  ActionItemForm,
} from "../../components/ActionItems";
import { useActionItems, useClients, useUsers } from "../../hooks/useQueries";
import { useQueryClient } from "@tanstack/react-query";
import { useNotificationContext } from "../../contexts/NotificationContext";
import { PermissionGuard } from "../../components/PermissionGuard";
import { PERMISSIONS } from "../../constants/permissions";
import { getStatusOptions } from "../../utils/statusUtils";
import { openPointsAPI } from "../../utils/apiServices";

import "./ActionItemsPage.css";

const DUE_DATE_OPTIONS = [
  { value: "all", label: "All Due Dates" },
  { value: "specific", label: "Specific Date" },
  { value: "range", label: "Date Range" },
];

const startOfDay = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(23, 59, 59, 999);
  return d;
};

const toISOStringSafe = (date) => {
  if (!date) return null;
  return date.toISOString();
};

const buildDueDateQueryParams = (mode, startDate, endDate) => {
  const params = {};

  switch (mode) {
    case "specific": {
      const singleStart = startOfDay(startDate);
      if (singleStart) {
        params.due_date_from = toISOStringSafe(singleStart);
        params.due_date_to = toISOStringSafe(endOfDay(singleStart));
      }
      break;
    }
    case "range": {
      const rangeStart = startOfDay(startDate);
      const rangeEnd = endOfDay(endDate);
      if (rangeStart) {
        params.due_date_from = toISOStringSafe(rangeStart);
      }
      if (rangeEnd) {
        params.due_date_to = toISOStringSafe(rangeEnd);
      }
      break;
    }
    default:
      break;
  }

  return params;
};

const formatDateInputValue = (dateObj) => {
  if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) {
    return "";
  }
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const ActionItemsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotificationContext();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  
  // Pending filters (what user selects in the popup, not yet applied)
  const [pendingStatusFilter, setPendingStatusFilter] = useState("all");
  const [pendingClientFilter, setPendingClientFilter] = useState("all");
  const [pendingTaskOwnerFilter, setPendingTaskOwnerFilter] = useState("all");
  const [pendingAssigneeFilter, setPendingAssigneeFilter] = useState("all");
  const [pendingDueDateFilter, setPendingDueDateFilter] = useState("all");
  const [pendingDueDateStart, setPendingDueDateStart] = useState("");
  const [pendingDueDateEnd, setPendingDueDateEnd] = useState("");
  
  // Applied filters (what gets sent to the API)
  const [appliedStatusFilter, setAppliedStatusFilter] = useState("all");
  const [appliedClientFilter, setAppliedClientFilter] = useState("all");
  const [appliedTaskOwnerFilter, setAppliedTaskOwnerFilter] = useState("all");
  const [appliedAssigneeFilter, setAppliedAssigneeFilter] = useState("all");
  const [appliedDueDateFilter, setAppliedDueDateFilter] = useState("all");
  const [appliedDueDateStart, setAppliedDueDateStart] = useState("");
  const [appliedDueDateEnd, setAppliedDueDateEnd] = useState("");
  
  const [viewMode, setViewMode] = useState("kanban"); // "list" or "kanban"
  const [showActionItemForm, setShowActionItemForm] = useState(false);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  // Per-column page state for Kanban view
  const [columnPages, setColumnPages] = useState({
    open: 1,
    in_progress: 1,
    completed: 1,
  });

  // Prepare filters for query (only use applied filters that backend supports)
  // Note: task_owner and assignee are filtered client-side since backend doesn't support them
  const dueDateQueryParams = useMemo(
    () => buildDueDateQueryParams(appliedDueDateFilter, appliedDueDateStart, appliedDueDateEnd),
    [appliedDueDateFilter, appliedDueDateStart, appliedDueDateEnd]
  );

  const currentFilters = useMemo(() => {
    const filters = {
      view: viewMode, // Add view parameter: "list" or "kanban"
      client_id: appliedClientFilter !== "all" ? appliedClientFilter : undefined,
      page: currentPage,
      page_size: pageSize,
    };
    
    // For list view, include status filter; for kanban, always use "all" to get all statuses
    if (viewMode === "list") {
      filters.status = appliedStatusFilter !== "all" ? appliedStatusFilter : undefined;
    } else {
      // Kanban view always fetches all statuses
      filters.status = "all";
    }

    if (dueDateQueryParams.due_date_from) {
      filters.due_date_from = dueDateQueryParams.due_date_from;
    }
    if (dueDateQueryParams.due_date_to) {
      filters.due_date_to = dueDateQueryParams.due_date_to;
    }
    return filters;
  }, [viewMode, appliedStatusFilter, appliedClientFilter, currentPage, pageSize, dueDateQueryParams]);

  // Use cached queries
  const {
    data: actionItemsData,
    isLoading: loadingActionItems,
    error: actionItemsError,
    refetch: refetchActionItems,
  } = useActionItems(currentFilters);

  const {
    data: clientsData,
    isLoading: loadingClients,
    error: clientsError,
  } = useClients();

  const {
    data: usersData,
    isLoading: loadingUsers,
    error: usersError,
  } = useUsers();

  const loading = loadingActionItems || loadingClients || loadingUsers;
  const refreshing = false; // React Query handles refetching

  // Handle errors
  React.useEffect(() => {
    if (actionItemsError) {
      showError("Failed to load action items");
    }
    if (clientsError) {
      showError("Failed to load clients");
    }
    if (usersError) {
      showError("Failed to load users");
    }
  }, [actionItemsError, clientsError, usersError, showError]);

  // Handle URL parameters on mount and location change
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const statusParam = searchParams.get("status");
    const duePresetParam = searchParams.get("due_preset");

    if (statusParam) {
      setPendingStatusFilter(statusParam);
      setAppliedStatusFilter(statusParam);
    }

    if (duePresetParam) {
      const today = new Date();

      if (duePresetParam === "today") {
        const todayValue = formatDateInputValue(today);
        setPendingDueDateFilter("specific");
        setPendingDueDateStart(todayValue);
        setPendingDueDateEnd(todayValue);

        setAppliedDueDateFilter("specific");
        setAppliedDueDateStart(todayValue);
        setAppliedDueDateEnd(todayValue);
      } else if (duePresetParam === "next7") {
        const rangeStart = new Date(today);
        rangeStart.setDate(rangeStart.getDate() + 1);
        const rangeEnd = new Date(today);
        rangeEnd.setDate(rangeEnd.getDate() + 7);

        const startValue = formatDateInputValue(rangeStart);
        const endValue = formatDateInputValue(rangeEnd);

        setPendingDueDateFilter("range");
        setPendingDueDateStart(startValue);
        setPendingDueDateEnd(endValue);

        setAppliedDueDateFilter("range");
        setAppliedDueDateStart(startValue);
        setAppliedDueDateEnd(endValue);
      }

      searchParams.delete("due_preset");
      const nextSearch = searchParams.toString();
      navigate(
        {
          pathname: location.pathname,
          search: nextSearch ? `?${nextSearch}` : "",
        },
        { replace: true }
      );
    }
  }, [location.pathname, location.search, navigate]);

  // Reset column pages when filters change or view mode changes
  useEffect(() => {
    setColumnPages({ open: 1, in_progress: 1, completed: 1 });
    setAdditionalColumnItems({ open: [], in_progress: [], completed: [] });
  }, [
    appliedClientFilter,
    appliedStatusFilter,
    appliedDueDateFilter,
    appliedDueDateStart,
    appliedDueDateEnd,
    viewMode,
    pageSize,
  ]);


  const dueDateMatcher = useMemo(() => {
    const filterValue = appliedDueDateFilter;
    if (filterValue === "all") {
      return () => true;
    }

    const customStart = startOfDay(appliedDueDateStart);
    const customEndForRange = endOfDay(appliedDueDateEnd);
    const customEndForSpecific = endOfDay(appliedDueDateStart);

    return (dueDateValue) => {
      if (!dueDateValue) return false;

      const parsedDueDate = new Date(dueDateValue);
      if (Number.isNaN(parsedDueDate.getTime())) {
        return false;
      }

      switch (filterValue) {
        case "specific":
          if (!customStart || !customEndForSpecific) return true;
          return (
            parsedDueDate >= customStart && parsedDueDate <= customEndForSpecific
          );
        case "range": {
          const hasStart = !!customStart;
          const hasEnd = !!customEndForRange;
          if (!hasStart && !hasEnd) return true;
          if (hasStart && parsedDueDate < customStart) return false;
          if (hasEnd && parsedDueDate > customEndForRange) return false;
          return true;
        }
        default:
          return true;
      }
    };
  }, [appliedDueDateFilter, appliedDueDateStart, appliedDueDateEnd]);

  // Process action items with client names and pagination data
  // Handle both list view (flat items) and kanban view (grouped by status)
  const actionItems = useMemo(() => {
    const clients = clientsData || [];
    
    // Create client lookup map
    const clientMap = clients.reduce((map, client) => {
      map[client.id] = client.name;
      return map;
    }, {});

    // Handle kanban view response structure
    if (viewMode === "kanban" && actionItemsData?.columns) {
      // For kanban, flatten all items from all columns
      const allItems = [];
      Object.values(actionItemsData.columns).forEach((column) => {
        if (column.items && Array.isArray(column.items)) {
          allItems.push(...column.items);
        }
      });
      
      // Add client names to action items
      return allItems.map((item) => ({
        ...item,
        client_name: item.client_name || clientMap[item.client_id] || "Unknown Client",
      }));
    }
    
    // Handle list view response structure (flat items array)
    const items = actionItemsData?.items || [];
    
    // Add client names to action items (only if not already provided by backend)
    return items.map((item) => ({
      ...item,
      client_name: item.client_name || clientMap[item.client_id] || "Unknown Client",
    }));
  }, [actionItemsData, clientsData, viewMode]);

  // Extract pagination metadata (different structure for list vs kanban)
  const paginationData = useMemo(() => {
    if (viewMode === "kanban" && actionItemsData?.columns) {
      // For kanban, use summary totals or aggregate from columns
      const summary = actionItemsData.summary || {};
      const total = summary.total_items || 0;
      
      // Get pagination from first column (all columns share same page/page_size in kanban)
      const firstColumn = Object.values(actionItemsData.columns)[0];
      const columnPagination = firstColumn?.pagination || {};
      
      return {
        total: total,
        page: columnPagination.page || 1,
        page_size: columnPagination.page_size || pageSize,
        total_pages: Math.max(...Object.values(actionItemsData.columns).map(c => c.pagination?.total_pages || 1)),
      };
    }
    
    // List view pagination
    return {
      total: actionItemsData?.total || 0,
      page: actionItemsData?.page || 1,
      page_size: actionItemsData?.page_size || pageSize,
      total_pages: actionItemsData?.total_pages || 1,
    };
  }, [actionItemsData, pageSize, viewMode]);

  // State to store additional loaded items per column (for Load More functionality)
  const [additionalColumnItems, setAdditionalColumnItems] = useState({
    open: [],
    in_progress: [],
    completed: [],
  });

  // Kanban-specific data: per-status items and counts
  // Apply client-side filters (task_owner, assignee, search) to kanban data
  // Note: Status filter is ignored in Kanban view - all columns are always shown
  const kanbanData = useMemo(() => {
    if (viewMode !== "kanban" || !actionItemsData?.columns) {
      return null;
    }
    
    const clients = clientsData || [];
    const clientMap = clients.reduce((map, client) => {
      map[client.id] = client.name;
      return map;
    }, {});
    
    // Process each column and apply client-side filters
    // Always show all three columns regardless of status filter
    const columns = {};
    Object.entries(actionItemsData.columns).forEach(([status, column]) => {
      // Get base items from API response
      let baseItems = (column.items || []).map((item) => ({
        ...item,
        client_name: item.client_name || clientMap[item.client_id] || "Unknown Client",
      }));
      
      // Merge with additional loaded items for this column
      const additionalItems = (additionalColumnItems[status] || []).map((item) => ({
        ...item,
        client_name: item.client_name || clientMap[item.client_id] || "Unknown Client",
      }));
      
      // Combine base items and additional loaded items
      let allItems = [...baseItems, ...additionalItems];
      
      // Apply client-side filters (search, task_owner, assignee)
      // Note: Status filter is NOT applied here - we want all columns visible
      allItems = allItems.filter((item) => {
        // Search filter
        const matchesSearch =
          !searchTerm || // If no search term, show all
          item.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Task Owner filter (client-side)
        const matchesTaskOwner =
          appliedTaskOwnerFilter === "all" || item.task_owner === appliedTaskOwnerFilter;
        
        // Assignee filter (client-side)
        const matchesAssignee =
          appliedAssigneeFilter === "all" || item.assignee === appliedAssigneeFilter;

        const matchesDueDate = dueDateMatcher(item.due_date);
        
        // Status filter: if applied, only show items matching that status in their respective column
        // This way all columns are visible, but only the matching column has items
        const matchesStatus =
          appliedStatusFilter === "all" || item.status === appliedStatusFilter;
        
        return (
          matchesSearch &&
          matchesTaskOwner &&
          matchesAssignee &&
          matchesDueDate &&
          matchesStatus
        );
      });
      
      columns[status] = {
        items: allItems,
        pagination: {
          ...column.pagination,
          // Note: total count remains from API (shows all items, not just filtered)
          // This is intentional - we want to show the real total even after client-side filtering
        },
      };
    });
    
    // Recalculate summary based on filtered items
    const filteredSummary = {
      total_items: Object.values(columns).reduce((sum, col) => sum + col.items.length, 0),
      open_count: columns.open?.items.length || 0,
      in_progress_count: columns.in_progress?.items.length || 0,
      completed_count: columns.completed?.items.length || 0,
    };
    
    return {
      columns,
      summary: filteredSummary,
    };
  }, [actionItemsData, clientsData, viewMode, searchTerm, appliedStatusFilter, appliedTaskOwnerFilter, appliedAssigneeFilter, additionalColumnItems, dueDateMatcher]);

  const handleRefresh = async () => {
    try {
      await refetchActionItems();
      // Only invalidate clients/users if they might have changed
      // For manual refresh, we'll refresh everything
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showSuccess("Action items refreshed successfully");
    } catch (error) {
      showError("Failed to refresh action items");
    }
  };
  
  // Lightweight refresh - only refetches action items (for use after edits)
  const handleActionItemsRefresh = async () => {
    try {
      await refetchActionItems();
      // Don't invalidate clients/users - they haven't changed
    } catch (error) {
      // Silent fail for background refresh
      console.error("Failed to refresh action items:", error);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setPendingStatusFilter("all");
    setPendingClientFilter("all");
    setPendingTaskOwnerFilter("all");
    setPendingAssigneeFilter("all");
    setPendingDueDateFilter("all");
    setPendingDueDateStart("");
    setPendingDueDateEnd("");
    setAppliedStatusFilter("all");
    setAppliedClientFilter("all");
    setAppliedTaskOwnerFilter("all");
    setAppliedAssigneeFilter("all");
    setAppliedDueDateFilter("all");
    setAppliedDueDateStart("");
    setAppliedDueDateEnd("");
    setCurrentPage(1); // Reset to first page when clearing filters
    // Reset column pages and additional items when clearing filters
    setColumnPages({ open: 1, in_progress: 1, completed: 1 });
    setAdditionalColumnItems({ open: [], in_progress: [], completed: [] });
  };
  
  const handleApplyFilters = () => {
    if (pendingDueDateFilter === "specific" && !pendingDueDateStart) {
      showError("Please select a date for the Specific Date filter.");
      return;
    }

    if (
      pendingDueDateFilter === "range" &&
      !pendingDueDateStart &&
      !pendingDueDateEnd
    ) {
      showError("Please select at least a start or end date for the Date Range filter.");
      return;
    }

    // Apply pending filters to the actual filters used for API calls
    setAppliedStatusFilter(pendingStatusFilter);
    setAppliedClientFilter(pendingClientFilter);
    setAppliedTaskOwnerFilter(pendingTaskOwnerFilter);
    setAppliedAssigneeFilter(pendingAssigneeFilter);
    setAppliedDueDateFilter(pendingDueDateFilter);
    setAppliedDueDateStart(pendingDueDateStart);
    setAppliedDueDateEnd(pendingDueDateEnd);
    setCurrentPage(1); // Reset to first page when applying filters
    // Reset column pages and additional items when applying new filters
    setColumnPages({ open: 1, in_progress: 1, completed: 1 });
    setAdditionalColumnItems({ open: [], in_progress: [], completed: [] });
    setShowFilterPopup(false);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Handle loading more items for a specific Kanban column
  const handleLoadMoreColumn = async (status) => {
    try {
      const nextPage = columnPages[status] + 1;
      
      // Prepare filters for the load more request
      // Use list view with specific status to fetch only that status's items
      const loadMoreDueDateParams = buildDueDateQueryParams(
        appliedDueDateFilter,
        appliedDueDateStart,
        appliedDueDateEnd
      );
      const loadMoreFilters = {
        view: "list", // Use list view to get items for specific status
        status: status, // Fetch only this specific status
        client_id: appliedClientFilter !== "all" ? appliedClientFilter : undefined,
        page: nextPage,
        page_size: pageSize,
        ...loadMoreDueDateParams,
      };

      // Fetch next page for this column
      const response = await openPointsAPI.getRecentOptimized(loadMoreFilters);
      
      if (response && response.items) {
        const newItems = response.items || [];
        
        // Append new items to existing items for this column
        setAdditionalColumnItems((prev) => ({
          ...prev,
          [status]: [...(prev[status] || []), ...newItems],
        }));
        
        // Update page number for this column
        setColumnPages((prev) => ({
          ...prev,
          [status]: nextPage,
        }));
      }
    } catch (error) {
      console.error(`Error loading more items for ${status}:`, error);
      showError(`Failed to load more items for ${status}`);
    }
  };

  // Count active filters (based on applied filters)
  const activeFilterCount = [
    appliedStatusFilter !== "all" ? appliedStatusFilter : null,
    appliedClientFilter !== "all" ? appliedClientFilter : null,
    appliedTaskOwnerFilter !== "all" ? appliedTaskOwnerFilter : null,
    appliedAssigneeFilter !== "all" ? appliedAssigneeFilter : null,
    appliedDueDateFilter !== "all" ? appliedDueDateFilter : null,
  ].filter(Boolean).length;

  const handleStatusFilterChange = (newStatus) => {
    setPendingStatusFilter(newStatus);
  };

  const handleClientFilterChange = (newClientId) => {
    setPendingClientFilter(newClientId);
  };

  const handleTaskOwnerFilterChange = (newTaskOwnerId) => {
    setPendingTaskOwnerFilter(newTaskOwnerId);
  };

  const handleAssigneeFilterChange = (newAssigneeId) => {
    setPendingAssigneeFilter(newAssigneeId);
  };

  const handleDueDateFilterChange = (newDueDate) => {
    setPendingDueDateFilter(newDueDate);
  };

  const handleAddActionItem = () => {
    setShowActionItemForm(true);
  };
  
  // Sync pending filters with applied filters when popup opens
  const handleFilterPopupOpen = () => {
    setPendingStatusFilter(appliedStatusFilter);
    setPendingClientFilter(appliedClientFilter);
    setPendingTaskOwnerFilter(appliedTaskOwnerFilter);
    setPendingAssigneeFilter(appliedAssigneeFilter);
    setPendingDueDateFilter(appliedDueDateFilter);
    setPendingDueDateStart(appliedDueDateStart);
    setPendingDueDateEnd(appliedDueDateEnd);
    setShowFilterPopup(true);
  };

  const handleActionItemFormSave = () => {
    setShowActionItemForm(false);
    // React Query will automatically refetch due to cache invalidation from mutation
  };

  const handleActionItemFormCancel = () => {
    setShowActionItemForm(false);
  };

  const filteredActionItems = actionItems.filter((item) => {
    const matchesSearch =
      item.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.client_name?.toLowerCase().includes(searchTerm.toLowerCase());

    // Task Owner filter (client-side for now)
    const matchesTaskOwner =
      appliedTaskOwnerFilter === "all" || item.task_owner === appliedTaskOwnerFilter;

    // Assignee filter (client-side for now)
    const matchesAssignee =
      appliedAssigneeFilter === "all" || item.assignee === appliedAssigneeFilter;

    const matchesDueDate = dueDateMatcher(item.due_date);

    // Apply search filter and additional client-side filters
    return matchesSearch && matchesTaskOwner && matchesAssignee && matchesDueDate;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PermissionGuard
        permissions={[PERMISSIONS.READ_TASK]}
        fallback={
          <div className="action-items-page">
            <div className="access-denied-message">
              <p>You don't have permission to view action items.</p>
            </div>
          </div>
        }
      >
        <div className="action-items-page">
          {/* Compact Controls Bar */}
          <div className="compact-controls-bar">
            <div className="controls-left">
              <div className="search-input-wrapper">
                <SearchIcon className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search action items, clients, or meetings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                className={`filter-btn ${activeFilterCount > 0 ? "active" : ""}`}
                onClick={handleFilterPopupOpen}
              >
                <FilterIcon />
                Filters
                {activeFilterCount > 0 && (
                  <span className="filter-badge">{activeFilterCount}</span>
                )}
              </button>
            </div>
            <div className="controls-right">
              <div className="view-toggle">
                <button
                  className={`btn btn-outline view-btn ${
                    viewMode === "list" ? "active" : ""
                  }`}
                  onClick={() => setViewMode("list")}
                  title="List View"
                >
                  <ListViewIcon />
                  List
                </button>
                <button
                  className={`btn btn-outline view-btn ${
                    viewMode === "kanban" ? "active" : ""
                  }`}
                  onClick={() => setViewMode("kanban")}
                  title="Kanban View"
                >
                  <KanbanViewIcon />
                  Kanban
                </button>
              </div>
              <PermissionGuard permissions={[PERMISSIONS.CREATE_TASK]}>
                <button
                  className="btn btn-primary"
                  onClick={handleAddActionItem}
                  disabled={loading}
                >
                  <AddIcon />
                  Add
                </button>
              </PermissionGuard>
              <button
                className="btn btn-outline refresh-btn"
                onClick={handleRefresh}
                disabled={refreshing || loading}
                title={refreshing ? "Refreshing..." : "Refresh Action Items"}
              >
                <RefreshIcon className={refreshing ? "spinning" : ""} />
              </button>
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
                  <h3>Filter Action Items</h3>
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
                      value={pendingStatusFilter}
                      onChange={(e) => handleStatusFilterChange(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      {getStatusOptions().map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-field">
                    <label>Client</label>
                    <select
                      className="filter-popup-select"
                      value={pendingClientFilter}
                      onChange={(e) => handleClientFilterChange(e.target.value)}
                    >
                      <option value="all">All Clients</option>
                      {(clientsData || []).map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-field">
                    <label>Task Owner</label>
                    <select
                      className="filter-popup-select"
                      value={pendingTaskOwnerFilter}
                      onChange={(e) => handleTaskOwnerFilterChange(e.target.value)}
                    >
                      <option value="all">All Task Owners</option>
                      <optgroup label="Users">
                        {(usersData || []).map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.full_name || user.name || user.email}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Clients">
                        {(clientsData || []).map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.name}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                  <div className="filter-field">
                    <label>Assignee</label>
                    <select
                      className="filter-popup-select"
                      value={pendingAssigneeFilter}
                      onChange={(e) => handleAssigneeFilterChange(e.target.value)}
                    >
                      <option value="all">All Assignees</option>
                      {(usersData || []).map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.full_name || user.name || user.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-field">
                    <label>Due Date</label>
                    <select
                      className="filter-popup-select"
                      value={pendingDueDateFilter}
                      onChange={(e) => handleDueDateFilterChange(e.target.value)}
                    >
                      {DUE_DATE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {pendingDueDateFilter === "specific" && (
                      <div className="filter-date-inputs">
                        <div className="filter-date-input">
                          <label className="filter-date-label">Select Date</label>
                          <input
                            type="date"
                            value={pendingDueDateStart}
                            onChange={(e) => setPendingDueDateStart(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                    {pendingDueDateFilter === "range" && (
                      <div className="filter-date-inputs">
                        <div className="filter-date-input">
                          <label className="filter-date-label">Start Date</label>
                          <input
                            type="date"
                            value={pendingDueDateStart}
                            onChange={(e) => setPendingDueDateStart(e.target.value)}
                          />
                        </div>
                        <div className="filter-date-input">
                          <label className="filter-date-label">End Date</label>
                          <input
                            type="date"
                            value={pendingDueDateEnd}
                            onChange={(e) => setPendingDueDateEnd(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
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
                    onClick={handleApplyFilters}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Action Items Container */}
          <div
            className={`action-items-container ${
              viewMode === "kanban" ? "kanban-mode" : ""
            }`}
          >
            {viewMode === "list" && (
              <div className="action-items-header">
                <div className="header-info">
                  <h3>Action Items</h3>
                  <span className="items-count">
                    {paginationData.total}{" "}
                    {paginationData.total === 1 ? "item" : "items"}
                  </span>
                </div>
              </div>
            )}

            {viewMode === "list" ? (
              <>
                <ActionItemsList
                  actionItems={filteredActionItems}
                  onRefresh={handleActionItemsRefresh}
                  clients={clientsData || []}
                  users={usersData || []}
                />
                <Pagination
                  currentPage={paginationData.page}
                  totalPages={paginationData.total_pages}
                  totalItems={paginationData.total}
                  pageSize={paginationData.page_size}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  pageSizeOptions={[10, 20, 50, 100]}
                />
              </>
            ) : (
              <>
                <ActionItemsKanban
                  actionItems={filteredActionItems}
                  kanbanData={kanbanData}
                  onLoadMore={handleLoadMoreColumn}
                  clients={clientsData || []}
                  users={usersData || []}
                />
              </>
            )}
          </div>

          {/* Action Item Form Modal */}
          <ActionItemForm
            isOpen={showActionItemForm}
            onSave={handleActionItemFormSave}
            onCancel={handleActionItemFormCancel}
            clients={clientsData || []}
            meetings={[]}
            users={usersData || []}
          />
        </div>
      </PermissionGuard>
    </DashboardLayout>
  );
};

export default ActionItemsPage;
