import React, { useState, useEffect } from "react";
import { Save as SaveIcon, Notes as NotesIcon } from "@mui/icons-material";
import { clientAPI } from "../../../utils/apiServices";
import { useNotificationContext } from "../../../contexts/NotificationContext";
import LoadingSpinner from "../../UI/LoadingSpinner/LoadingSpinner";
import "./ClientNotes.css";

const ClientNotes = ({ clientId, onNotesUpdate }) => {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { showSuccess, showError } = useNotificationContext();

  useEffect(() => {
    if (clientId) {
      loadNotes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const notesData = await clientAPI.getNotes(clientId);
      setNotes(notesData.client_notes || "");
      setHasChanges(false);
    } catch (error) {
      showError("Failed to load client notes");
      console.error("Error loading client notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotesChange = (e) => {
    setNotes(e.target.value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!clientId) return;

    try {
      setSaving(true);
      await clientAPI.updateNotes(clientId, notes);
      showSuccess("Client notes saved successfully");
      setHasChanges(false);
      
      if (onNotesUpdate) {
        onNotesUpdate();
      }
    } catch (error) {
      showError("Failed to save client notes");
      console.error("Error saving client notes:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  if (loading) {
    return (
      <div className="client-notes-loading">
        <LoadingSpinner message="Loading client notes..." />
      </div>
    );
  }

  return (
    <div className="client-notes">
      <div className="client-notes-header">
        <div className="notes-title">
          <NotesIcon />
          <h3>Client Notes</h3>
        </div>
        
        <button
          className="btn btn-primary btn-xs"
          onClick={handleSave}
          disabled={saving || !hasChanges}
        >
          <SaveIcon />
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="client-notes-content">
        <textarea
          className="notes-textarea"
          value={notes}
          onChange={handleNotesChange}
          onKeyDown={handleKeyDown}
          placeholder="Add client-specific notes, observations, or important information here...

Examples:
• Client preferences and requirements
• Meeting insights and follow-ups
• Technical specifications or constraints
• Communication preferences
• Project milestones and deadlines
• Important contacts and relationships"
          rows={15}
        />
        
        {hasChanges && (
          <div className="unsaved-changes">
            <span>You have unsaved changes</span>
            <small>Press Ctrl+S to save quickly</small>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientNotes;