import { useState, useEffect } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { Save as SaveIcon } from "@mui/icons-material";
import { momAPI } from "../../../utils/apiServices";
import { useNotificationContext } from "../../../contexts/NotificationContext";
import LoadingSpinner from "../../UI/LoadingSpinner/LoadingSpinner";
import "./MinutesOfMeeting.css";

const MinutesOfMeeting = ({ meetingId, onContentUpdate }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useNotificationContext();

  // Create BlockNote editor following official docs
  const editor = useCreateBlockNote({
    initialContent: [
      {
        type: "bulletListItem",
        content: "Agenda",
      },
      {
        type: "bulletListItem",
        content: "Add agenda items here...",
      },
      {
        type: "bulletListItem",
        content: "Discussion Points",
      },
      {
        type: "bulletListItem",
        content: "Document key discussion points here...",
      },
      {
        type: "bulletListItem",
        content: "Decisions Made",
      },
      {
        type: "bulletListItem",
        content: "List decisions made during the meeting...",
      },
      {
        type: "bulletListItem",
        content: "Next Steps",
      },
      {
        type: "bulletListItem",
        content: "Add follow-up actions here...",
      },
    ],
  });

  useEffect(() => {
    if (meetingId && editor) {
      loadMinutes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId, editor]);

  const loadMinutes = async () => {
    try {
      setLoading(true);
      const minutesData = await momAPI.getByMeetingId(meetingId);

      if (minutesData && minutesData.content) {
        const parsedContent =
          typeof minutesData.content === "string"
            ? JSON.parse(minutesData.content)
            : minutesData.content;

        if (
          parsedContent &&
          Array.isArray(parsedContent) &&
          parsedContent.length > 0
        ) {
          try {
            await editor.replaceBlocks(editor.document, parsedContent);
          } catch (error) {
            console.error("Error loading content:", error);
          }
        }
      }
    } catch (error) {
      showError("Failed to load minutes");
      console.error("Error loading MoM:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!meetingId || !editor) return;

    try {
      setSaving(true);
      const content = editor.document;
      await momAPI.save(meetingId, { content: JSON.stringify(content) });
      showSuccess("Minutes saved successfully");

      if (onContentUpdate) {
        onContentUpdate();
      }
    } catch (error) {
      showError("Failed to save minutes");
      console.error("Error saving:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mom-loading">
        <LoadingSpinner message="Loading..." />
      </div>
    );
  }

  return (
    <div className="minutes-of-meeting">
      <div className="mom-header">
        <h3>Minutes of Meeting</h3>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          <SaveIcon />
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      <div 
        className="mom-editor-container" 
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
    </div>
  );
};

export default MinutesOfMeeting;
