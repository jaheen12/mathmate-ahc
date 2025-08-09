import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import NoteList from '../components/NoteList';
import NoteEditor from '../components/NoteEditor';
import Swal from 'sweetalert2'; // We need Swal for the confirmation
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const getInitialNotes = () => {
  const storedNotes = localStorage.getItem('mathmate-notes');
  return storedNotes ? JSON.parse(storedNotes) : [];
};

function PersonalNotes() {
  const [notes, setNotes] = useState(getInitialNotes);
  const [selectedNoteId, setSelectedNoteId] = useState(null);

  useEffect(() => {
    localStorage.setItem('mathmate-notes', JSON.stringify(notes));
  }, [notes]);

  const handleCreateNewNote = () => {
    const newNote = { id: uuidv4(), title: 'New Note', content: '' };
    setNotes([newNote, ...notes]);
    setSelectedNoteId(newNote.id);
  };

  // The 'Edit' button will just use this function to open the editor
  const handleSelectNote = (id) => {
    setSelectedNoteId(id);
  };

  // --- NEW DELETE LOGIC ---
  const handleDeleteNote = (id) => {
    const noteToDelete = notes.find(note => note.id === id);
    MySwal.fire({
      title: 'Are you sure?',
      text: `You are about to delete "${noteToDelete.title}". You won't be able to revert this!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedNotes = notes.filter(note => note.id !== id);
        setNotes(updatedNotes);
        Swal.fire('Deleted!', 'Your note has been deleted.', 'success');
      }
    });
  };
  // -------------------------

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

  return (
    <div className="page-container">
      <h1 className="page-title">Personal Notes</h1>
      
      {selectedNote ? (
        <NoteEditor note={selectedNote} onSave={handleSaveNote} onBack={handleBack} />
      ) : (
        <NoteList 
          notes={notes} 
          onSelectNote={handleSelectNote} // This is used by the row click
          onCreateNew={handleCreateNewNote}
          onEdit={handleSelectNote} // The Edit button also uses this
          onDelete={handleDeleteNote} // Connect the delete function
          emptyMessage="You have no personal notes yet."
          showCreateButton={true}
        />
      )}
    </div>
  );
}

export default PersonalNotes;