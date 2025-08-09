import React, { useState, useEffect } from 'react';
import NoticeCard from '../components/NoticeCard';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { PlusCircle } from 'lucide-react';

const MySwal = withReactContent(Swal);

function Notices() {
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();

  const fetchNotices = async () => {
    setIsLoading(true);
    try {
      const noticesCollectionRef = collection(db, 'notices');
      const q = query(noticesCollectionRef, orderBy('createdAt', 'desc'));
      const noticesSnapshot = await getDocs(q);
      const noticesData = noticesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotices(noticesData);
    } catch (error) {
      console.error("Error fetching notices: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);
  
  const handleOpenNoticeForm = (notice = null) => {
    MySwal.fire({
      title: notice ? 'Edit Notice' : 'Post New Notice',
      html: `
        <input id="swal-title" class="swal2-input" placeholder="Notice Title" value="${notice ? notice.title : ''}">
        <textarea id="swal-content" class="swal2-textarea" placeholder="Notice content...">${notice ? notice.content : ''}</textarea>
        <div class="swal2-checkbox">
          <input type="checkbox" id="swal-important" ${notice && notice.isImportant ? 'checked' : ''}>
          <label for="swal-important">Mark as Important</label>
        </div>
      `,
      confirmButtonText: 'Save',
      showCancelButton: true,
      preConfirm: () => {
        const title = document.getElementById('swal-title').value;
        const content = document.getElementById('swal-content').value;
        const isImportant = document.getElementById('swal-important').checked;
        if (!title || !content) {
          Swal.showValidationMessage('Title and content are required');
        }
        return { title, content, isImportant };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        const { title, content, isImportant } = result.value;
        try {
          if (notice) { // Editing an existing notice
            const noticeRef = doc(db, 'notices', notice.id);
            await updateDoc(noticeRef, { title, content, isImportant });
          } else { // Creating a new notice
            await addDoc(collection(db, 'notices'), {
              title, content, isImportant, createdAt: serverTimestamp()
            });
          }
          Swal.fire('Success!', 'The notice has been saved.', 'success');
          fetchNotices();
        } catch (error) {
          Swal.fire('Error!', 'Could not save the notice: ' + error.message, 'error');
        }
      }
    });
  };

  const handleDelete = (noticeId) => {
    MySwal.fire({
      title: 'Are you sure?',
      text: "You are about to permanently delete this notice.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteDoc(doc(db, 'notices', noticeId));
          Swal.fire('Deleted!', 'The notice has been deleted.', 'success');
          fetchNotices();
        } catch (error) {
          Swal.fire('Error!', 'Could not delete the notice. ' + error.message, 'error');
        }
      }
    });
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Notice Board</h1>
      {isLoading ? (
        <p>Loading notices...</p>
      ) : (
        <div>
          {notices.length > 0 ? (
            notices.map(notice => (
              <NoticeCard 
                key={notice.id} 
                notice={notice}
                onEdit={handleOpenNoticeForm} 
                onDelete={handleDelete}
              />
            ))
          ) : (
            <p className="empty-notes-message">There are no notices to display.</p>
          )}
        </div>
      )}
      {/* Show "Post New" button only for admin */}
      {currentUser && (
        <button className="fab-button" onClick={() => handleOpenNoticeForm()}>
          <PlusCircle size={24} />
           Post Notice
        </button>
      )}
    </div>
  );
}

export default Notices;