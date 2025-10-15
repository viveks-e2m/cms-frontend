import React, { useState, useEffect } from "react";
import {
  Assignment as ActionItemsIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import DashboardLayout from "../../components/Layout/DashboardLayout/DashboardLayout";
import LoadingSpinner from "../../components/UI/LoadingSpinner/LoadingSpinner";
import { ActionItemsList } from "../../components/ActionItems";
import { openPointsAPI, clientAPI, meetingAPI } from "../../utils/apiServices";
import { useNotificationContext } from "../../contexts/NotificationContext";
import "./ActionItemsPage.css";

const ActionItemsPage = () => {
  const { showSuccess, showError } = useNotificationContext();

  const [actionItems, setActionItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load clients first
      const clientsData = await clientAPI.getAll();
      setClients(clientsData || []);

      // Load all action items for all clients
      const allActionItems = [];
      const allMeetings = [];

      for (const client of clientsData || []) {
        try {
          const clientActionItems = await openPointsAPI.getByClient(client.id);
          const clientMeetings = await meetingAPI.getByClient(client.id);

          // Add client info to action items
          const itemsWithClientInfo = (clientActionItems || []).map((item) => ({
            ...item,
            client_name: client.name,
            client_id: client.id,
          }));

          allActionItems.push(...itemsWithClientInfo);
          allMeetings.push(...(clientMeetings || []));
        } catch (error) {
          console.error(`Error loading data for client ${client.name}:`, error);
        }
      }

      console.log('Loaded action items:', allActionItems);
      console.log('Loaded meetings:', allMeetings);
      console.log('Loaded clients:', clientsData);
      
      setActionItems(allActionItems);
      setMeetings(allMeetings);
    } catch (error) {
      console.error("Error loading action items:", error);
      showError("Failed to load action items");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadData();
      showSuccess("Action items refreshed successfully");
    } catch (error) {
      showError("Failed to refresh action items");
    } finally {
      setRefreshing(false);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setClientFilter("all");
  };

  const filteredActionItems = actionItems.filter((item) => {
    const matchesSearch =
      item.task?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meetings
        .find((m) => m.id === item.meeting_id)
        ?.title?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;
    const matchesClient =
      clientFilter === "all" || item.client_id === clientFilter;

    return matchesSearch && matchesStatus && matchesClient;
  });

  const hasFilters =
    searchTerm || statusFilter !== "all" || clientFilter !== "all";

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="action-items-page">
        {/* Header */}
        <div className="page-header">
          <div className="page-title-section">
            <div className="page-title">
              <ActionItemsIcon className="page-icon" />
              Action Items
            </div>
            <div className="page-subtitle">
              Manage all action items across meetings and clients
            </div>
          </div>
          <div className="header-actions">
            <button
              className="btn btn-outline refresh-btn"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh Action Items"
            >
              <RefreshIcon className={refreshing ? "spinning" : ""} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-card">
          <div className="filters-content">
            <div className="search-section">
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
            </div>
            <div className="filter-controls">
              <div className="filter-group">
                <FilterIcon className="filter-icon" />
                <select
                  className="filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="filter-group">
                <PersonIcon className="filter-icon" />
                <select
                  className="filter-select"
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                >
                  <option value="all">All Clients</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              {hasFilters && (
                <button
                  className="btn btn-secondary clear-filters-btn"
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Action Items Container */}
        <div className="action-items-container">
          <div className="action-items-header">
            <div className="header-info">
              <h3>Action Items</h3>
              <span className="items-count">
                {filteredActionItems.length}{" "}
                {filteredActionItems.length === 1 ? "item" : "items"}
              </span>
            </div>
          </div>

          <ActionItemsList
            actionItems={filteredActionItems}
            onRefresh={loadData}
            meetings={meetings}
            clients={clients}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ActionItemsPage;
