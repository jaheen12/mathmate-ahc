import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit } from 'lucide-react';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

const MySwal = withReactContent(Swal);

// --- NEW: A component to safely render mixed HTML and KaTeX content ---
const HtmlMathRenderer = ({ content }) => {
  if (!content) return null;

  // Split the content by the KaTeX block delimiters $$...$$
  // Using a regex to capture single backslashes correctly
  const parts = content.split(/\$\$(.*?)\$\$/gs);

  return (
    <div>
      {parts.map((part, index) => {
        if (index % 2 === 1) {
          // This is a math part (inside $$...$$)
          return <BlockMath key={index} math={part.replace(/\\/g, '\\\\')} />;
        } else {
          // This is a regular HTML/text part. It might contain inline math.
          // Let's also handle inline math like \(...\)
          const inlineParts = part.split(/\\\\\((.*?)\\\\\)/gs);
          return (
            <div key={index} style={{display: "inline"}}>
              {inlineParts.map((inlinePart, inlineIndex) => {
                 if (inlineIndex % 2 === 1) {
                    // This is inline math
                    return <InlineMath key={inlineIndex} math={inlinePart.replace(/\\/g, '\\\\')} />;
                 } else {
                    // This is regular HTML. Be careful with this.
                    return <div key={inlineIndex} dangerouslySetInnerHTML={{ __html: inlinePart }} />;
                 }
              })}
            </div>
          )
        }
      })}
    </div>
  );
};


function NoteViewer() {
    const { subjectId, chapterId, noteId } = useParams();
    const navigate = useNavigate();
    const NOTE_CACHE_KEY = `mathmate-cache-note-item-${noteId}`;
    
    const [note, setNote] = useState(() => JSON.parse(localStorage.getItem(NOTE_CACHE_KEY)) || null);
    const [isLoading, setIsLoading] = useState(!note);
    const { currentUser } = useAuth();
    
    useEffect(() => {
        const fetchNote = async () => {
            if (!subjectId || !chapterId || !noteId) return;
            try {
                const noteRef = doc(db, `official_notes/${subjectId}/chapters/${chapterId}/notes`, noteId);
                const noteSnap = await getDoc(noteRef);
                if (noteSnap.exists()) {
                    const freshNote = { id: noteSnap.id, ...noteSnap.data() };
                    setNote(freshNote);
                    localStorage.setItem(NOTE_CACHE_KEY, JSON.stringify(freshNote));
                } else {
                    console.log("Note not found in Firestore!");
                }
            } catch (error) {
                console.error("Error fetching note (might be offline):", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (navigator.onLine) {
            fetchNote();
        } else {
            setIsLoading(false);
        }
    }, [subjectId, chapterId, noteId]);

    const handleEditNote = () => {
        MySwal.fire({
          title: 'Edit Note',
          html: `
            <input id="swal-title" class="swal2-input" placeholder="Note Title" value="${note && note.title ? note.title : ''}">
            <input id="swal-topic" class="swal2-input" placeholder="Topic" value="${note && note.topic ? note.topic : ''}">
            <label for="swal-date" style="display: block; text-align: left; margin: 1em 0 0.5em;">Note Date</label>
            <input type="date" id="swal-date" class="swal2-input" value="${note && note.noteDate ? note.noteDate : ''}">
            <textarea id="swal-content" class="swal2-textarea" placeholder="Note content...">${note && note.content ? note.content : ''}</textarea>
          `,
          confirmButtonText: 'Save Changes', showCancelButton: true,
          preConfirm: () => {
            const title = document.getElementById('swal-title').value;
            if (!title) { Swal.showValidationMessage('Title is required'); }
            return {
              title,
              topic: document.getElementById('swal-topic').value,
              noteDate: document.getElementById('swal-date').value,
              content: document.getElementById('swal-content').value,
            };
          }
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              const noteRef = doc(db, `official_notes/${subjectId}/chapters/${chapterId}/notes`, note.id);
              await updateDoc(noteRef, result.value);
              Swal.fire('Saved!', 'The note has been updated.', 'success');
              
              // Re-fetch the note to show updated content
              const updatedNoteSnap = await getDoc(noteRef);
              if(updatedNoteSnap.exists()){
                  const updatedNote = { id: updatedNoteSnap.id, ...updatedNoteSnap.data() };
                  setNote(updatedNote);
                  localStorage.setItem(NOTE_CACHE_KEY, JSON.stringify(updatedNote));
              }
            } catch(error) {
              Swal.fire('Error!', 'Could not save the note: ' + error.message, 'error');
            }
          }
        });
    };

    if (isLoading) {
        return <div className="page-container"><p>Loading note...</p></div>;
    }

    if (!note) {
        return (
            <div className="page-container">
                <button onClick={() => navigate(-1)} className="back-button-page"><ArrowLeft /></button>
                <p>Note not found. It might have been deleted or you are offline.</p>
            </div>
        );
    }

    return (
        <div className="note-viewer-fullscreen">
            <header className="viewer-header">
                <button onClick={() => navigate(-1)} className="back-button-viewer"><ArrowLeft /></button>
                <div className="viewer-title-container">
                    <h1 className="viewer-title">{note.title}</h1>
                    <p className="viewer-subtitle">Topic: {note.topic || 'N/A'} | Date: {note.noteDate || 'N/A'}</p>
                </div>
                {currentUser ? (
                    <button onClick={handleEditNote} className="edit-button-viewer"><Edit /></button>
                ) : (
                    <div style={{width: '40px'}}></div>
                )}
            </header>
            <div className="viewer-content">
                <HtmlMathRenderer content={note.content} />
            </div>
        </div>
    );
}

export default NoteViewer;