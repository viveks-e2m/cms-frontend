import React, { useState, useEffect } from 'react';
import {
  Add as AddIcon,
  Notes as NotesIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { meetingAPI } from '../../../utils/apiServices';
import { useNotificationContext } from '../../../contexts/NotificationContext';
import LoadingSpinner from '../../UI/LoadingSpinner/LoadingSpinner';
import './MeetingNotes.css';

const MeetingNotes = ({ meetingId, onNotesUpdate }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [newNote, setNewNote] = useState({ note: '' });
  const [editNote, setEditNote] = useState({ note: '' });
  const { showError, showSuccess } = useNotificationContext();

  useEffect(() => {
    if (meetingId) {
      loadNotes();
    }
  }, [meetingId]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const notesData = await meetingAPI.getNotes(meetingId);
      setNotes(notesData || []);
    } catch (error) {
      showError('Failed to load meeting notes');
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.note.trim()) {
      showError('Please provide note content');
      return;
    }

    try {
      await meetingAPI.addNote(meetingId, {
        note: newNote.note.trim()
      });
      
      showSuccess('Note added successfully');
      setNewNote({ note: '' });
      setIsAddingNote(false);
      loadNotes();
      
      if (onNotesUpdate) {
        onNotesUpdate();
      }
    } catch (error) {
      showError('Failed to add note');
      console.error('Error adding note:', error);
    }
  };

  const handleEditNote = async (noteId) => {
    showError('Note editing is not available in the current backend implementation');
    setEditingNoteId(null);
    setEditNote({ note: '' });
  };

  const handleDeleteNote = async (noteId) => {
    showError('Note deletion is not available in the current backend implementation');
  };

  const startEditing = (note) => {
    showError('Note editing is not available in the current backend implementation');
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditNote({ note: '' });
  };

  const cancelAdding = () => {
    setIsAddingNote(false);
    setNewNote({ note: '' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="meeting-notes-loading">
        <LoadingSpinner message="Loading notes..." />
      </div>
    );
  }

  return (
    <div className="meeting-notes">
      <div className="meeting-notes-header">
        <h3>Meeting Notes</h3>
        <button 
          className="btn btn-primary"
          onClick={() => setIsAddingNote(true)}
          disabled={isAddingNote}
        >
          <AddIcon />
          Add Note
        </button>
      </div>

      <div className="meeting-notes-content">
        {isAddingNote && (
          <div className="note-form">
            <div className="note-form-header">
              <h4>Add New Note</h4>
            </div>
            <div className="note-form-body">
              <textarea
                placeholder="Write your note here..."
                value={newNote.note}
                onChange={(e) => setNewNote({ ...newNote, note: e.target.value })}
                className="note-content-input"
                rows={6}
              />
            </div>
            <div className="note-form-actions">
              <button 
                className="btn btn-primary"
                onClick={handleAddNote}
              >
                <SaveIcon />
                Save Note
              </button>
              <button 
                className="btn btn-secondary"
                onClick={cancelAdding}
              >
                <CancelIcon />
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="notes-list">
          {notes.length > 0 ? (
            notes.map((note) => (
              <div key={note.id} className="note-item">
                <div className="note-header">
                  <div className="note-title-section">
                    <NotesIcon className="note-icon" />
                    <h4 className="note-title">Note #{note.id?.slice(-8) || 'Unknown'}</h4>
                  </div>
                </div>
                
                <div className="note-content">
                  <p>{note.note}</p>
                </div>
                
                <div className="note-meta">
                  <div className="note-author">
                    <PersonIcon className="meta-icon" />
                    <span>{note.created_by || 'Unknown'}</span>
                  </div>
                  <div className="note-date">
                    <TimeIcon className="meta-icon" />
                    <span>{formatDate(note.created_at)}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-notes-state">
              <NotesIcon className="empty-icon" />
              <h4>No notes yet</h4>
              <p>Add notes to keep track of important points from this meeting.</p>
              {!isAddingNote && (
                <button 
                  className="btn btn-primary"
                  onClick={() => setIsAddingNote(true)}
                >
                  <AddIcon />
                  Add First Note
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetingNotes;