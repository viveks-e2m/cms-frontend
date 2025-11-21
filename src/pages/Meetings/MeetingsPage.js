import React, { useEffect, useMemo, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "../../components/Layout/DashboardLayout/DashboardLayout";
import { PermissionGuard } from "../../components/PermissionGuard";
import { PERMISSIONS } from "../../constants/permissions";
import { useMeetingsDirectory, useMeetingTranscript } from "../../hooks/useQueries";
import useDebounce from "../../hooks/useDebounce";
import MarkdownSummary from "../../components/Meetings/MarkdownSummary/MarkdownSummary";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CalendarToday as CalendarIcon,
  Business as BusinessIcon,
  PlayCircleOutline as PlayIcon,
  Description as DescriptionIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  RecordVoiceOver as TranscriptIcon,
  AccessTime as TimeIcon,
} from "@mui/icons-material";
import "../../styles/pages.css";
import "./MeetingsPage.css";

const PAGE_SIZE = 10;

const formatDateTime = (value) => {
  if (!value) {
    return "Not available";
  }
  try {
    return new Date(value).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (err) {
    return value;
  }
};

const highlightText = (text = "", term = "") => {
  if (!term.trim() || !text) {
    return text;
  }
  const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escapedTerm})`, "ig"));
  return parts.map((part, index) =>
    part.toLowerCase() === term.toLowerCase() ? (
      <mark key={`${part}-${index}`}>{part}</mark>
    ) : (
      <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
    )
  );
};

// Helper function to create a text component that highlights search terms for ReactMarkdown
const createHighlightedTextComponent = (searchTerm) => {
  if (!searchTerm || !searchTerm.trim()) {
    return undefined; // Return undefined to use default text component
  }
  
  const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedTerm})`, "gi");
  
  // ReactMarkdown's text component receives the text as children prop
  return ({ children }) => {
    // Handle string children (most common case)
    if (typeof children === "string") {
      const parts = children.split(regex);
      return (
        <>
          {parts.map((part, index) => {
            const testRegex = new RegExp(`^${escapedTerm}$`, "i");
            return testRegex.test(part) ? (
              <mark key={`highlight-${index}`}>{part}</mark>
            ) : (
              <React.Fragment key={`text-${index}`}>{part}</React.Fragment>
            );
          })}
        </>
      );
    }
    
    // Handle number (ReactMarkdown sometimes passes numbers)
    if (typeof children === "number") {
      const text = String(children);
      const parts = text.split(regex);
      return (
        <>
          {parts.map((part, index) => {
            const testRegex = new RegExp(`^${escapedTerm}$`, "i");
            return testRegex.test(part) ? (
              <mark key={`highlight-${index}`}>{part}</mark>
            ) : (
              <React.Fragment key={`text-${index}`}>{part}</React.Fragment>
            );
          })}
        </>
      );
    }
    
    // For other types, return as-is
    return children;
  };
};

// Helper function to highlight plain text (for transcript display)
const highlightPlainText = (text = "", searchTerm = "") => {
  if (!searchTerm || !searchTerm.trim() || !text) {
    return text;
  }
  
  const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedTerm})`, "gi");
  const parts = text.split(regex);
  
  return parts.map((part, index) => {
    const testRegex = new RegExp(`^${escapedTerm}$`, "i");
    return testRegex.test(part) ? (
      <mark key={`transcript-highlight-${index}`}>{part}</mark>
    ) : (
      <React.Fragment key={`transcript-text-${index}`}>{part}</React.Fragment>
    );
  });
};

// Helper function to format time in seconds to MM:SS format
const formatTime = (seconds) => {
  if (typeof seconds !== "number" || isNaN(seconds)) return "00:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
};

// Helper function to extract matching transcript cues with timestamps
const extractMatchingTranscriptSnippets = (transcriptData, searchTerm = "", contextCues = 2) => {
  if (!searchTerm || !searchTerm.trim()) {
    return null; // Return null to show full transcript when no search
  }
  
  if (!transcriptData?.transcript_cues || !Array.isArray(transcriptData.transcript_cues)) {
    return null;
  }
  
  const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escapedTerm, "gi");
  
  // Find all matching cues
  const matchingCueIndices = [];
  transcriptData.transcript_cues.forEach((cue, index) => {
    if (cue.text && regex.test(cue.text)) {
      matchingCueIndices.push(index);
    }
  });
  
  if (matchingCueIndices.length === 0) {
    return null;
  }
  
  // Create snippets with context cues around each match
  const snippets = matchingCueIndices.map((matchIndex, snippetIndex) => {
    const startCueIndex = Math.max(0, matchIndex - contextCues);
    const endCueIndex = Math.min(
      transcriptData.transcript_cues.length - 1,
      matchIndex + contextCues
    );
    
    // Get the range of cues for this snippet
    const snippetCues = transcriptData.transcript_cues.slice(startCueIndex, endCueIndex + 1);
    
    // Combine text from all cues in the snippet
    const snippetText = snippetCues.map(cue => cue.text || "").join(" ");
    
    // Get timing information from the first matching cue
    const matchCue = transcriptData.transcript_cues[matchIndex];
    const startTime = snippetCues[0]?.start_time ?? matchCue?.start_time ?? 0;
    const endTime = snippetCues[snippetCues.length - 1]?.end_time ?? matchCue?.end_time ?? 0;
    const matchTime = matchCue?.start_time ?? 0;
    
    // Get speaker information
    const speakers = [...new Set(snippetCues.map(cue => cue.speaker_name).filter(Boolean))];
    const primarySpeaker = matchCue?.speaker_name || speakers[0] || "Unknown";
    
    return {
      text: snippetText,
      startTime,
      endTime,
      matchTime,
      speaker: primarySpeaker,
      speakers: speakers,
      isFirst: snippetIndex === 0,
      isLast: snippetIndex === matchingCueIndices.length - 1,
      snippetNumber: snippetIndex + 1,
      totalMatches: matchingCueIndices.length,
      cueIndices: snippetCues.map((_, idx) => startCueIndex + idx),
    };
  });
  
  // Merge snippets that are close together (within 3 cues)
  const mergedSnippets = [];
  let currentSnippet = snippets[0];
  
  for (let i = 1; i < snippets.length; i++) {
    const nextSnippet = snippets[i];
    const currentLastCueIndex = currentSnippet.cueIndices[currentSnippet.cueIndices.length - 1];
    const nextFirstCueIndex = nextSnippet.cueIndices[0];
    
    // If snippets are close (within 3 cues), merge them
    if (nextFirstCueIndex - currentLastCueIndex <= 3) {
      const mergedStartCueIndex = Math.min(
        currentSnippet.cueIndices[0],
        nextSnippet.cueIndices[0]
      );
      const mergedEndCueIndex = Math.max(
        currentSnippet.cueIndices[currentSnippet.cueIndices.length - 1],
        nextSnippet.cueIndices[nextSnippet.cueIndices.length - 1]
      );
      
      const mergedCues = transcriptData.transcript_cues.slice(
        mergedStartCueIndex,
        mergedEndCueIndex + 1
      );
      
      currentSnippet = {
        text: mergedCues.map(cue => cue.text || "").join(" "),
        startTime: mergedCues[0]?.start_time ?? currentSnippet.startTime,
        endTime: mergedCues[mergedCues.length - 1]?.end_time ?? nextSnippet.endTime,
        matchTime: currentSnippet.matchTime, // Keep first match time
        speaker: currentSnippet.speaker,
        speakers: [...new Set([...currentSnippet.speakers, ...nextSnippet.speakers])],
        isFirst: currentSnippet.isFirst,
        isLast: nextSnippet.isLast,
        snippetNumber: currentSnippet.snippetNumber,
        totalMatches: snippets.length,
        cueIndices: Array.from({ length: mergedEndCueIndex - mergedStartCueIndex + 1 }, (_, i) => mergedStartCueIndex + i),
      };
    } else {
      mergedSnippets.push(currentSnippet);
      currentSnippet = nextSnippet;
    }
  }
  mergedSnippets.push(currentSnippet);
  
  return mergedSnippets;
};

// Helper function to check if search term matches in text (case-insensitive)
const textContainsSearchTerm = (text = "", searchTerm = "") => {
  if (!searchTerm || !searchTerm.trim() || !text) {
    return false;
  }
  const normalizedText = String(text).toLowerCase();
  const normalizedSearch = searchTerm.trim().toLowerCase();
  return normalizedText.includes(normalizedSearch);
};

// Helper function to determine section order based on search matches
const getSectionOrder = (summary = "", transcriptText = "", searchTerm = "") => {
  if (!searchTerm || !searchTerm.trim()) {
    // Default order: summary first, then transcript
    return { summaryFirst: true, transcriptFirst: false };
  }
  
  const summaryMatches = textContainsSearchTerm(summary, searchTerm);
  const transcriptMatches = textContainsSearchTerm(transcriptText, searchTerm);
  
  if (transcriptMatches && !summaryMatches) {
    // Only transcript matches → transcript first
    return { summaryFirst: false, transcriptFirst: true };
  } else if (summaryMatches && !transcriptMatches) {
    // Only summary matches → summary first
    return { summaryFirst: true, transcriptFirst: false };
  } else if (summaryMatches && transcriptMatches) {
    // Both match → summary first, then transcript
    return { summaryFirst: true, transcriptFirst: false };
  } else {
    // Neither matches → default order (summary first)
    return { summaryFirst: true, transcriptFirst: false };
  }
};

const VALID_TIME_RANGES = new Set(["this_week", "last_week", "this_month", "last_month"]);

const TIME_RANGE_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "this_week", label: "This week" },
  { value: "last_week", label: "Last week" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
];

const MeetingsPage = () => {
  const [searchValue, setSearchValue] = useState("");
  const [selectedClient, setSelectedClient] = useState("all");
  const [offset, setOffset] = useState(0);
  const [activeMeetingId, setActiveMeetingId] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [timeRange, setTimeRange] = useState(() => {
    const param = searchParams.get("range");
    return param && VALID_TIME_RANGES.has(param) ? param : "all";
  });

  const debouncedSearch = useDebounce(searchValue, 400);

  useEffect(() => {
    const param = searchParams.get("range");
    const normalized = param && VALID_TIME_RANGES.has(param) ? param : "all";
    setTimeRange((prev) => (prev === normalized ? prev : normalized));
  }, [searchParams]);

  const updateRangeSearchParam = useCallback(
    (value) => {
      const nextParams = new URLSearchParams(searchParams);
      if (value === "all") {
        nextParams.delete("range");
      } else {
        nextParams.set("range", value);
      }
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  // Markdown components with search highlighting for list items
  const compactMarkdownComponents = useMemo(() => {
    const textComponent = createHighlightedTextComponent(debouncedSearch);
    
    const components = {
      h1: ({ children }) => <p className="meeting-explorer__row-text">{children}</p>,
      h2: ({ children }) => <p className="meeting-explorer__row-text">{children}</p>,
      h3: ({ children }) => <p className="meeting-explorer__row-text">{children}</p>,
      h4: ({ children }) => <p className="meeting-explorer__row-text">{children}</p>,
      h5: ({ children }) => <p className="meeting-explorer__row-text">{children}</p>,
      h6: ({ children }) => <p className="meeting-explorer__row-text">{children}</p>,
      p: ({ children }) => <p className="meeting-explorer__row-text">{children}</p>,
      ul: ({ children }) => (
        <ul className="meeting-explorer__row-list">{children}</ul>
      ),
      ol: ({ children }) => (
        <ol className="meeting-explorer__row-list meeting-explorer__row-list--ordered">
          {children}
        </ol>
      ),
      li: ({ children }) => <li className="meeting-explorer__row-list-item">{children}</li>,
      strong: ({ children }) => <strong>{children}</strong>,
      em: ({ children }) => <em>{children}</em>,
      blockquote: ({ children }) => (
        <blockquote className="meeting-explorer__row-quote">{children}</blockquote>
      ),
      code: ({ children }) => (
        <code className="meeting-explorer__row-code">{children}</code>
      ),
      a: ({ href, children }) => (
        <a
          href={href}
          className="meeting-explorer__row-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      ),
      hr: () => null,
    };
    
    // Add text component for highlighting if search term exists
    if (textComponent) {
      components.text = textComponent;
    }
    
    return components;
  }, [debouncedSearch]);

  // Markdown components with search highlighting for details panel
  const detailsMarkdownComponents = useMemo(() => {
    const textComponent = createHighlightedTextComponent(debouncedSearch);
    
    const components = {
      h1: ({ children }) => <h1 className="meeting-explorer__details-heading">{children}</h1>,
      h2: ({ children }) => <h2 className="meeting-explorer__details-heading">{children}</h2>,
      h3: ({ children }) => <h3 className="meeting-explorer__details-heading">{children}</h3>,
      h4: ({ children }) => <h4 className="meeting-explorer__details-heading">{children}</h4>,
      p: ({ children }) => <p className="meeting-explorer__details-text">{children}</p>,
      ul: ({ children }) => (
        <ul className="meeting-explorer__details-list">{children}</ul>
      ),
      ol: ({ children }) => (
        <ol className="meeting-explorer__details-list meeting-explorer__details-list--ordered">
          {children}
        </ol>
      ),
      li: ({ children }) => <li className="meeting-explorer__details-list-item">{children}</li>,
      strong: ({ children }) => <strong>{children}</strong>,
      em: ({ children }) => <em>{children}</em>,
      blockquote: ({ children }) => (
        <blockquote className="meeting-explorer__details-quote">{children}</blockquote>
      ),
      code: ({ children }) => (
        <code className="meeting-explorer__details-code">{children}</code>
      ),
      a: ({ href, children }) => (
        <a
          href={href}
          className="meeting-explorer__details-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      ),
    };
    
    // Add text component for highlighting if search term exists
    if (textComponent) {
      components.text = textComponent;
    }
    
    return components;
  }, [debouncedSearch]);

  const queryFilters = useMemo(() => {
    const filters = {
      limit: PAGE_SIZE,
      offset,
    };
    if (debouncedSearch) {
      filters.search = debouncedSearch;
    }
    if (selectedClient !== "all") {
      filters.client_id = selectedClient;
    }
    if (timeRange && timeRange !== "all") {
      filters.time_range = timeRange;
    }
    return filters;
  }, [debouncedSearch, offset, selectedClient, timeRange]);

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useMeetingsDirectory(queryFilters, { keepPreviousData: true });

  const meetings = data?.items ?? [];
  const pagination = data?.pagination ?? {};
  const clientDirectory = data?.clients ?? [];

  const clientOptions = useMemo(() => {
    const baseOptions = clientDirectory.map((client) => ({
      id: client.id,
      name: client.name || "Unnamed client",
    }));
    return [{ id: "all", name: "All clients" }, ...baseOptions];
  }, [clientDirectory]);

  useEffect(() => {
    if (meetings.length && !activeMeetingId) {
      setActiveMeetingId(meetings[0].id);
    }
  }, [meetings, activeMeetingId]);

  useEffect(() => {
    if (activeMeetingId && meetings.every((meeting) => meeting.id !== activeMeetingId)) {
      setActiveMeetingId(meetings[0]?.id || null);
    }
  }, [meetings, activeMeetingId]);

  const activeMeeting = meetings.find((meeting) => meeting.id === activeMeetingId) || null;

  // Fetch transcript when viewing meeting details
  const {
    data: transcriptData,
    isLoading: isLoadingTranscript,
  } = useMeetingTranscript(activeMeetingId, {
    enabled: Boolean(activeMeetingId && activeMeeting?.has_transcript),
  });

  const startIndex = meetings.length ? offset + 1 : 0;
  const endIndex = offset + meetings.length;
  const totalCount = pagination.total;

  const handleClientChange = (event) => {
    setSelectedClient(event.target.value);
    setOffset(0);
  };

  const handleSearchChange = (event) => {
    setSearchValue(event.target.value);
    setOffset(0);
  };

  const handleTimeRangeChange = (event) => {
    const value = event.target.value;
    setTimeRange(value);
    setOffset(0);
    updateRangeSearchParam(value);
  };

  const handleMeetingSelection = (meetingId) => {
    setActiveMeetingId(meetingId);
  };

  const handleNextPage = () => {
    if (pagination.has_more) {
      setOffset((prev) => prev + PAGE_SIZE);
    }
  };

  const handlePreviousPage = () => {
    if (offset > 0) {
      setOffset((prev) => Math.max(0, prev - PAGE_SIZE));
    }
  };

  const renderList = () => {
    if (isLoading) {
      return (
        <div className="meeting-explorer__list-empty">
          <div className="meeting-explorer__spinner" />
          <p>Loading meetings…</p>
        </div>
      );
    }

    if (!meetings.length) {
      return (
        <div className="meeting-explorer__list-empty">
          <DescriptionIcon />
          <h3>No meetings found</h3>
              <p>Try adjusting the search, client, or time filters.</p>
        </div>
      );
    }

    return (
      <ul className="meeting-explorer__results">
        {meetings.map((meeting) => (
          <li
            key={meeting.id}
            className={`meeting-explorer__row ${
              meeting.id === activeMeetingId ? "meeting-explorer__row--active" : ""
            }`}
            onClick={() => handleMeetingSelection(meeting.id)}
          >
            <div className="meeting-explorer__row-header">
              <div className="meeting-explorer__row-info">
                <p className="meeting-explorer__row-title">
                  {highlightText(
                    meeting.meeting_name ||
                      meeting.title ||
                      `Meeting #${meeting.id?.slice(-8) || "N/A"}`,
                    debouncedSearch
                  )}
                </p>
                <p className="meeting-explorer__row-client">
                  <BusinessIcon />
                  <span className="meeting-explorer__row-client-name">
                    {highlightText(meeting.client_name || "Unknown client", debouncedSearch)}
                  </span>
                </p>
              </div>
              <span className="meeting-explorer__row-date">
                <CalendarIcon /> {highlightText(formatDateTime(meeting.created_at), debouncedSearch)}
              </span>
            </div>
            {meeting.match_snippet && (
              <div className="meeting-explorer__row-markdown">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={compactMarkdownComponents}
                >
                  {meeting.match_snippet}
                </ReactMarkdown>
              </div>
            )}
            <div className="meeting-explorer__row-meta">
              <span className="meeting-explorer__chip meeting-explorer__chip--info">
                {meeting.source || "other"}
              </span>
              {meeting.has_transcript && (
                <span className="meeting-explorer__chip meeting-explorer__chip--success">
                  Transcript available
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    );
  };

  const renderDetails = () => {
    if (!activeMeeting) {
      return (
        <div className="meeting-explorer__details-empty">
          <PlayIcon />
          <h3>Select a meeting to view details</h3>
          <p>Use the list to the left to explore meetings you can access.</p>
        </div>
      );
    }

    return (
      <div className="meeting-explorer__details-card">
        <div className="meeting-explorer__details-header">
          <div>
            <h2>{highlightText(activeMeeting.meeting_name || "Untitled meeting", debouncedSearch)}</h2>
            <p>{highlightText(formatDateTime(activeMeeting.created_at), debouncedSearch)}</p>
          </div>
          <div className="meeting-explorer__details-badges">
            <span className="meeting-explorer__chip meeting-explorer__chip--info">
              {activeMeeting.source || "other"}
            </span>
            {activeMeeting.action_items_status && (
              <span
                className={`meeting-explorer__chip meeting-explorer__chip--${activeMeeting.action_items_status}`}
              >
                {activeMeeting.action_items_status.replace(/_/g, " ")}
              </span>
            )}
            {activeMeeting.has_transcript && (
              <span className="meeting-explorer__chip meeting-explorer__chip--success">
                Transcript
              </span>
            )}
          </div>
        </div>

        <div className="meeting-explorer__details-meta">
          <div className="meeting-explorer__meta-item">
            <BusinessIcon />
            <div>
              <p className="meeting-explorer__meta-label">Client</p>
              <p className="meeting-explorer__meta-value">
                {highlightText(activeMeeting.client_name || "Unknown client", debouncedSearch)}
              </p>
            </div>
          </div>
          <div className="meeting-explorer__meta-item">
            <CalendarIcon />
            <div>
              <p className="meeting-explorer__meta-label">Recorded</p>
              <p className="meeting-explorer__meta-value">
                {highlightText(formatDateTime(activeMeeting.created_at), debouncedSearch)}
              </p>
            </div>
          </div>
        </div>

        {activeMeeting.match_snippet && debouncedSearch && (
          <div className="meeting-explorer__panel meeting-explorer__panel-content">
            <p className="meeting-explorer__meta-label">
              Search match preview
              <span className="meeting-explorer__match-preview-hint">
                {" "}• Showing where "{debouncedSearch}" appears
              </span>
            </p>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={detailsMarkdownComponents}>
              {activeMeeting.match_snippet}
            </ReactMarkdown>
          </div>
        )}

        {(() => {
          // Parse transcript data
          let parsedTranscript = null;
          let transcriptText = "";
          
          if (transcriptData?.transcript && !isLoadingTranscript) {
            try {
              parsedTranscript = typeof transcriptData.transcript === "string" 
                ? JSON.parse(transcriptData.transcript) 
                : transcriptData.transcript;
              
              // Extract text for ordering logic
              if (parsedTranscript?.transcript_cues && Array.isArray(parsedTranscript.transcript_cues)) {
                transcriptText = parsedTranscript.transcript_cues
                  .map((cue) => cue.text || "")
                  .filter(Boolean)
                  .join(" ");
              } else if (typeof parsedTranscript === "string") {
                transcriptText = parsedTranscript;
              } else if (typeof transcriptData.transcript === "string") {
                transcriptText = transcriptData.transcript;
              }
            } catch (e) {
              // If parsing fails, use as plain text
              transcriptText = typeof transcriptData.transcript === "string" 
                ? transcriptData.transcript 
                : "";
            }
          }

          // Determine section order based on search matches
          const sectionOrder = getSectionOrder(
            activeMeeting.summary || "",
            transcriptText,
            debouncedSearch
          );

          // Render Summary Section
          const renderSummary = () => {
            if (!activeMeeting.summary) return null;
            return (
              <div className="meeting-explorer__panel meeting-explorer__panel-content">
                <MarkdownSummary summary={activeMeeting.summary} title="Summary" searchTerm={debouncedSearch} />
              </div>
            );
          };

          // Render Transcript Section
          const renderTranscript = () => {
            if (!activeMeeting.has_transcript) return null;
            
            // Extract matching snippets with timestamps if search is active and we have structured data
            const matchingSnippets = parsedTranscript?.transcript_cues 
              ? extractMatchingTranscriptSnippets(parsedTranscript, debouncedSearch)
              : null;
            const showSnippets = matchingSnippets && matchingSnippets.length > 0;
            
            return (
              <div className="meeting-explorer__panel meeting-explorer__panel-content">
                <div className="meeting-explorer__panel-header">
                  <TranscriptIcon />
                  <p className="meeting-explorer__meta-label">Transcript</p>
                  {showSnippets && (
                    <span className="meeting-explorer__transcript-match-count">
                      {matchingSnippets.length} match{matchingSnippets.length !== 1 ? 'es' : ''} found
                    </span>
                  )}
                </div>
                {isLoadingTranscript ? (
                  <div className="meeting-explorer__loading">
                    <p>Loading transcript...</p>
                  </div>
                ) : transcriptData?.transcript ? (
                  <div className="meeting-explorer__transcript-content">
                    {showSnippets ? (
                      <div className="meeting-explorer__transcript-snippets">
                        {matchingSnippets.map((snippet, index) => (
                          <div key={index} className="meeting-explorer__transcript-snippet">
                            <div className="meeting-explorer__transcript-snippet-header">
                              <div className="meeting-explorer__transcript-snippet-info">
                                <span className="meeting-explorer__transcript-snippet-number">
                                  Match {snippet.snippetNumber} of {snippet.totalMatches}
                                </span>
                                <span className="meeting-explorer__transcript-snippet-time">
                                  <TimeIcon className="meeting-explorer__time-icon" />
                                  {formatTime(snippet.matchTime)}
                                  {snippet.startTime !== snippet.endTime && (
                                    <span className="meeting-explorer__time-range">
                                      {" "}• {formatTime(snippet.startTime)} - {formatTime(snippet.endTime)}
                                    </span>
                                  )}
                                </span>
                              </div>
                              {snippet.speaker && (
                                <span className="meeting-explorer__transcript-snippet-speaker">
                                  {snippet.speaker}
                                </span>
                              )}
                            </div>
                            <div className="meeting-explorer__transcript-snippet-text">
                              {highlightPlainText(snippet.text, debouncedSearch)}
                            </div>
                            {!snippet.isLast && (
                              <div className="meeting-explorer__transcript-snippet-divider">
                                <span>...</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="meeting-explorer__transcript-full">
                        {parsedTranscript?.transcript_cues ? (
                          // Show structured transcript with timestamps
                          <div className="meeting-explorer__transcript-cues">
                            {parsedTranscript.transcript_cues.map((cue, index) => (
                              <div key={index} className="meeting-explorer__transcript-cue">
                                <div className="meeting-explorer__transcript-cue-header">
                                  {cue.speaker_name && (
                                    <span className="meeting-explorer__transcript-cue-speaker">
                                      {cue.speaker_name}
                                    </span>
                                  )}
                                  {(cue.start_time !== undefined || cue.end_time !== undefined) && (
                                    <span className="meeting-explorer__transcript-cue-time">
                                      <TimeIcon className="meeting-explorer__time-icon" />
                                      {cue.start_time !== undefined ? formatTime(cue.start_time) : "00:00"}
                                      {cue.end_time !== undefined && cue.start_time !== cue.end_time && (
                                        <span> - {formatTime(cue.end_time)}</span>
                                      )}
                                    </span>
                                  )}
                                </div>
                                <div className="meeting-explorer__transcript-cue-text">
                                  {highlightPlainText(cue.text || "", debouncedSearch)}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          // Fallback to plain text
                          <p className="meeting-explorer__transcript-text">
                            {highlightPlainText(transcriptText, debouncedSearch)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="meeting-explorer__transcript-empty">
                    <p>Transcript not available for this meeting.</p>
                  </div>
                )}
              </div>
            );
          };

          // Render sections in the determined order
          return (
            <>
              {sectionOrder.transcriptFirst ? (
                <>
                  {renderTranscript()}
                  {renderSummary()}
                </>
              ) : (
                <>
                  {renderSummary()}
                  {renderTranscript()}
                </>
              )}
            </>
          );
        })()}

        {activeMeeting.recording_url && (
          <a
            className="meeting-explorer__link"
            href={activeMeeting.recording_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <PlayIcon />
            {activeMeeting.source?.toLowerCase() === "fathom"
              ? "Open Fathom recording"
              : "Open recording"}
          </a>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <PermissionGuard
        permissions={[PERMISSIONS.READ_MEETING, PERMISSIONS.READ_ALL_MEETINGS]}
        fallback={
          <div className="page-container">
            <div className="access-denied-message">
              <p>You don't have permission to view meetings.</p>
            </div>
          </div>
        }
      >
        <div className="page-container meeting-explorer">
          <header className="meeting-explorer__header">
            <div>
              <h1>Meeting Explorer</h1>
              <p className="meeting-explorer__subtitle">
                Review transcripts, summaries context across your clients.
              </p>
            </div>
            <button
              className="meeting-explorer__refresh-btn"
              onClick={refetch}
              disabled={isFetching}
            >
              <RefreshIcon />
              Refresh
            </button>
          </header>

          <section className="meeting-explorer__toolbar">
            <div className="meeting-explorer__search">
              <SearchIcon />
              <input
                type="text"
                placeholder="Search meetings, transcripts"
                value={searchValue}
                onChange={handleSearchChange}
              />
            </div>
            <div className="meeting-explorer__client-filter">
              <select
                id="client-select"
                value={selectedClient}
                onChange={handleClientChange}
              >
                {clientOptions.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="meeting-explorer__client-filter">
              <select
                id="time-range-select"
                value={timeRange}
                onChange={handleTimeRangeChange}
              >
                {TIME_RANGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="meeting-explorer__content">
            <div className="meeting-explorer__list">
              {renderList()}

              {meetings.length > 0 && (
                <div className="meeting-explorer__pagination">
                  <button
                    className="meeting-explorer__pagination-btn"
                    onClick={handlePreviousPage}
                    disabled={offset === 0 || isFetching}
                  >
                    <ChevronLeftIcon /> Previous
                  </button>
                  <p>
                    Showing {startIndex}-{endIndex}
                    {typeof totalCount === "number" ? ` of ${totalCount}` : ""}
                  </p>
                  <button
                    className="meeting-explorer__pagination-btn"
                    onClick={handleNextPage}
                    disabled={!pagination.has_more || isFetching}
                  >
                    Next <ChevronRightIcon />
                  </button>
                </div>
              )}
            </div>

            <div className="meeting-explorer__details">{renderDetails()}</div>
          </section>
        </div>
      </PermissionGuard>
    </DashboardLayout>
  );
};

export default MeetingsPage;