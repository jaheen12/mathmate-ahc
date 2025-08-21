import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const DOWNLOAD_STATUS_KEY = 'mathmate-download-status';

export const getDownloadStatus = () => {
  const status = localStorage.getItem(DOWNLOAD_STATUS_KEY);
  return status ? JSON.parse(status) : {};
};

const setDownloadStatus = (status) => {
  localStorage.setItem(DOWNLOAD_STATUS_KEY, JSON.stringify(status));
};

const updateStatus = (key, newStatus, onProgress) => {
  const status = getDownloadStatus();
  status[key] = newStatus;
  setDownloadStatus(status);
  onProgress(status);
};

const clearStatusOnFailure = (key, onProgress) => {
  const status = getDownloadStatus();
  delete status[key];
  setDownloadStatus(status);
  onProgress(status);
};

// Function to download a single chapter
export const downloadChapter = async (subjectId, chapterId, onProgress) => {
  const chapterKey = `${subjectId}_${chapterId}`;
  updateStatus(chapterKey, 'downloading', onProgress);

  try {
    const notesRef = collection(db, `official_notes/${subjectId}/chapters/${chapterId}/notes`);
    const notesSnapshot = await getDocs(notesRef);
    const notes = notesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    localStorage.setItem(`mathmate-cache-note-items-${subjectId}-${chapterId}`, JSON.stringify(notes));

    for (const note of notes) {
      const noteRef = doc(db, `official_notes/${subjectId}/chapters/${chapterId}/notes/${note.id}`);
      const noteSnap = await getDoc(noteRef);
      if (noteSnap.exists()) {
        localStorage.setItem(`mathmate-cache-note-item-${note.id}`, JSON.stringify({ id: note.id, ...noteSnap.data() }));
      }
    }

    updateStatus(chapterKey, 'downloaded', onProgress);
    
  } catch (error) {
    console.error(`Failed to download chapter ${chapterId}`, error);
    clearStatusOnFailure(chapterKey, onProgress);
  }
};

// Function to download a full subject
export const downloadSubject = async (subjectId, onProgress) => {
  updateStatus(subjectId, 'downloading', onProgress);

  try {
    const chaptersRef = collection(db, `official_notes/${subjectId}/chapters`);
    const chaptersSnapshot = await getDocs(chaptersRef);
    const chapters = chaptersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    localStorage.setItem(`mathmate-cache-note-chapters-${subjectId}`, JSON.stringify(chapters));
    
    // Use a for...of loop to handle async operations correctly
    for (const chapter of chapters) {
      // We pass a dummy onProgress function because we only want to update the UI for the subject as a whole
      await downloadChapter(subjectId, chapter.id, () => {});
    }

    updateStatus(subjectId, 'downloaded', onProgress);

  } catch (error) {
    console.error(`Failed to download subject ${subjectId}`, error);
    clearStatusOnFailure(subjectId, onProgress);
  }
};