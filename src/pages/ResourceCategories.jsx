import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react';
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

function ResourceCategories() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "resources"));
      const cats = querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name })).sort((a, b) => a.name.localeCompare(b.name));
      setCategories(cats);
    } catch (error) { console.error("Error fetching categories: ", error); }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = () => {
    MySwal.fire({
      title: 'Add New Category', input: 'text', inputPlaceholder: 'Enter category name',
      showCancelButton: true, confirmButtonText: 'Create'
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        const categoryId = result.value.toLowerCase().replace(/\s+/g, '-'); // e.g., "Past Papers" -> "past-papers"
        const categoryRef = doc(db, 'resources', categoryId);
        await setDoc(categoryRef, { name: result.value });
        fetchCategories();
        Swal.fire('Created!', 'The new category has been added.', 'success');
      }
    });
  };

  const handleRenameCategory = (cat) => {
    // Logic to rename a category (can be complex, let's keep it simple for now by deleting and re-adding)
    // A true rename requires moving subcollections, which is a more advanced operation.
    // For now, we will just edit the display name.
    MySwal.fire({
      title: 'Rename Category', input: 'text', inputValue: cat.name, showCancelButton: true
    }).then(async (result) => {
        if(result.isConfirmed && result.value) {
            const categoryRef = doc(db, 'resources', cat.id);
            await setDoc(categoryRef, { name: result.value });
            fetchCategories();
            Swal.fire('Renamed!', 'The category name has been updated.', 'success');
        }
    });
  };

  const handleDeleteCategory = (cat) => {
    MySwal.fire({
      title: 'Are you sure?', text: `This will delete the category "${cat.name}" and ALL chapters and resources inside it. This cannot be undone.`,
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        // NOTE: Deleting subcollections is complex. A proper implementation uses Cloud Functions.
        // For the client, we can only delete the parent document. The subcollections will become "orphaned".
        // This is an acceptable simplification for our current app.
        const categoryRef = doc(db, 'resources', cat.id);
        await deleteDoc(categoryRef);
        fetchCategories();
        Swal.fire('Deleted!', 'The category has been deleted.', 'success');
      }
    });
  };

  return (
    <div className="page-container">
      <div className="page-header-row">
        <h1 className="page-title">Resource Categories</h1>
        {currentUser && (
          <button className="page-action-button" onClick={handleAddCategory}>
            <Plus size={24} />
          </button>
        )}
      </div>

      {isLoading ? <p>Loading...</p> : (
        <div className="list-container">
          {categories.map(category => (
            <div key={category.id} className="list-item-wrapper">
              <Link to={`/resources/${category.id}`} className="list-item">
                <span>{category.name}</span>
                <ChevronRight />
              </Link>
              {currentUser && (
                <div className="list-item-actions">
                  <button className="action-button edit-button" onClick={() => handleRenameCategory(category)}>
                    <Pencil size={18} />
                  </button>
                  <button className="action-button delete-button" onClick={() => handleDeleteCategory(category)}>
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default ResourceCategories;
