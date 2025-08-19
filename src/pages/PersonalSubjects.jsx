import React, { useState, useEffect } from 'react'; // <-- THIS LINE IS NOW CORRECT
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

const SUBJECTS_CACHE_KEY = 'mathmate-cache-note-subjects';

function PersonalSubjects() {
  const [subjects, setSubjects] = useState(() => JSON.parse(localStorage.getItem(SUBJECTS_CACHE_KEY)) || []);
  const [isLoading, setIsLoading] = useState(subjects.length === 0);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "official_notes"));
        const freshSubs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        })).sort((a, b) => a.name.localeCompare(b.name));
        
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
    
    if (navigator.onLine) {
      fetchSubjects();
    } else {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="page-container">
      <div className="page-header-row">
        <h1 className="page-title">My Subjects</h1>
      </div>
      <p className="page-subtitle">Select a subject to view or add your personal notes.</p>
      
      {isLoading ? <p>Loading subjects...</p> : (
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