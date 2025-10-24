import React, { useState, useMemo } from "react";
import {
  Person as PersonIcon,
  AccessTime as TimeIcon,
  PlayArrow as PlayIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Group as GroupIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
import "./TranscriptDisplay.css";

const TranscriptDisplay = ({ transcript, rawTranscript }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpeaker, setSelectedSpeaker] = useState("all");
  const [isExpanded, setIsExpanded] = useState(true);
  const [showRawData, setShowRawData] = useState(false);

  // Parse transcript data
  const transcriptData = useMemo(() => {
    if (!transcript) return null;
    
    try {
      return typeof transcript === "string" ? JSON.parse(transcript) : transcript;
    } catch (error) {
      console.error("Error parsing transcript:", error);
      return null;
    }
  }, [transcript]);

  // Format time in seconds to readable format
  const formatTime = (seconds) => {
    if (typeof seconds !== "number") return "00:00";
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Filter transcript cues based on search and speaker
  const filteredCues = useMemo(() => {
    if (!transcriptData?.transcript_cues) return [];
    
    return transcriptData.transcript_cues.filter((cue) => {
      const matchesSearch = !searchTerm || 
        cue.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cue.speaker_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSpeaker = selectedSpeaker === "all" || 
        cue.speaker_name === selectedSpeaker;
      
      return matchesSearch && matchesSpeaker;
    });
  }, [transcriptData, searchTerm, selectedSpeaker]);

  // Handle error cases
  if (!transcript) {
    return (
      <div className="transcript-display">
        <div className="transcript-header">
          <h3>Meeting Transcript</h3>
        </div>
        <div className="transcript-empty">
          <PersonIcon className="empty-icon" />
          <p>No transcript available for this meeting.</p>
        </div>
      </div>
    );
  }

  // Handle parsing errors
  if (!transcriptData) {
    return (
      <div className="transcript-display">
        <div className="transcript-header">
          <h3>Meeting Transcript</h3>
          <button 
            className="raw-toggle-btn"
            onClick={() => setShowRawData(!showRawData)}
          >
            {showRawData ? "Show Formatted" : "Show Raw Data"}
          </button>
        </div>
        {showRawData ? (
          <div className="transcript-raw">
            <pre>{transcript}</pre>
          </div>
        ) : (
          <div className="transcript-error">
            <p>Unable to parse transcript data. Click "Show Raw Data" to view the original content.</p>
          </div>
        )}
      </div>
    );
  }

  // Handle error in transcript data
  if (transcriptData.error) {
    return (
      <div className="transcript-display">
        <div className="transcript-header">
          <h3>Meeting Transcript</h3>
        </div>
        <div className="transcript-error">
          <p><strong>Error:</strong> {transcriptData.error}</p>
          {rawTranscript && (
            <button 
              className="raw-toggle-btn"
              onClick={() => setShowRawData(!showRawData)}
            >
              {showRawData ? "Hide Raw Data" : "Show Raw Data"}
            </button>
          )}
          {showRawData && rawTranscript && (
            <div className="transcript-raw">
              <pre>{rawTranscript}</pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="transcript-display">
      <div className="transcript-header">
        <div className="transcript-title">
          <h3>Meeting Transcript</h3>
          <button 
            className="expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </button>
        </div>
        
        {isExpanded && (
          <div className="transcript-controls">
            <div className="search-box">
              <SearchIcon className="search-icon" />
              <input
                type="text"
                placeholder="Search transcript..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="speaker-filter">
              <FilterIcon className="filter-icon" />
              <select
                value={selectedSpeaker}
                onChange={(e) => setSelectedSpeaker(e.target.value)}
                className="speaker-select"
              >
                <option value="all">All Speakers</option>
                {transcriptData.unique_speakers?.map((speaker) => (
                  <option key={speaker} value={speaker}>
                    {speaker}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="transcript-content">
          {/* Meeting Summary */}
          {transcriptData.host && (
            <div className="transcript-summary">
              <div className="summary-item">
                <PersonIcon className="summary-icon" />
                <div className="summary-content">
                  <label>Host</label>
                  <span>{transcriptData.host.email || "Unknown"}</span>
                </div>
              </div>
              
              {transcriptData.host.call_title && (
                <div className="summary-item">
                  <ScheduleIcon className="summary-icon" />
                  <div className="summary-content">
                    <label>Meeting Title</label>
                    <span>{transcriptData.host.call_title}</span>
                  </div>
                </div>
              )}
              
              {transcriptData.host.duration_minutes && (
                <div className="summary-item">
                  <TimeIcon className="summary-icon" />
                  <div className="summary-content">
                    <label>Duration</label>
                    <span>{transcriptData.host.duration_minutes} minutes</span>
                  </div>
                </div>
              )}
              
              {transcriptData.unique_speakers && (
                <div className="summary-item">
                  <GroupIcon className="summary-icon" />
                  <div className="summary-content">
                    <label>Participants</label>
                    <span>{transcriptData.unique_speakers.length} speakers</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Transcript Cues */}
          <div className="transcript-cues">
            {filteredCues.length === 0 ? (
              <div className="no-results">
                <SearchIcon className="no-results-icon" />
                <p>
                  {searchTerm || selectedSpeaker !== "all" 
                    ? "No transcript entries match your search criteria."
                    : "No transcript entries available."
                  }
                </p>
              </div>
            ) : (
              filteredCues.map((cue, index) => (
                <div key={cue.id || index} className="transcript-cue">
                  <div className="cue-header">
                    <div className="speaker-info">
                      <div className={`speaker-avatar ${cue.is_host ? 'host' : 'participant'}`}>
                        {cue.speaker_name?.charAt(0) || "?"}
                      </div>
                      <div className="speaker-details">
                        <span className="speaker-name">
                          {cue.speaker_name || "Unknown Speaker"}
                          {cue.is_host && <span className="host-badge">Host</span>}
                        </span>
                        <span className="cue-time">
                          <TimeIcon className="time-icon" />
                          {formatTime(cue.start_time)} - {formatTime(cue.end_time)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="cue-content">
                    <p>{cue.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Metadata */}
          {transcriptData.metadata && (
            <div className="transcript-metadata">
              <h4>Transcript Information</h4>
              <div className="metadata-grid">
                <div className="metadata-item">
                  <label>Total Entries</label>
                  <span>{transcriptData.metadata.total_cues || 0}</span>
                </div>
                <div className="metadata-item">
                  <label>Speakers</label>
                  <span>{transcriptData.metadata.total_speakers || 0}</span>
                </div>
                {transcriptData.metadata.parsed_at && (
                  <div className="metadata-item">
                    <label>Processed</label>
                    <span>{new Date(transcriptData.metadata.parsed_at).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Debug Options */}
          {(rawTranscript || transcript) && (
            <div className="transcript-debug">
              <button 
                className="raw-toggle-btn"
                onClick={() => setShowRawData(!showRawData)}
              >
                {showRawData ? "Hide Raw Data" : "Show Raw Data"}
              </button>
              
              {showRawData && (
                <div className="transcript-raw">
                  <h4>Raw Transcript Data</h4>
                  <pre>{rawTranscript || JSON.stringify(transcriptData, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TranscriptDisplay;