import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, Search, Paperclip } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

const MySwal = withReactContent(Swal);
const PERSONAL_NOTES_DB_KEY = 'mathmate-personal-notes-db';

const getInitialDb = () => {
  const db = localStorage.getItem(PERSONAL_NOTES_DB_KEY);
  return db ? JSON.parse(db) : {};
};

const saveDb = (db) => {
  localStorage.setItem(PERSONAL_NOTES_DB_KEY, JSON.stringify(db));
};

function PersonalNoteItems() {
  const { subjectId, chapterId } = useParams();
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalAttachments, setModalAttachments] = useState([]);

  useEffect(() => {
    const db = getInitialDb();
    const chapterNotes = db[chapterId] || [];
    setNotes(chapterNotes);
  }, [chapterId]);

  const handleSaveNote = (noteData) => {
    const db = getInitialDb();
    let chapterNotes = db[chapterId] || [];
    if (noteData.id) {
      chapterNotes = chapterNotes.map(n => n.id === noteData.id ? noteData : n);
    } else {
      chapterNotes.push({ ...noteData, id: uuidv4() });
    }
    db[chapterId] = chapterNotes;
    saveDb(db);
    setNotes(chapterNotes);
  };

  const handleDeleteNote = (noteId) => {
    MySwal.fire({
      title: 'Delete this note?', text: "This cannot be undone.", icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Yes, delete it!'
    }).then(result => {
      if (result.isConfirmed) {
        const db = getInitialDb();
        let chapterNotes = db[chapterId] || [];
        const updatedNotes = chapterNotes.filter(n => n.id !== noteId);
        db[chapterId] = updatedNotes;
        saveDb(db);
        setNotes(updatedNotes);
        Swal.fire('Deleted!', 'Your personal note has been deleted.', 'success');
      }
    });
  };

  const saveFile = async (photo) => {
    const readAsBase64 = async (photo) => {
      if (Capacitor.isNativePlatform()) {
        const file = await Filesystem.readFile({ path: photo.path });
        return `data:image/jpeg;base64,${file.data}`;
      } else {
        const response = await fetch(photo.webPath);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = reject;
          reader.onload = () => { resolve(reader.result); };
          reader.readAsDataURL(blob);
        });
      }
    };
    const base64Data = await readAsBase64(photo);
    const fileName = new Date().getTime() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data
    });
    return Capacitor.convertFileSrc(savedFile.uri);
  };

  const handleAttachPhoto = async (note) => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt
      });
      if (image) {
        // Show a loading indicator in the modal
        const attachmentList = document.getElementById('attachment-list');
        if (attachmentList) {
            attachmentList.innerHTML += '<p id="loading-photo">Saving photo...</p>';
        }

        const savedImageUri = await saveFile(image);
        const newAttachment = { id: uuidv4(), type: 'image', uri: savedImageUri, name: 'Image' };
        const attachments = (note ? note.attachments : modalAttachments) || [];
        const updatedAttachments = [...attachments, newAttachment];
        
        // This is a crucial change to correctly update the attachments for the currently open modal
        setModalAttachments(updatedAttachments);
        handleOpenNoteForm(note, updatedAttachments);
      }
    } catch (error) {
      console.error("CAPACITOR CAMERA ERROR:", JSON.stringify(error));
      if (error.message !== "User cancelled photos app") {
        Swal.fire('Error', 'Could not get photo. Please ensure app has permissions in your phone settings.', 'error');
      }
    }
  };

  const handleOpenNoteForm = (note = null, attachments) => {
    const isEditing = !!note;
    const currentAttachments = attachments !== undefined ? attachments : (note?.attachments || []);
    setModalAttachments(currentAttachments);

    MySwal.fire({
      title: isEditing ? 'Edit Personal Note' : 'Add Personal Note',
      html: `
        <input id="swal-title" class="swal2-input" placeholder="Note Title" value="${note ? note.title : ''}">
        <input id="swal-topic" class="swal2-input" placeholder="Topic" value="${note ? note.topic : ''}">
        <input type="date" id="swal-date" class="swal2-input" value="${note ? note.noteDate : ''}">
        <textarea id="swal-content" class="swal2-textarea" placeholder="Note content...">${note ? note.content : ''}</textarea>
        <div class="attachment-section">
          <div class="attachment-buttons">
            <button id="attach-photo-btn" class="swal2-styled">Attach Photo</button>
            <button id="attach-pdf-btn" class="swal2-styled" disabled>Attach PDF (soon)</button>
          </div>
          <div id="attachment-list">
            ${currentAttachments.map(att => `
              <div class="attachment-item">
                ${att.type === 'image' ? `<img src="${att.uri}" width="60" height="60" />` : ''}
                <span>${att.name}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `,
      confirmButtonText: 'Save',
      showCancelButton: true,
      didOpen: () => {
        document.getElementById('attach-photo-btn').addEventListener('click', () => handleAttachPhoto(note));
      },
      preConfirm: () => {
        const title = document.getElementById('swal-title').value;
        if (!title) { Swal.showValidationMessage('Title is required'); }
        return {
          id: note ? note.id : null,
          title,
          topic: document.getElementById('swal-topic').value,
          noteDate: document.getElementById('swal-date').value,
          content: document.getElementById('swal-content').value,
        };
      }
    }).then(result => {
      if (result.isConfirmed) {
        const finalData = { ...result.value, attachments: modalAttachments };
        handleSaveNote(finalData);
        Swal.fire('Saved!', 'Your note has been saved on this device.', 'success');
      }
      setModalAttachments([]);
    });
  };

  const handleViewNote = (note) => {
    const attachmentsHtml = (note.attachments || []).map(att => 
      att.type === 'image' ? `<img src="${att.uri}" class="viewer-attachment-image" />` : ''
    ).join('');
    MySwal.fire({
      title: `<strong>${note.title}</strong>`,
      html: `
        <div class="note-viewer-content">
          <p class="note-viewer-subtitle"><strong>Topic:</strong> ${note.topic || 'N/A'}</p>
          <p class="note-viewer-subtitle"><strong>Date:</strong> ${note.noteDate || 'N/A'}</p>
          <hr/>
          <div class="note-viewer-body">${note.content}</div>
          ${attachmentsHtml ? `<hr/><h4 class="attachment-title">Attachments</h4><div class="viewer-attachment-list">${attachmentsHtml}</div>` : ''}
        </div>
      `,
      confirmButtonText: 'Close',
      customClass: { popup: 'note-viewer-popup' }
    });
  };

  const filteredNotes = useMemo(() => {
    return notes.filter(note => 
      (note.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (note.topic?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
  }, [notes, searchTerm]);

  return (
    <div className="page-container">
      <div className="page-header-row">
        <button onClick={() => navigate(-1)} className="back-button-page"><ArrowLeft /></button>
        <h1 className="page-title">My Notes</h1>
        <button className="page-action-button" onClick={() => handleOpenNoteForm(null, [])}><Plus size={24} /></button>
      </div>
      <div className="note-controls">
        <div className="search-wrapper">
          <Search size={20} className="search-icon" />
          <input type="text" placeholder="Search my notes..." className="search-bar"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>
      <div className="list-container">
        {filteredNotes.length > 0 ? filteredNotes.map((note) => (
          <div key={note.id} className="list-item-wrapper">
            <div className="list-item" onClick={() => handleViewNote(note)}>
              <div>
                <p className="note-title">{note.title}</p>
                <p className="note-subtitle">Topic: {note.topic || 'N/A'} | Date: {note.noteDate || 'N/A'}</p>
                {note.attachments && note.attachments.length > 0 && (
                  <div className="attachment-indicator">
                    <Paperclip size={14} />
                    <span>{note.attachments.length} Attachment(s)</span>
                  </div>
                )}
              </div>
            </div>
            <div className="list-item-actions">
              <button className="action-button edit-button" onClick={(e) => { e.stopPropagation(); handleOpenNoteForm(note); }}><Pencil size={18} /></button>
              <button className="action-button delete-button" onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}><Trash2 size={18} /></button>
            </div>
          </div>
        )) : <p className="empty-message">You have no notes for this chapter. Add one!</p>}
      </div>
    </div>
  );
}

export default PersonalNoteItems;