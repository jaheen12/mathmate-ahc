import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { FaPlus } from "react-icons/fa";
import { MdDelete, MdEdit } from "react-icons/md";
import { IoArrowBack } from "react-icons/io5";
import Skeleton from 'react-loading-skeleton'; // Import the skeleton component

const PersonalSubjects = () => {
    const [subjects, setSubjects] = useState([]);
    const [newSubjectName, setNewSubjectName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isRenaming, setIsRenaming] = useState(false);
    const [renamingSubjectId, setRenamingSubjectId] = useState(null);
    const [renamingSubjectName, setRenamingSubjectName] = useState('');
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    useEffect(() => {
        const fetchSubjects = async () => {
            if (!currentUser) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const q = query(collection(db, "personal_notes"), where("userId", "==", currentUser.uid));
                const querySnapshot = await getDocs(q);
                const subjectsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setSubjects(subjectsData);
            } catch (error) {
                console.error("Error fetching subjects: ", error);
                toast.error("Failed to fetch subjects.");
            } finally {
                setLoading(false);
            }
        };

        fetchSubjects();
    }, [currentUser]);

    const handleSaveSubject = async () => {
        if (newSubjectName.trim() === '') {
            toast.error('Subject name cannot be empty');
            return;
        }
        try {
            const docRef = await addDoc(collection(db, "personal_notes"), {
                name: newSubjectName,
                userId: currentUser.uid,
                createdAt: new Date()
            });
            setSubjects([...subjects, { id: docRef.id, name: newSubjectName, userId: currentUser.uid }]);
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
                await deleteDoc(doc(db, "personal_notes", subjectId));
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
            const subjectDoc = doc(db, "personal_notes", renamingSubjectId);
            await updateDoc(subjectDoc, { name: renamingSubjectName });
            setSubjects(subjects.map(s => s.id === renamingSubjectId ? { ...s, name: renamingSubjectName } : s));
            setIsRenaming(false);
            setRenamingSubjectId(null);
            toast.success('Subject renamed successfully!');
        } catch (error) {
            console.error("Error renaming subject: ", error);
            toast.error('Failed to rename subject.');
        }
    };
    
    // --- Loading Skeleton component for Subjects ---
    const SubjectsSkeleton = () => (
        <div className="space-y-2">
            {Array(5).fill().map((_, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-100 rounded shadow-sm">
                    <Skeleton width={'60%'} height={24} />
                    <div className="flex items-center">
                        <Skeleton circle={true} height={32} width={32} style={{ marginRight: '10px' }} />
                        <Skeleton circle={true} height={32} width={32} />
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-4">
                <Link to="/profile" className="text-blue-500 hover:underline"><IoArrowBack size={24} /></Link>
                <h1 className="text-2xl font-bold">My Note Subjects</h1>
                <button onClick={() => setIsAdding(true)} className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600">
                    <FaPlus />
                </button>
            </div>

            {isAdding && (
                <div className="mb-4 p-4 border rounded shadow">
                    <input
                        type="text"
                        value={newSubjectName}
                        onChange={(e) => setNewSubjectName(e.target.value)}
                        placeholder="New subject name"
                        className="border p-2 w-full mb-2"
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
                    <button onClick={handleSaveRename} className="bg-green-500 text-white p-2 rounded mr-2">Save Rename</button>
                    <button onClick={() => setIsRenaming(false)} className="bg-gray-500 text-white p-2 rounded">Cancel</button>
                </div>
            )}
            
            {loading ? <SubjectsSkeleton /> : (
                <>
                    {subjects.length > 0 ? (
                        <ul className="space-y-2">
                            {subjects.map(subject => (
                                <li key={subject.id} className="flex justify-between items-center p-3 bg-gray-100 rounded shadow-sm">
                                    <span 
                                        onClick={() => navigate(`/personal-notes/${subject.id}`)} 
                                        className="cursor-pointer font-semibold flex-grow hover:text-blue-600"
                                    >
                                        {subject.name}
                                    </span>
                                    <div className="flex items-center">
                                        <button onClick={() => handleRename(subject)} className="text-blue-500 hover:text-blue-700 mr-2"><MdEdit size={20} /></button>
                                        <button onClick={() => handleDelete(subject.id)} className="text-red-500 hover:text-red-700"><MdDelete size={20} /></button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No subjects found. Add a new one to get started.</p>
                    )}
                </>
            )}
        </div>
    );
};

export default PersonalSubjects;