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
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [taskOwnerFilter, setTaskOwnerFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [viewMode, setViewMode] = useState("kanban"); // "list" or "kanban"
  const [showActionItemForm, setShowActionItemForm] = useState(false);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Prepare filters for query
  const currentFilters = useMemo(() => ({
    status: statusFilter !== "all" ? statusFilter : undefined,
    client_id: clientFilter !== "all" ? clientFilter : undefined,
    task_owner: taskOwnerFilter !== "all" ? taskOwnerFilter : undefined,
    assignee: assigneeFilter !== "all" ? assigneeFilter : undefined,
    page: currentPage,
    page_size: pageSize,
  }), [statusFilter, clientFilter, taskOwnerFilter, assigneeFilter, currentPage, pageSize]);

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
      setStatusFilter(statusParam);
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
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showSuccess("Action items refreshed successfully");
    } catch (error) {
      showError("Failed to refresh action items");
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setClientFilter("all");
    setTaskOwnerFilter("all");
    setAssigneeFilter("all");
    setCurrentPage(1); // Reset to first page when clearing filters
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Count active filters
  const activeFilterCount = [
    statusFilter !== "all" ? statusFilter : null,
    clientFilter !== "all" ? clientFilter : null,
    taskOwnerFilter !== "all" ? taskOwnerFilter : null,
    assigneeFilter !== "all" ? assigneeFilter : null,
  ].filter(Boolean).length;

  const handleStatusFilterChange = (newStatus) => {
    setStatusFilter(newStatus);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleClientFilterChange = (newClientId) => {
    setClientFilter(newClientId);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleTaskOwnerFilterChange = (newTaskOwnerId) => {
    setTaskOwnerFilter(newTaskOwnerId);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleAssigneeFilterChange = (newAssigneeId) => {
    setAssigneeFilter(newAssigneeId);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleAddActionItem = () => {
    setShowActionItemForm(true);
  };

  const handleActionItemFormSave = () => {
    setShowActionItemForm(false);
    // React Query will automatically refetch due to cache invalidation from mutation
  };

  const handleActionItemFormCancel = () => {
    setShowActionItemForm(false);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "list" ? "kanban" : "list");
  };

  const filteredActionItems = actionItems.filter((item) => {
    const matchesSearch =
      item.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.client_name?.toLowerCase().includes(searchTerm.toLowerCase());

    // Task Owner filter (client-side for now)
    const matchesTaskOwner =
      taskOwnerFilter === "all" || item.task_owner === taskOwnerFilter;

    // Assignee filter (client-side for now)
    const matchesAssignee =
      assigneeFilter === "all" || item.assignee === assigneeFilter;

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
                onClick={() => setShowFilterPopup(!showFilterPopup)}
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
                      value={statusFilter}
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
                      value={clientFilter}
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
                      value={taskOwnerFilter}
                      onChange={(e) => handleTaskOwnerFilterChange(e.target.value)}
                    >
                      <option value="all">All Task Owners</option>
                      {(usersData || [])
                        .filter((user) => actionItems.some((item) => item.task_owner === user.id))
                        .map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.full_name || user.name || user.email}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="filter-field">
                    <label>Assignee</label>
                    <select
                      className="filter-popup-select"
                      value={assigneeFilter}
                      onChange={(e) => handleAssigneeFilterChange(e.target.value)}
                    >
                      <option value="all">All Assignees</option>
                      {(usersData || [])
                        .filter((user) => actionItems.some((item) => item.assignee === user.id))
                        .map((user) => (
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
                    onClick={() => setShowFilterPopup(false)}
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
