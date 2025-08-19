import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react';
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);
const SUBJECTS_CACHE_KEY = 'mathmate-cache-note-subjects';

function NoteSubjects() {
  const [subjects, setSubjects] = useState(() => JSON.parse(localStorage.getItem(SUBJECTS_CACHE_KEY)) || []);
  const [isLoading, setIsLoading] = useState(subjects.length === 0);
  const { currentUser } = useAuth();

  const fetchSubjects = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "official_notes"));
      const freshSubs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      })).sort((a, b) => a.name.localeCompare(b.name));
      
      // Only update state and cache if the data has actually changed
      if (JSON.stringify(freshSubs) !== JSON.stringify(subjects)) {
        setSubjects(freshSubs);
        localStorage.setItem(SUBJECTS_CACHE_KEY, JSON.stringify(freshSubs));
      }
    } catch (error) {
      console.error("Could not fetch fresh subjects (running in offline mode): ", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Set initial loading state based on cache
    setIsLoading(subjects.length === 0);
    
    if (navigator.onLine) {
      fetchSubjects();
    } else {
      setIsLoading(false); // If we're offline, we're done loading immediately.
    }
  }, []);

  const handleAddSubject = () => {
    MySwal.fire({
      title: 'Add New Subject',
      input: 'text',
      inputPlaceholder: 'Enter subject name (e.g., Calculus-II)',
      showCancelButton: true,
      confirmButtonText: 'Create'
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        const subjectId = result.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const subjectRef = doc(db, 'official_notes', subjectId);
        await setDoc(subjectRef, { name: result.value });
        fetchSubjects(); // Re-fetch from cloud to update cache
        Swal.fire('Created!', 'The new subject has been added.', 'success');
      }
    });
  };

  const handleRenameSubject = (sub) => {
    MySwal.fire({
      title: 'Rename Subject',
      input: 'text',
      inputValue: sub.name,
      showCancelButton: true
    }).then(async (result) => {
        if(result.isConfirmed && result.value) {
            const subjectRef = doc(db, 'official_notes', sub.id);
            await setDoc(subjectRef, { name: result.value });
            fetchSubjects(); // Re-fetch from cloud to update cache
            Swal.fire('Renamed!', 'The category name has been updated.', 'success');
        }
    });
  };

  const handleDeleteSubject = (sub) => {
    MySwal.fire({
      title: 'Are you sure?',
      text: `This will delete the subject "${sub.name}" and ALL its chapters and notes. This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        const subjectRef = doc(db, 'official_notes', sub.id);
        await deleteDoc(subjectRef);
        fetchSubjects(); // Re-fetch from cloud to update cache
        Swal.fire('Deleted!', 'The subject has been deleted.', 'success');
      }
    });
  };

  return (
    <div className="page-container">
      <div className="page-header-row">
        <h1 className="page-title">Subjects</h1>
        {currentUser && (
          <button className="page-action-button" onClick={handleAddSubject}>
            <Plus size={24} />
          </button>
        )}
      </div>

      {isLoading ? <p>Loading subjects...</p> : (
        <div className="list-container">
          {subjects.length > 0 ? subjects.map(subject => (
            <div key={subject.id} className="list-item-wrapper">
              <Link to={`/notes/${subject.id}`} className="list-item">
                <span>{subject.name}</span>
                <ChevronRight />
              </Link>
              {currentUser && (
                <div className="list-item-actions">
                  <button className="action-button edit-button" onClick={() => handleRenameSubject(subject)}>
                    <Pencil size={18} />
                  </button>
                  <button className="action-button delete-button" onClick={() => handleDeleteSubject(subject)}>
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
          )) : <p className="empty-message">No subjects found. An admin can add one!</p>}
        </div>
      )}
    </div>
  );
}

export default NoteSubjects;