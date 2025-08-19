import React, { useState, useEffect } from 'react';
import NoticeCard from '../components/NoticeCard';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { PlusCircle } from 'lucide-react';

const MySwal = withReactContent(Swal);
const NOTICES_CACHE_KEY = 'mathmate-cache-notices';

function Notices() {
  const [notices, setNotices] = useState(() => JSON.parse(localStorage.getItem(NOTICES_CACHE_KEY)) || []);
  const [isLoading, setIsLoading] = useState(notices.length === 0);
  const { currentUser } = useAuth();

  const fetchNotices = async () => {
    try {
      const noticesCollectionRef = collection(db, 'notices');
      const q = query(noticesCollectionRef, orderBy('createdAt', 'desc'));
      const noticesSnapshot = await getDocs(q);
      const freshNotices = noticesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if(JSON.stringify(freshNotices) !== JSON.stringify(notices)) {
        setNotices(freshNotices);
        localStorage.setItem(NOTICES_CACHE_KEY, JSON.stringify(freshNotices));
      }
    } catch (error) {
      console.error("Error fetching notices (might be offline): ", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(notices.length === 0);
    if (navigator.onLine) {
      fetchNotices();
    } else {
      setIsLoading(false);
    }
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
      confirmButtonText: 'Save', showCancelButton: true,
      preConfirm: () => {
        const title = document.getElementById('swal-title').value;
        const content = document.getElementById('swal-content').value;
        if (!title || !content) { Swal.showValidationMessage('Title and content are required'); }
        return { title, content, isImportant: document.getElementById('swal-important').checked };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          if (notice) {
            const noticeRef = doc(db, 'notices', notice.id);
            await updateDoc(noticeRef, result.value);
          } else {
            await addDoc(collection(db, 'notices'), { ...result.value, createdAt: serverTimestamp() });
          }
          fetchNotices();
          Swal.fire('Success!', 'The notice has been saved.', 'success');
        } catch (error) {
          Swal.fire('Error!', 'Could not save the notice: ' + error.message, 'error');
        }
      }
    });
  };

  const handleDelete = (noticeId) => {
    MySwal.fire({
      title: 'Are you sure?', text: "You are about to permanently delete this notice.",
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteDoc(doc(db, 'notices', noticeId));
          fetchNotices();
          Swal.fire('Deleted!', 'The notice has been deleted.', 'success');
        } catch (error) {
          Swal.fire('Error!', 'Could not delete the notice. ' + error.message, 'error');
        }
      }
    });
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Notice Board</h1>
      {isLoading ? <p>Loading notices...</p> : (
        <div>
          {notices.length > 0 ? (
            notices.map(notice => (
              <NoticeCard key={notice.id} notice={notice}
                onEdit={handleOpenNoticeForm} onDelete={handleDelete} />
            ))
          ) : (
            <p className="empty-message">There are no notices to display.</p>
          )}
        </div>
      )}
      {currentUser && (
        <button className="fab-button" onClick={() => handleOpenNoticeForm()}>
          <PlusCircle size={24} /> Post Notice
        </button>
      )}
    </div>
  );
}

export default Notices;