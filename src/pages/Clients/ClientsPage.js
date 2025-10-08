import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout/DashboardLayout';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { clientAPI } from '../../utils/apiServices';
import LoadingSpinner from '../../components/UI/LoadingSpinner/LoadingSpinner';
import './ClientsPage.css';

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
      showError('Failed to load clients');
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="page-loading">
          <LoadingSpinner message="Loading clients..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="clients-page">
        <div className="page-header">
          <div className="page-title-section">
            <h1 className="page-title">👥 Manage Clients</h1>
            <p className="page-subtitle">
              Manage your client information, assignments, and relationships
            </p>
          </div>
          <button className="btn btn-primary">
            <span>➕</span>
            Add New Client
          </button>
        </div>

        <div className="page-content">
          <div className="content-header">
            <div className="search-section">
              <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search clients by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
            <div className="filter-section">
              <select className="filter-select">
                <option value="">All Clients</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="clients-grid">
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <div key={client.id} className="client-card">
                  <div className="client-avatar">
                    {client.name ? client.name.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <div className="client-info">
                    <h3 className="client-name">{client.name || 'Unnamed Client'}</h3>
                    <p className="client-email">{client.email}</p>
                    <div className="client-meta">
                      <span className="client-status active">Active</span>
                      <span className="client-date">
                        Added {new Date(client.created_at || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="client-actions">
                    <button className="action-btn edit" title="Edit Client">
                      ✏️
                    </button>
                    <button className="action-btn view" title="View Details">
                      👁️
                    </button>
                    <button className="action-btn delete" title="Delete Client">
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>No Clients Found</h3>
                <p>
                  {searchTerm 
                    ? `No clients match "${searchTerm}". Try a different search term.`
                    : 'Start by adding your first client to get started with the CMS.'
                  }
                </p>
                <button className="btn btn-primary">
                  <span>➕</span>
                  Add Your First Client
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClientsPage;