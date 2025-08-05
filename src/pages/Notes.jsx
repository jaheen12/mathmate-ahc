import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import NoteList from '../components/NoteList';
import NoteEditor from '../components/NoteEditor';

// --- FIX: The Correct Way to Initialize State from Local Storage ---
// We create a function that will be run ONLY ONCE when the component first mounts.
const getInitialNotes = () => {
  const storedNotes = localStorage.getItem('mathmate-notes');
  // If there are stored notes, parse them and return them.
  // Otherwise, return an empty array.
  return storedNotes ? JSON.parse(storedNotes) : [];
};

function Notes() {
  // --- STATE MANAGEMENT ---
  // Call our new function to set the initial state.
  const [notes, setNotes] = useState(getInitialNotes);
  const [selectedNoteId, setSelectedNoteId] = useState(null);

  // --- LOCAL STORAGE LOGIC ---
  // This useEffect is now ONLY for SAVING.
  // It will run whenever the 'notes' state changes.
  useEffect(() => {
    localStorage.setItem('mathmate-notes', JSON.stringify(notes));
  }, [notes]);
  // We no longer need the useEffect for loading because it's handled above.

  // --- HANDLER FUNCTIONS (These are all correct and unchanged) ---
  const handleCreateNewNote = () => {
    const newNote = {
      id: uuidv4(),
      title: 'New Note',
      content: '',
    };
    setNotes([newNote, ...notes]);
    setSelectedNoteId(newNote.id);
  };

  const handleSelectNote = (id) => {
    setSelectedNoteId(id);
  };

  const handleSaveNote = (id, title, content) => {
    const updatedNotes = notes.map(note =>
      note.id === id ? { ...note, title, content } : note
    );
    setNotes(updatedNotes);
    setSelectedNoteId(null);
  };

  const handleBack = () => {
    setSelectedNoteId(null);
  };

  const selectedNote = notes.find(note => note.id === selectedNoteId);

  // --- RENDER LOGIC (Unchanged) ---
  return (
    <div className="page-container">
      <h1 className="page-title">Personal Notes</h1>
      
      {selectedNote ? (
        <NoteEditor 
          note={selectedNote} 
          onSave={handleSaveNote} 
          onBack={handleBack} 
        />
      ) : (
        <NoteList 
          notes={notes} 
          onSelectNote={handleSelectNote} 
          onCreateNew={handleCreateNewNote} 
        />
      )}
    </div>
  );
}

export default Notes;