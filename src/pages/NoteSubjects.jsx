import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig'; // Ensure this path is correct
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { FaPlus } from "react-icons/fa";
import { MdDelete, MdEdit } from "react-icons/md";
import { IoArrowBack } from "react-icons/io5";

const NoteSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renamingSubjectId, setRenamingSubjectId] = useState(null);
  const [renamingSubjectName, setRenamingSubjectName] = useState('');

  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Simplified useEffect to fetch data. Firestore's offline persistence handles caching.
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "official_notes"));
        const subjectsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSubjects(subjectsData);
      } catch (error) {
        console.error("Error fetching subjects: ", error);
        toast.error("Failed to fetch subjects. Data may be unavailable offline.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []); // Empty dependency array ensures this runs only once on mount

  const handleAddSubject = () => {
    setIsAdding(true);
  };

  const handleSaveSubject = async () => {
    if (newSubjectName.trim() === '') {
      toast.error('Subject name cannot be empty');
      return;
    }
    try {
      const docRef = await addDoc(collection(db, "official_notes"), {
        name: newSubjectName,
        createdAt: new Date()
      });
      setSubjects([...subjects, { id: docRef.id, name: newSubjectName }]);
      setNewSubjectName('');
      setIsAdding(false);
      toast.success('Subject added successfully!');
    } catch (error) {
      console.error("Error adding subject: ", error);
      toast.error('Failed to add subject.');
    }
  };

  const handleDelete = async (subjectId) => {
    if (window.confirm("Are you sure you want to delete this subject and all its notes?")) {
      try {
        await deleteDoc(doc(db, "official_notes", subjectId));
        setSubjects(subjects.filter(subject => subject.id !== subjectId));
        toast.success('Subject deleted successfully!');
      } catch (error) {
        console.error("Error deleting subject: ", error);
        toast.error('Failed to delete subject.');
      }
    }
  };

  const handleRename = (subject) => {
    setIsRenaming(true);
    setRenamingSubjectId(subject.id);
    setRenamingSubjectName(subject.name);
  };
  
  const handleSaveRename = async () => {
    if (renamingSubjectName.trim() === '') {
      toast.error('Subject name cannot be empty');
      return;
    }
    try {
      const subjectDoc = doc(db, "official_notes", renamingSubjectId);
      await updateDoc(subjectDoc, {
        name: renamingSubjectName
      });
      setSubjects(subjects.map(s => s.id === renamingSubjectId ? { ...s, name: renamingSubjectName } : s));
      setIsRenaming(false);
      setRenamingSubjectId(null);
      toast.success('Subject renamed successfully!');
    } catch (error) {
      console.error("Error renaming subject: ", error);
      toast.error('Failed to rename subject.');
    }
  };

  const handleSubjectClick = (subjectId) => {
    navigate(`/notes/${subjectId}`);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <Link to="/profile" className="text-blue-500 hover:underline"><IoArrowBack size={24} /></Link>
        <h1 className="text-2xl font-bold">Official Note Subjects</h1>
        {currentUser && (
          <button onClick={handleAddSubject} className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600">
            <FaPlus />
          </button>
        )}
      </div>

      {loading ? (
        <p>Loading subjects...</p>
      ) : (
        <div>
          {isAdding && (
            <div className="mb-4 p-4 border rounded shadow">
              <input
                type="text"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                className="border p-2 w-full mb-2"
                placeholder="New subject name"
              />
              <button onClick={handleSaveSubject} className="bg-green-500 text-white p-2 rounded mr-2">Save</button>
              <button onClick={() => setIsAdding(false)} className="bg-gray-500 text-white p-2 rounded">Cancel</button>
            </div>
          )}

          {isRenaming && (
            <div className="mb-4 p-4 border rounded shadow">
              <input
                type="text"
                value={renamingSubjectName}
                onChange={(e) => setRenamingSubjectName(e.target.value)}
                className="border p-2 w-full mb-2"
              />
              <button onClick={handleSaveRename} className="bg-green-500 text-white p-2 rounded mr-2">Save</button>
              <button onClick={() => setIsRenaming(false)} className="bg-gray-500 text-white p-2 rounded">Cancel</button>
            </div>
          )}
          
          {subjects.length > 0 ? (
            <ul className="space-y-2">
              {subjects.map(subject => (
                <li key={subject.id} className="flex justify-between items-center p-3 bg-gray-100 rounded shadow-sm">
                  <span
                    onClick={() => handleSubjectClick(subject.id)}
                    className="cursor-pointer font-semibold flex-grow hover:text-blue-600"
                  >
                    {subject.name}
                  </span>
                  {currentUser && (
                    <div className="flex items-center">
                      <button onClick={() => handleRename(subject)} className="text-blue-500 hover:text-blue-700 mr-2"><MdEdit size={20} /></button>
                      <button onClick={() => handleDelete(subject.id)} className="text-red-500 hover:text-red-700"><MdDelete size={20} /></button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>No subjects found. Add a new one to get started!</p>
          )}
        </div>
      )}
    </div>
  );
};

export default NoteSubjects;