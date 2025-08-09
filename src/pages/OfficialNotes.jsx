import React, { useState, useEffect } from 'react';
import NoteList from '../components/NoteList'; // We can reuse the NoteList component!
import { db } from '../firebaseConfig';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

function OfficialNotes() {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      setIsLoading(true);
      try {
        // We will store official notes in a collection named 'official_notes'
        // and order them by the date they were created
        const notesCollectionRef = collection(db, 'official_notes');
        const q = query(notesCollectionRef, orderBy('createdAt', 'desc'));
        const notesSnapshot = await getDocs(q);
        
        const notesData = notesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setNotes(notesData);
      } catch (error) {
        console.error("Error fetching official notes: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotes();
  }, []);

  // For now, selecting a note will just log it. We will build the editor later.
  const handleSelectNote = (id) => {
    const note = notes.find(n => n.id === id);
    alert(`Title: ${note.title}\n\n${note.content}`);
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Official Notes</h1>
      {isLoading ? (
        <p>Loading official notes...</p>
      ) : (
        // We pass placeholder functions for now. The admin buttons will be added later.
       // ... inside the return statement of OfficialNotes.jsx
<NoteList 
  notes={notes} 
  onSelectNote={handleSelectNote} 
  onCreateNew={() => {}}
  // --- ADD THESE TWO LINES ---
  emptyMessage="There are no official notes available yet."
  showCreateButton={false} // This hides the button
  // -------------------------
/>
      )}
    </div>
  );
}

export default OfficialNotes;