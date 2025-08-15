import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react';
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);
const CATEGORIES_CACHE_KEY = 'mathmate-cache-categories';

function ResourceCategories() {
  const [categories, setCategories] = useState(() => JSON.parse(localStorage.getItem(CATEGORIES_CACHE_KEY)) || []);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();

  const fetchCategories = async () => {
    // Only show the main loader if there's no cached data at all
    if (categories.length === 0) {
      setIsLoading(true);
    }
    
    try {
      const querySnapshot = await getDocs(collection(db, "resources"));
      const freshCats = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      })).sort((a, b) => a.name.localeCompare(b.name));
      
      setCategories(freshCats);
      localStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(freshCats));
    } catch (error) {
      console.error("Error fetching categories (might be offline): ", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = () => {
    MySwal.fire({
      title: 'Add New Category',
      input: 'text',
      inputPlaceholder: 'Enter category name',
      showCancelButton: true,
      confirmButtonText: 'Create'
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        const categoryId = result.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const categoryRef = doc(db, 'resources', categoryId);
        await setDoc(categoryRef, { name: result.value });
        fetchCategories(); // Refresh from cloud
        Swal.fire('Created!', 'The new category has been added.', 'success');
      }
    });
  };

  const handleRenameCategory = (cat) => {
    MySwal.fire({
      title: 'Rename Category',
      input: 'text',
      inputValue: cat.name,
      showCancelButton: true
    }).then(async (result) => {
        if(result.isConfirmed && result.value) {
            const categoryRef = doc(db, 'resources', cat.id);
            await setDoc(categoryRef, { name: result.value });
            fetchCategories(); // Refresh from cloud
            Swal.fire('Renamed!', 'The category name has been updated.', 'success');
        }
    });
  };

  const handleDeleteCategory = (cat) => {
    MySwal.fire({
      title: 'Are you sure?',
      text: `This will delete "${cat.name}" and ALL content inside. This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        // Note: For a real app, deleting subcollections requires a Cloud Function.
        // This will only delete the main category document.
        const categoryRef = doc(db, 'resources', cat.id);
        await deleteDoc(categoryRef);
        fetchCategories(); // Refresh from cloud
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

      {isLoading && categories.length === 0 ? <p>Loading categories...</p> : (
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