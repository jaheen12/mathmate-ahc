import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

function NoteChapters() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const CHAPTERS_CACHE_KEY = `mathmate-cache-note-chapters-${subjectId}`;
  
  const [chapters, setChapters] = useState(() => JSON.parse(localStorage.getItem(CHAPTERS_CACHE_KEY)) || []);
  const [subjectName, setSubjectName] = useState(subjectId);
  const [isLoading, setIsLoading] = useState(chapters.length === 0);
  const { currentUser } = useAuth();

  const fetchChapters = async () => {
    if (!subjectId) return;
    try {
      const subjectRef = doc(db, 'official_notes', subjectId);
      const subjectSnap = await getDoc(subjectRef);
      if (subjectSnap.exists()) {
        setSubjectName(subjectSnap.data().name);
      }
      
      const chaptersRef = collection(db, `official_notes/${subjectId}/chapters`);
      const querySnapshot = await getDocs(chaptersRef);
      const freshChaps = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      })).sort((a,b) => a.name.localeCompare(b.name));
      
      if (JSON.stringify(freshChaps) !== JSON.stringify(chapters)) {
        setChapters(freshChaps);
        localStorage.setItem(CHAPTERS_CACHE_KEY, JSON.stringify(freshChaps));
      }
    } catch (error) {
      console.error("Error fetching chapters (might be offline): ", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(chapters.length === 0);
    if (navigator.onLine) {
      fetchChapters();
    } else {
      setIsLoading(false);
    }
  }, [subjectId]);
  
  const handleAddChapter = () => {
    MySwal.fire({
        title: 'Add New Chapter',
        input: 'text',
        inputPlaceholder: 'Enter chapter name',
        showCancelButton: true,
        confirmButtonText: 'Create'
    }).then(async (result) => {
        if(result.isConfirmed && result.value) {
            const chapterId = result.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            const chapterRef = doc(db, `official_notes/${subjectId}/chapters`, chapterId);
            await setDoc(chapterRef, { name: result.value });
            fetchChapters();
            Swal.fire('Created!', 'The new chapter has been added.', 'success');
        }
    });
  };
  
  const handleEditChapter = (chap) => {
    MySwal.fire({
        title: 'Rename Chapter',
        input: 'text',
        inputValue: chap.name,
        showCancelButton: true
    }).then(async (result) => {
        if(result.isConfirmed && result.value) {
            const chapterRef = doc(db, `official_notes/${subjectId}/chapters`, chap.id);
            await updateDoc(chapterRef, { name: result.value });
            fetchChapters();
            Swal.fire('Renamed!', 'The chapter name has been updated.', 'success');
        }
    });
  };

  const handleDeleteChapter = (chap) => {
    MySwal.fire({
      title: 'Are you sure?',
      text: `This will delete the chapter "${chap.name}" and ALL notes inside it.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
        if(result.isConfirmed) {
            const chapterRef = doc(db, `official_notes/${subjectId}/chapters`, chap.id);
            await deleteDoc(chapterRef);
            fetchChapters();
            Swal.fire('Deleted!', 'The chapter has been deleted.', 'success');
        }
    });
  };

  return (
    <div className="page-container">
      <div className="page-header-row">
        <button onClick={() => navigate(-1)} className="back-button-page"><ArrowLeft /></button>
        <h1 className="page-title">{subjectName}</h1>
        {currentUser && (
            <button className="page-action-button" onClick={handleAddChapter}><Plus size={24} /></button>
        )}
      </div>
      {isLoading ? <p>Loading chapters...</p> : (
        <div className="list-container">
          {chapters.length > 0 ? chapters.map(chapter => (
            <div key={chapter.id} className="list-item-wrapper">
                <Link to={`/notes/${subjectId}/${chapter.id}`} className="list-item">
                    <span>{chapter.name}</span>
                    <ChevronRight />
                </Link>
                {currentUser && (
                    <div className="list-item-actions">
                        <button className="action-button edit-button" onClick={() => handleEditChapter(chapter)}><Pencil size={18} /></button>
                        <button className="action-button delete-button" onClick={() => handleDeleteChapter(chapter)}><Trash2 size={18} /></button>
                    </div>
                )}
            </div>
          )) : <p className="empty-message">No chapters yet. Add one!</p>}
        </div>
      )}
    </div>
  );
}

export default NoteChapters;