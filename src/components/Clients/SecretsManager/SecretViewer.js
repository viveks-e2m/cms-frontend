import React, { useState } from "react";
import {
  Close as CloseIcon,
  Security as SecurityIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ContentCopy as CopyIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import "./SecretViewer.css";

const SecretViewer = ({ secret, isOpen, onClose }) => {
  const [showSecret, setShowSecret] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Reset state when modal opens/closes or secret changes
  React.useEffect(() => {
    if (isOpen) {
      setShowSecret(false);
      setCopySuccess(false);
    }
  }, [isOpen, secret?.id]);

  const toggleSecretVisibility = () => {
    setShowSecret(!showSecret);
  };

  const copyToClipboard = async () => {
    if (!secret?.decryptedValue) return;

    try {
      await navigator.clipboard.writeText(secret.decryptedValue);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  if (!isOpen || !secret) return null;

  return (
    <div className="modal-overlay">
      <div className="secret-viewer-modal">
        <div className="modal-header">
          <div className="modal-title">
            <SecurityIcon className="modal-icon" />
            <div>
              <h3>View Secret</h3>
              <p>{secret.title}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="secret-viewer-content">
          <div className="security-warning">
            <WarningIcon className="warning-icon" />
            <div className="warning-text">
              <strong>Security Warning:</strong> Make sure you're in a secure
              environment. This secret will be visible on your screen when
              revealed.
            </div>
          </div>

          <div className="secret-details">
            <div className="detail-group">
              <label className="detail-label">Secret Title</label>
              <div className="detail-value">{secret.title}</div>
            </div>

            <div className="detail-group">
              <label className="detail-label">Secret Value</label>

              <div
                className="secret-value-container"
                style={{ position: "relative" }}
              >
                <div
                  className={`secret-value ${
                    showSecret ? "revealed" : "hidden"
                  }`}
                  style={{
                    fontFamily: showSecret
                      ? "Monaco, Menlo, Ubuntu Mono, monospace"
                      : "inherit",
                    fontSize: showSecret ? "14px" : "20px",
                    padding: "16px 80px 16px 16px",
                    background: showSecret
                      ? "rgba(16, 185, 129, 0.05)"
                      : "#f5f5f5",
                    border: showSecret
                      ? "2px solid rgba(16, 185, 129, 0.3)"
                      : "2px solid #ccc",
                    borderRadius: "6px",
                    minHeight: "48px",
                    display: "flex",
                    alignItems: "center",
                    wordBreak: "break-all",
                    lineHeight: "1.5",
                    letterSpacing: showSecret ? "normal" : "2px",
                  }}
                >
                  {showSecret
                    ? secret.decryptedValue || "No value available"
                    : "••••••••••••••••"}
                </div>
                <div
                  className="secret-actions"
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    display: "flex",
                    gap: "8px",
                    zIndex: 10,
                  }}
                >
                  <button
                    className="action-btn toggle-btn"
                    onClick={toggleSecretVisibility}
                    title={showSecret ? "Hide Secret" : "Show Secret"}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "36px",
                      height: "36px",
                      border: "1px solid #ccc",
                      background: "white",
                      borderRadius: "6px",
                      cursor: "pointer",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  >
                    {showSecret ? (
                      <VisibilityOffIcon
                        style={{ width: "18px", height: "18px" }}
                      />
                    ) : (
                      <VisibilityIcon
                        style={{ width: "18px", height: "18px" }}
                      />
                    )}
                  </button>
                  {showSecret && secret.decryptedValue && (
                    <button
                      className={`action-btn copy-btn ${
                        copySuccess ? "success" : ""
                      }`}
                      onClick={copyToClipboard}
                      title="Copy to Clipboard"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "36px",
                        height: "36px",
                        border: "1px solid #ccc",
                        background: copySuccess ? "#10B981" : "#3B82F6",
                        color: "white",
                        borderRadius: "6px",
                        cursor: "pointer",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      }}
                    >
                      <CopyIcon style={{ width: "18px", height: "18px" }} />
                    </button>
                  )}
                </div>
              </div>

              {copySuccess && (
                <div className="copy-success">✓ Copied to clipboard</div>
              )}
            </div>

            <div className="secret-metadata">
              <div className="metadata-item">
                <PersonIcon className="metadata-icon" />
                <div>
                  <span className="metadata-label">Created by</span>
                  <span className="metadata-value">
                    {secret.created_by || "Unknown"}
                  </span>
                </div>
              </div>

              <div className="metadata-item">
                <TimeIcon className="metadata-icon" />
                <div>
                  <span className="metadata-label">Created on</span>
                  <span className="metadata-value">
                    {new Date(secret.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="viewer-actions">
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecretViewer;
