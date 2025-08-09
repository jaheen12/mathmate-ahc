import React, { useState, useEffect } from 'react';
import NoteList from '../components/NoteList';
import NoteEditor from '../components/NoteEditor';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

function OfficialNotes() {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);
  const { currentUser } = useAuth();

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const notesCollectionRef = collection(db, 'official_notes');
      const q = query(notesCollectionRef, orderBy('createdAt', 'desc'));
      const notesSnapshot = await getDocs(q);
      const notesData = notesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotes(notesData);
    } catch (error) {
      console.error("Error fetching official notes: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleCreateNew = () => {
    setSelectedNote({ id: null, title: 'New Official Note', content: '' });
  };

  const handleEdit = (noteId) => {
    const noteToEdit = notes.find(n => n.id === noteId);
    setSelectedNote(noteToEdit);
  };

  const handleDelete = (noteId) => {
    const noteToDelete = notes.find(note => note.id === noteId);
    MySwal.fire({
      title: 'Are you sure?',
      text: `You are about to permanently delete the official note: "${noteToDelete.title}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteDoc(doc(db, 'official_notes', noteId));
          Swal.fire('Deleted!', 'The official note has been deleted.', 'success');
          fetchNotes();
        } catch (error) {
          Swal.fire('Error!', 'Could not delete the note. ' + error.message, 'error');
        }
      }
    });
  };

  const handleSave = async (noteId, title, content) => {
    if (!title || !content) {
      return Swal.fire('Error', 'Title and content cannot be empty.', 'error');
    }
    
    try {
      if (noteId) {
        const noteRef = doc(db, 'official_notes', noteId);
        await updateDoc(noteRef, { title, content });
      } else {
        await addDoc(collection(db, 'official_notes'), {
          title,
          content,
          createdAt: serverTimestamp()
        });
      }
      Swal.fire('Saved!', 'The official note has been saved.', 'success');
      setSelectedNote(null);
      fetchNotes();
    } catch (error) {
      Swal.fire('Error!', 'Could not save the note. ' + error.message, 'error');
    }
  };

  const handleBack = () => {
    setSelectedNote(null);
  };

  if (isLoading) {
    return <div className="page-container"><p>Loading official notes...</p></div>;
  }

  if (selectedNote) {
    return <NoteEditor note={selectedNote} onSave={handleSave} onBack={handleBack} />;
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Official Notes</h1>
      <NoteList 
        notes={notes} 
        onSelectNote={() => {}}
        // --- THIS IS THE CORRECTED SECTION ---
        onEdit={currentUser ? handleEdit : null}
        onDelete={currentUser ? handleDelete : null}
        onCreateNew={handleCreateNew}
        emptyMessage="There are no official notes available yet."
        showCreateButton={!!currentUser}
        // ------------------------------------
      />
    </div>
  );
}

export default OfficialNotes;