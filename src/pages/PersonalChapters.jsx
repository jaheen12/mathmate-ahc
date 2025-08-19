import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

function PersonalChapters() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const CHAPTERS_CACHE_KEY = `mathmate-cache-note-chapters-${subjectId}`;

  const [chapters, setChapters] = useState(() => JSON.parse(localStorage.getItem(CHAPTERS_CACHE_KEY)) || []);
  const [subjectName, setSubjectName] = useState(subjectId);
  const [isLoading, setIsLoading] = useState(chapters.length === 0);

  useEffect(() => {
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

    if (navigator.onLine) {
      fetchChapters();
    } else {
      setIsLoading(false);
    }
  }, [subjectId]);

  return (
    <div className="page-container">
      <div className="page-header-row">
        <button onClick={() => navigate(-1)} className="back-button-page"><ArrowLeft /></button>
        <h1 className="page-title">{subjectName}</h1>
      </div>

      {isLoading ? <p>Loading chapters...</p> : (
        <div className="list-container">
          {chapters.map(chapter => (
            <Link to={`/notes/personal/${subjectId}/${chapter.id}`} key={chapter.id} className="list-item">
              <span>{chapter.name}</span>
              <ChevronRight />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default PersonalChapters;