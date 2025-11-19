import React, { useState, useEffect } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { Save as SaveIcon, Notes as NotesIcon } from "@mui/icons-material";
import { clientAPI } from "../../../utils/apiServices";
import { useNotificationContext } from "../../../contexts/NotificationContext";
import { PermissionGuard } from "../../PermissionGuard";
import { PERMISSIONS } from "../../../constants/permissions";
import LoadingSpinner from "../../UI/LoadingSpinner/LoadingSpinner";
import "./ClientNotes.css";

const ClientNotes = ({ clientId, initialNotes, onNotesUpdate }) => {
  const [loading, setLoading] = useState(!initialNotes); // Only load if initialNotes not provided
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useNotificationContext();

  // Create BlockNote editor
  const editor = useCreateBlockNote({
    initialContent: [
      {
        type: "paragraph",
        content: "Add client-specific notes, observations, or important information here...",
      },
      {
        type: "bulletListItem",
        content: "Client preferences and requirements",
      },
      {
        type: "bulletListItem",
        content: "Meeting insights and follow-ups",
      },
      {
        type: "bulletListItem",
        content: "Technical specifications or constraints",
      },
      {
        type: "bulletListItem",
        content: "Communication preferences",
      },
      {
        type: "bulletListItem",
        content: "Project milestones and deadlines",
      },
      {
        type: "bulletListItem",
        content: "Important contacts and relationships",
      },
    ],
  });

  useEffect(() => {
    if (clientId && editor) {
      // If initialNotes is provided, use it directly; otherwise fetch
      if (initialNotes !== undefined) {
        loadNotesFromData(initialNotes);
      } else {
        loadNotes();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, editor, initialNotes]);

  const loadNotesFromData = async (notesData) => {
    try {
      setLoading(true);
      // Handle both direct notes string and object with client_notes property
      const notesContent = typeof notesData === "string" 
        ? notesData 
        : (notesData?.client_notes || notesData?.notes || notesData);
      
      if (notesContent) {
        try {
          // Try to parse as JSON (BlockNote format)
          const parsedContent = typeof notesContent === "string"
            ? JSON.parse(notesContent)
            : notesContent;

          if (parsedContent && Array.isArray(parsedContent) && parsedContent.length > 0) {
            await editor.replaceBlocks(editor.document, parsedContent);
          }
        } catch (parseError) {
          // If parsing fails, it might be old plain text format
          // Convert plain text to BlockNote format
          const textContent = notesContent;
          if (textContent && textContent.trim()) {
            const lines = textContent.split('\n').filter(line => line.trim());
            const blocks = lines.map(line => ({
              type: "paragraph",
              content: line,
            }));
            await editor.replaceBlocks(editor.document, blocks);
          }
        }
      }
    } catch (error) {
      console.error("Error loading notes from data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotes = async () => {
    try {
      setLoading(true);
      const notesData = await clientAPI.getNotes(clientId);
      await loadNotesFromData(notesData);
    } catch (error) {
      showError("Failed to load client notes");
      console.error("Error loading client notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!clientId || !editor) return;

    try {
      setSaving(true);
      const content = editor.document;
      const response = await clientAPI.updateNotes(clientId, JSON.stringify(content));
      showSuccess("Client notes saved successfully");
      
      if (onNotesUpdate) {
        // Pass the updated notes from the response to update cache without refetching
        onNotesUpdate(response?.client_notes || JSON.stringify(content));
      }
    } catch (error) {
      showError("Failed to save client notes");
      console.error("Error saving client notes:", error);
    } finally {
      setSaving(false);
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
        
        <PermissionGuard permissions={[PERMISSIONS.UPDATE_CLIENT]}>
          <button
            className="btn btn-primary btn-xs"
            onClick={handleSave}
            disabled={saving}
          >
            <SaveIcon />
            {saving ? "Saving..." : "Save"}
          </button>
        </PermissionGuard>
      </div>

      <div className="client-notes-content">
        {loading ? (
          <div className="notes-loading">
            <LoadingSpinner message="Loading notes..." />
          </div>
        ) : (
          <div 
            className="notes-editor-container" 
            data-color-scheme="light" 
            data-mantine-color-scheme="light"
            style={{ backgroundColor: '#FFFFFF' }}
          >
            <BlockNoteView 
              editor={editor} 
              theme="light"
              style={{ backgroundColor: '#FFFFFF' }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientNotes;