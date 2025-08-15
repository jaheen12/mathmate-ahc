import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

// We'll use the same cache key as the official notes to stay in sync
const SUBJECTS_CACHE_KEY = 'mathmate-cache-official-notes-subjects';

function PersonalSubjects() {
  const [subjects, setSubjects] = useState(() => JSON.parse(localStorage.getItem(SUBJECTS_CACHE_KEY)) || []);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      if (subjects.length === 0) setIsLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "official_notes"));
        const freshSubs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        })).sort((a, b) => a.name.localeCompare(b.name));
        setSubjects(freshSubs);
        localStorage.setItem(SUBJECTS_CACHE_KEY, JSON.stringify(freshSubs));
      } catch (error) {
        console.error("Error fetching subjects (might be offline): ", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  return (
    <div className="page-container">
      <div className="page-header-row">
        <h1 className="page-title">My Subjects</h1>
      </div>
      <p className="page-subtitle">Select a subject to view or add your personal notes.</p>
      
      {isLoading && subjects.length === 0 ? <p>Loading subjects...</p> : (
        <div className="list-container">
          {subjects.map(subject => (
            <Link to={`/notes/personal/${subject.id}`} key={subject.id} className="list-item">
              <span>{subject.name}</span>
              <ChevronRight />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default PersonalSubjects;