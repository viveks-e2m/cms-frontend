import React, { useState, useEffect } from "react";
import { clientAPI } from "../../../utils/apiServices";
import { useNotificationContext } from "../../../contexts/NotificationContext";
import LoadingSpinner from "../../UI/LoadingSpinner/LoadingSpinner";
import {
  Business as BusinessIcon,
  Language as WebsiteIcon,
  People as TeamIcon,
  LocationOn as LocationIcon,
  Description as DescriptionIcon,
  AutoAwesome as AIIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import "./OnboardingInfo.css";

const OnboardingInfo = ({ clientId, existingOnboardingInfo }) => {
  const [onboardingData, setOnboardingData] = useState(existingOnboardingInfo);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showError, showSuccess } = useNotificationContext();

  // Update state when existingOnboardingInfo prop changes (e.g., when overview loads)
  useEffect(() => {
    if (existingOnboardingInfo !== undefined) {
      setOnboardingData(existingOnboardingInfo);
      // Clear error if we now have valid data
      if (existingOnboardingInfo && 
          existingOnboardingInfo !== null && 
          Object.keys(existingOnboardingInfo).length > 0 &&
          existingOnboardingInfo.webhook_status !== "empty_response") {
        setError(null);
      }
    }
  }, [existingOnboardingInfo]);

  const fetchOnboardingInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await clientAPI.fetchPreOnboardingInfo(clientId);
      
      // Check if onboarding_info contains error metadata (shouldn't happen with new backend)
      const onboardingInfo = response.onboarding_info;
      
      // Detect if onboarding_info contains error metadata instead of real data
      if (onboardingInfo && onboardingInfo.webhook_status === "empty_response") {
        // This is error metadata, not real data - treat as error
        setError(onboardingInfo.message || "Webhook returned no data");
        showError("Webhook returned no data. Please try again.");
        setOnboardingData(null);
      } else {
        // Valid data
        setOnboardingData(onboardingInfo);
        showSuccess("Onboarding information fetched successfully");
      }
    } catch (err) {
      // Handle API errors
      const errorMessage = err.response?.data?.error?.details?.message 
        || err.response?.data?.error?.message
        || err.message 
        || "Failed to fetch onboarding information";
      
      setError(errorMessage);
      showError(errorMessage);
      console.error("Error fetching onboarding info:", err);
    } finally {
      setLoading(false);
    }
  };

  // Check if we need to fetch onboarding info
  // Also check if onboardingData contains error metadata instead of real data
  const needsOnboardingInfo =
    !onboardingData || 
    (typeof onboardingData === 'object' && Object.keys(onboardingData).length === 0) ||
    (onboardingData && onboardingData.webhook_status === "empty_response");

  if (loading) {
    return (
      <div className="onboarding-loading">
        <LoadingSpinner message="Fetching onboarding information... This may take up to 30 seconds." />
      </div>
    );
  }

  if (needsOnboardingInfo && !error) {
    return (
      <div className="onboarding-empty">
        <div className="onboarding-empty-content">
          <BusinessIcon className="empty-icon" />
          <h3>No Onboarding Information Available</h3>
          <p>
            Fetch detailed company information, team details, and AI
            opportunities for this client. This process may take up to 30
            seconds.
          </p>
          <button
            className="btn btn-primary fetch-btn"
            onClick={fetchOnboardingInfo}
            disabled={loading}
          >
            <RefreshIcon />
            Fetch Onboarding Information
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="onboarding-error">
        <ErrorIcon className="error-icon" />
        <h3>Failed to Load Onboarding Information</h3>
        <p>{error}</p>
        <button
          className="btn btn-secondary"
          onClick={fetchOnboardingInfo}
          disabled={loading}
        >
          <RefreshIcon />
          Try Again
        </button>
      </div>
    );
  }

  const { output } = onboardingData || {};
  const { company, ai_opportunities } = output || {};

  return (
    <div className="onboarding-info">
      <div className="onboarding-header">
        <div className="onboarding-title">
          <BusinessIcon className="title-icon" />
          <h3>Company Information</h3>
        </div>
        <button
          className="btn btn-outline refresh-btn"
          onClick={fetchOnboardingInfo}
          disabled={loading}
          title="Refresh company information"
        >
          <RefreshIcon />
          Refresh
        </button>
      </div>

      <div className="onboarding-content">
        {company && (
          <>
            {/* Company Overview */}
            <div className="onboarding-section company-overview-section">
              <div className="section-header">
                <div className="section-header-left">
                  <div className="section-icon-wrapper">
                    <BusinessIcon className="section-icon" />
                  </div>
                  <h4>Company Overview</h4>
                </div>
              </div>
              <div className="company-overview">
                <div className="company-basic-info">
                  <div className="info-row">
                    <div className="info-item-icon-wrapper">
                      <BusinessIcon className="info-icon" />
                    </div>
                    <div className="info-item-content">
                      <label>Company Name</label>
                      <span>{company.name || "Not provided"}</span>
                    </div>
                  </div>
                  {company.website && (
                    <div className="info-row">
                      <div className="info-item-icon-wrapper">
                        <WebsiteIcon className="info-icon" />
                      </div>
                      <div className="info-item-content">
                        <label>Website</label>
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="website-link"
                        >
                          {company.website}
                        </a>
                      </div>
                    </div>
                  )}
                  {company.overview && (
                    <div className="info-row full-width">
                      <label>Overview</label>
                      <div className="text-content-wrapper">
                        <p className="overview-text">{company.overview}</p>
                      </div>
                    </div>
                  )}
                  {company.about_us && (
                    <div className="info-row full-width">
                      <label>About Us</label>
                      <div className="text-content-wrapper">
                        <p className="about-text">{company.about_us}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Regions */}
            {company.regions && company.regions.length > 0 && (
              <div className="onboarding-section">
                <div className="section-header">
                  <div className="section-header-left">
                    <div className="section-icon-wrapper">
                      <LocationIcon className="section-icon" />
                    </div>
                    <h4>Operating Regions</h4>
                  </div>
                </div>
                <div className="regions-list">
                  {company.regions.map((region, index) => (
                    <span key={index} className="region-tag">
                      {region}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Clients */}
            {company.clients && company.clients.length > 0 && (
              <div className="onboarding-section">
                <div className="section-header">
                  <div className="section-header-left">
                    <div className="section-icon-wrapper">
                      <BusinessIcon className="section-icon" />
                    </div>
                    <h4>Notable Clients</h4>
                  </div>
                </div>
                <div className="clients-grid">
                  {company.clients.map((client, index) => (
                    <div key={index} className="client-item">
                      {client}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Team */}
            {company.key_team && company.key_team.length > 0 && (
              <div className="onboarding-section">
                <div className="section-header">
                  <div className="section-header-left">
                    <div className="section-icon-wrapper">
                      <TeamIcon className="section-icon" />
                    </div>
                    <h4>Key Team Members</h4>
                  </div>
                </div>
                <div className="team-grid">
                  {company.key_team.map((member, index) => (
                    <div key={index} className="team-member">
                      <div className="member-avatar">
                        {member.name?.charAt(0) || "?"}
                      </div>
                      <div className="member-info">
                        <h5>{member.name}</h5>
                        <p>{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Services */}
            {company.ai_services && company.ai_services.length > 0 && (
              <div className="onboarding-section">
                <div className="section-header">
                  <div className="section-header-left">
                    <div className="section-icon-wrapper ai-icon-wrapper">
                      <AIIcon className="section-icon ai-icon" />
                    </div>
                    <h4>AI Services</h4>
                  </div>
                </div>
                <div className="ai-services">
                  {company.ai_services.map((service, index) => (
                    <div key={index} className="service-item">
                      <div className="service-check-wrapper">
                        <CheckIcon className="service-check" />
                      </div>
                      <p>{service}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* AI Opportunities */}
        {ai_opportunities && ai_opportunities.length > 0 && (
          <div className="onboarding-section">
            <div className="section-header">
              <div className="section-header-left">
                <div className="section-icon-wrapper ai-icon-wrapper">
                  <AIIcon className="section-icon ai-icon" />
                </div>
                <h4>AI Opportunities</h4>
              </div>
            </div>
            <div className="ai-opportunities">
              {ai_opportunities.map((opportunity, index) => (
                <div key={index} className="opportunity-item">
                  <div className="opportunity-number">{index + 1}</div>
                  <p>{opportunity}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Report Generated Date */}
        {onboardingData.report_generated_at && (
          <div className="onboarding-footer">
            <DescriptionIcon className="footer-icon" />
            <div className="report-info">
              <span className="report-label">Report Generated:</span>
              <span className="report-date">
                {new Date(
                  onboardingData.report_generated_at
                ).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingInfo;
