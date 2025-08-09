import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Link as LinkIcon, Pencil, Trash2 } from 'lucide-react';
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

function ResourceItems() {
  const { categoryId, chapterId } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();

  const fetchItems = async () => {
    // ... (fetch logic remains the same)
    if (!categoryId || !chapterId) return;
    setIsLoading(true);
    try {
      const itemsRef = collection(db, `resources/${categoryId}/chapters/${chapterId}/resources`);
      const querySnapshot = await getDocs(itemsRef);
      const resItems = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(resItems);
    } catch (error) { console.error("Error fetching items: ", error); }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    fetchItems();
  }, [categoryId, chapterId]);

  const handleOpenItemForm = (item = null) => {
    const isEditing = !!item;
    MySwal.fire({
      title: isEditing ? 'Edit Resource Item' : 'Add New Resource Item',
      html: `
        <input id="swal-title" class="swal2-input" placeholder="Title" value="${item ? item.title : ''}">
        <input id="swal-desc" class="swal2-input" placeholder="Description" value="${item ? item.description : ''}">
        <input id="swal-url" class="swal2-input" placeholder="URL (https://...)" value="${item ? item.url : ''}">
      `,
      confirmButtonText: 'Save', showCancelButton: true,
      preConfirm: () => {
        const title = document.getElementById('swal-title').value;
        const url = document.getElementById('swal-url').value;
        if (!title || !url) { Swal.showValidationMessage('Title and URL are required'); }
        return { title, description: document.getElementById('swal-desc').value, url };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          if (isEditing) {
            const itemRef = doc(db, `resources/${categoryId}/chapters/${chapterId}/resources`, item.id);
            await updateDoc(itemRef, result.value);
          } else {
            const itemsRef = collection(db, `resources/${categoryId}/chapters/${chapterId}/resources`);
            await addDoc(itemsRef, result.value);
          }
          fetchItems();
          Swal.fire('Saved!', 'The resource has been saved.', 'success');
        } catch(error) {
          Swal.fire('Error!', 'Could not save the resource: ' + error.message, 'error');
        }
      }
    });
  };

  const handleDeleteItem = (item) => {
    MySwal.fire({ title: 'Delete Item?', text: `Delete "${item.title}"?`, icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        const itemRef = doc(db, `resources/${categoryId}/chapters/${chapterId}/resources`, item.id);
        await deleteDoc(itemRef);
        fetchItems();
        Swal.fire('Deleted!', 'The resource has been deleted.', 'success');
      }
    });
  };

  return (
    <div className="page-container">
      <div className="page-header-row">
        <button onClick={() => navigate(-1)} className="back-button-page"><ArrowLeft /></button>
        <h1 className="page-title">Resources</h1>
        {currentUser && (
            <button className="page-action-button" onClick={() => handleOpenItemForm()}><Plus size={24} /></button>
        )}
      </div>

      {isLoading ? <p>Loading...</p> : (
        <div>
          {items.map((item) => (
            <div key={item.id} className="list-item-wrapper">
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="resource-item-link">
                    <div className="resource-icon-container"><LinkIcon /></div>
                    <div className="resource-details">
                        <p className="resource-title">{item.title}</p>
                        <p className="resource-description">{item.description}</p>
                    </div>
                </a>
                {currentUser && (
                    <div className="list-item-actions">
                        <button className="action-button edit-button" onClick={() => handleOpenItemForm(item)}><Pencil size={18} /></button>
                        <button className="action-button delete-button" onClick={() => handleDeleteItem(item)}><Trash2 size={18} /></button>
                    </div>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default ResourceItems;