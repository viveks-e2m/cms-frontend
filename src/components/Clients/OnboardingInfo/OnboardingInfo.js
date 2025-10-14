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

  const fetchOnboardingInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await clientAPI.fetchPreOnboardingInfo(clientId);
      setOnboardingData(response.onboarding_info);
      showSuccess("Onboarding information fetched successfully");
    } catch (err) {
      setError(err.message || "Failed to fetch onboarding information");
      showError("Failed to fetch onboarding information");
      console.error("Error fetching onboarding info:", err);
    } finally {
      setLoading(false);
    }
  };

  // Check if we need to fetch onboarding info
  const needsOnboardingInfo =
    !onboardingData || Object.keys(onboardingData).length === 0;

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
          {/* <CheckIcon className="success-icon" /> */}
          <h3>Onboarding Information</h3>
        </div>
        <button
          className="btn btn-outline refresh-btn"
          onClick={fetchOnboardingInfo}
          disabled={loading}
          title="Refresh onboarding information"
        >
          <RefreshIcon />
        </button>
      </div>

      <div className="onboarding-content">
        {company && (
          <>
            {/* Company Overview */}
            <div className="onboarding-section">
              <div className="section-header">
                <BusinessIcon className="section-icon" />
                <h4>Company Overview</h4>
              </div>
              <div className="company-overview">
                <div className="company-basic-info">
                  <div className="info-row">
                    <label>Company Name</label>
                    <span>{company.name || "Not provided"}</span>
                  </div>
                  {company.website && (
                    <div className="info-row">
                      <WebsiteIcon className="info-icon" />
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
                  )}
                  {company.overview && (
                    <div className="info-row full-width">
                      <label>Overview</label>
                      <p className="overview-text">{company.overview}</p>
                    </div>
                  )}
                  {company.about_us && (
                    <div className="info-row full-width">
                      <label>About Us</label>
                      <p className="about-text">{company.about_us}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Regions */}
            {company.regions && company.regions.length > 0 && (
              <div className="onboarding-section">
                <div className="section-header">
                  <LocationIcon className="section-icon" />
                  <h4>Operating Regions</h4>
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
                  <BusinessIcon className="section-icon" />
                  <h4>Notable Clients</h4>
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
                  <TeamIcon className="section-icon" />
                  <h4>Key Team Members</h4>
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
          </>
        )}

        {/* AI Opportunities */}
        {ai_opportunities && ai_opportunities.length > 0 && (
          <div className="onboarding-section">
            <div className="section-header">
              <AIIcon className="section-icon ai-icon" />
              <h4>AI Opportunities</h4>
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
