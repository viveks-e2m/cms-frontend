import { useState, useEffect } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { Save as SaveIcon, AutoAwesome as GenerateIcon } from "@mui/icons-material";
import { momAPI } from "../../../utils/apiServices";
import { useNotificationContext } from "../../../contexts/NotificationContext";
import LoadingSpinner from "../../UI/LoadingSpinner/LoadingSpinner";
import "./MinutesOfMeeting.css";

const normalizeGeneratedMarkdown = (markdown) => {
  if (!markdown) return markdown;

  let formatted = markdown;

  // Convert escaped newline/tab sequences into actual whitespace
  formatted = formatted
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t");

  // Put content on a new line after headings with colon labels (e.g. "Attendees:")
  formatted = formatted.replace(
    /(^\s*[A-Za-z][^:\n]{2,80}:)\s*(?=\S)/gm,
    "$1\n"
  );

  // Convert "•" bullets into markdown list items
  formatted = formatted.replace(/^\s*•\s+/gm, "- ");

  // Ensure there's a blank line before bullet lists when they follow text
  formatted = formatted.replace(/([^\n])\n(-\s+)/g, "$1\n\n$2");

  // Ensure any inline bullet sections start on a new line
  formatted = formatted.replace(
    /(^\s*[A-Za-z][^•\n]{2,120})\s+•\s+/gm,
    (_, title) => `${title.trim()}\n• `
  );

  // Special-case "Meeting Overview" (common top-level heading)
  formatted = formatted.replace(/(Meeting Overview)\s+/gi, "$1\n");

  // Collapse excessive blank lines
  formatted = formatted.replace(/\n{3,}/g, "\n\n");

  return formatted;
};

const MinutesOfMeeting = ({ meetingId, onContentUpdate }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
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

  const handleGenerate = async () => {
    if (!meetingId || !editor) return;

    try {
      setGenerating(true);
      const result = await momAPI.generateFromTranscript(meetingId);
      
      // The API response structure is: { success: true, data: { generated_content: [...], ... } }
      const responseData = result?.data || result;
      
      if (responseData) {
        let generatedBlocks = null;

        if (
          Array.isArray(responseData.generated_content) &&
          responseData.generated_content.length > 0
        ) {
          generatedBlocks = responseData.generated_content;
        } else if (responseData.raw_text || responseData.generated_markdown) {
          const markdown =
            responseData.raw_text || responseData.generated_markdown;
          const normalizedMarkdown = normalizeGeneratedMarkdown(markdown);
          try {
            const parsedBlocks =
              editor.tryParseMarkdownToBlocks(normalizedMarkdown);
            if (parsedBlocks && parsedBlocks.length > 0) {
              generatedBlocks = parsedBlocks;
            } else if (normalizedMarkdown?.trim()) {
              generatedBlocks = [
                {
                  type: "paragraph",
                  content: normalizedMarkdown.trim(),
                },
              ];
            }
          } catch (parseErr) {
            console.error("Failed to parse markdown into BlockNote format:", parseErr);
            showError("Unable to parse generated Markdown content.");
          }
        }

        if (generatedBlocks && generatedBlocks.length > 0) {
          await editor.replaceBlocks(editor.document, generatedBlocks);
          showSuccess("MoM generated successfully from transcript");

          // Auto-save the generated content
          await momAPI.save(meetingId, {
            content: JSON.stringify(generatedBlocks),
          });

          if (onContentUpdate) {
            onContentUpdate();
          }
        } else {
          showError(
            responseData?.error?.message ||
              "Generated content is empty or invalid. Please verify the transcript."
          );
        }
      } else {
        showError(
          responseData?.error?.message ||
            "Failed to generate MoM. Please check if transcript is available."
        );
      }
    } catch (error) {
      showError(error?.message || "Failed to generate MoM from transcript");
      console.error("Error generating MoM:", error);
    } finally {
      setGenerating(false);
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
        <div className="mom-actions">
          <button
            className="btn btn-secondary"
            onClick={handleGenerate}
            disabled={generating || saving}
            title="Generate MoM from transcript"
          >
            <GenerateIcon />
            {generating ? "Generating..." : "Generate from Transcript"}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || generating}
          >
            <SaveIcon />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
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
