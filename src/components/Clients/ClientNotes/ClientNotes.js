import React, { useState, useEffect } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { Save as SaveIcon, Notes as NotesIcon } from "@mui/icons-material";
import { clientAPI } from "../../../utils/apiServices";
import { useNotificationContext } from "../../../contexts/NotificationContext";
import LoadingSpinner from "../../UI/LoadingSpinner/LoadingSpinner";
import "./ClientNotes.css";

const ClientNotes = ({ clientId, onNotesUpdate }) => {
  const [loading, setLoading] = useState(true);
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
      loadNotes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, editor]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const notesData = await clientAPI.getNotes(clientId);
      
      if (notesData && notesData.client_notes) {
        try {
          // Try to parse as JSON (BlockNote format)
          const parsedContent = typeof notesData.client_notes === "string"
            ? JSON.parse(notesData.client_notes)
            : notesData.client_notes;

          if (parsedContent && Array.isArray(parsedContent) && parsedContent.length > 0) {
            await editor.replaceBlocks(editor.document, parsedContent);
          }
        } catch (parseError) {
          // If parsing fails, it might be old plain text format
          // Convert plain text to BlockNote format
          const textContent = notesData.client_notes;
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
      await clientAPI.updateNotes(clientId, JSON.stringify(content));
      showSuccess("Client notes saved successfully");
      
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
          disabled={saving}
        >
          <SaveIcon />
          {saving ? "Saving..." : "Save"}
        </button>
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