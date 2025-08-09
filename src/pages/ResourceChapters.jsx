import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

function ResourceChapters() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [chapters, setChapters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();

  const fetchChapters = async () => {
    // ... (fetch logic remains the same)
    if (!categoryId) return;
    setIsLoading(true);
    try {
      const chaptersRef = collection(db, `resources/${categoryId}/chapters`);
      const querySnapshot = await getDocs(chaptersRef);
      const chaps = querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name })).sort((a,b) => a.name.localeCompare(b.name));
      setChapters(chaps);
    } catch (error) { console.error("Error fetching chapters: ", error); }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    fetchChapters();
  }, [categoryId]);
  
  const handleAddChapter = () => {
    MySwal.fire({
        title: 'Add New Chapter', input: 'text', inputPlaceholder: 'Enter chapter name',
        showCancelButton: true, confirmButtonText: 'Create'
    }).then(async (result) => {
        if(result.isConfirmed && result.value) {
            const chapterId = result.value.toLowerCase().replace(/\s+/g, '-');
            const chapterRef = doc(db, `resources/${categoryId}/chapters`, chapterId);
            await setDoc(chapterRef, { name: result.value });
            fetchChapters();
            Swal.fire('Created!', 'The new chapter has been added.', 'success');
        }
    });
  };
  
  const handleEditChapter = (chap) => {
    MySwal.fire({
        title: 'Rename Chapter', input: 'text', inputValue: chap.name, showCancelButton: true
    }).then(async (result) => {
        if(result.isConfirmed && result.value) {
            const chapterRef = doc(db, `resources/${categoryId}/chapters`, chap.id);
            await setDoc(chapterRef, { name: result.value }, { merge: true });
            fetchChapters();
            Swal.fire('Renamed!', 'The chapter name has been updated.', 'success');
        }
    });
  };

  const handleDeleteChapter = (chap) => {
    MySwal.fire({
      title: 'Are you sure?', text: `This will delete the chapter "${chap.name}" and ALL resources inside it.`,
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
        if(result.isConfirmed) {
            const chapterRef = doc(db, `resources/${categoryId}/chapters`, chap.id);
            // Note: This only deletes the chapter doc, not the subcollection of resources.
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
        <h1 className="page-title">{categoryId}</h1>
        {currentUser && (
            <button className="page-action-button" onClick={handleAddChapter}><Plus size={24} /></button>
        )}
      </div>
      {isLoading ? <p>Loading...</p> : (
        <div className="list-container">
          {chapters.map(chapter => (
            <div key={chapter.id} className="list-item-wrapper">
                <Link to={`/resources/${categoryId}/${chapter.id}`} className="list-item">
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
          ))}
        </div>
      )}
    </div>
  );
}
export default ResourceChapters;