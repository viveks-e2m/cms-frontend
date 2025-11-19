import React, { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
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

import "./ActionItemsPage.css";

const ActionItemsPage = () => {
  const location = useLocation();
  const { showSuccess, showError } = useNotificationContext();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  
  // Pending filters (what user selects in the popup, not yet applied)
  const [pendingStatusFilter, setPendingStatusFilter] = useState("all");
  const [pendingClientFilter, setPendingClientFilter] = useState("all");
  const [pendingTaskOwnerFilter, setPendingTaskOwnerFilter] = useState("all");
  const [pendingAssigneeFilter, setPendingAssigneeFilter] = useState("all");
  
  // Applied filters (what gets sent to the API)
  const [appliedStatusFilter, setAppliedStatusFilter] = useState("all");
  const [appliedClientFilter, setAppliedClientFilter] = useState("all");
  const [appliedTaskOwnerFilter, setAppliedTaskOwnerFilter] = useState("all");
  const [appliedAssigneeFilter, setAppliedAssigneeFilter] = useState("all");
  
  const [viewMode, setViewMode] = useState("kanban"); // "list" or "kanban"
  const [showActionItemForm, setShowActionItemForm] = useState(false);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Prepare filters for query (only use applied filters that backend supports)
  // Note: task_owner and assignee are filtered client-side since backend doesn't support them
  const currentFilters = useMemo(() => ({
    status: appliedStatusFilter !== "all" ? appliedStatusFilter : undefined,
    client_id: appliedClientFilter !== "all" ? appliedClientFilter : undefined,
    // task_owner and assignee are NOT sent to backend - filtered client-side instead
    page: currentPage,
    page_size: pageSize,
  }), [appliedStatusFilter, appliedClientFilter, currentPage, pageSize]);

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
    const statusParam = searchParams.get('status');

    // Apply status filter from URL
    if (statusParam) {
      setPendingStatusFilter(statusParam);
      setAppliedStatusFilter(statusParam);
    }
  }, [location.search]);


  // Process action items with client names and pagination data
  const actionItems = useMemo(() => {
    const clients = clientsData || [];
    const items = actionItemsData?.items || [];
    
    // Create client lookup map
    const clientMap = clients.reduce((map, client) => {
      map[client.id] = client.name;
      return map;
    }, {});

    // Add client names to action items (only if not already provided by backend)
    return items.map((item) => ({
      ...item,
      client_name: item.client_name || clientMap[item.client_id] || "Unknown Client",
    }));
  }, [actionItemsData, clientsData]);

  // Extract pagination metadata
  const paginationData = useMemo(() => ({
    total: actionItemsData?.total || 0,
    page: actionItemsData?.page || 1,
    page_size: actionItemsData?.page_size || pageSize,
    total_pages: actionItemsData?.total_pages || 1,
  }), [actionItemsData, pageSize]);

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
    setAppliedStatusFilter("all");
    setAppliedClientFilter("all");
    setAppliedTaskOwnerFilter("all");
    setAppliedAssigneeFilter("all");
    setCurrentPage(1); // Reset to first page when clearing filters
  };
  
  const handleApplyFilters = () => {
    // Apply pending filters to the actual filters used for API calls
    setAppliedStatusFilter(pendingStatusFilter);
    setAppliedClientFilter(pendingClientFilter);
    setAppliedTaskOwnerFilter(pendingTaskOwnerFilter);
    setAppliedAssigneeFilter(pendingAssigneeFilter);
    setCurrentPage(1); // Reset to first page when applying filters
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

  // Count active filters (based on applied filters)
  const activeFilterCount = [
    appliedStatusFilter !== "all" ? appliedStatusFilter : null,
    appliedClientFilter !== "all" ? appliedClientFilter : null,
    appliedTaskOwnerFilter !== "all" ? appliedTaskOwnerFilter : null,
    appliedAssigneeFilter !== "all" ? appliedAssigneeFilter : null,
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

  const handleAddActionItem = () => {
    setShowActionItemForm(true);
  };
  
  // Sync pending filters with applied filters when popup opens
  const handleFilterPopupOpen = () => {
    setPendingStatusFilter(appliedStatusFilter);
    setPendingClientFilter(appliedClientFilter);
    setPendingTaskOwnerFilter(appliedTaskOwnerFilter);
    setPendingAssigneeFilter(appliedAssigneeFilter);
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

    // Apply search filter and additional client-side filters
    return matchesSearch && matchesTaskOwner && matchesAssignee;
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
                  onRefresh={handleRefresh}
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
                  onRefresh={handleRefresh}
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
