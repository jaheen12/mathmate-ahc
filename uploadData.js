// uploadData.js

/* eslint-env node */
import { doc, writeBatch } from 'firebase/firestore';
import { db } from './src/firebaseConfig.js';
import { schedule, resources, courses, tasks, officialNotes } from './src/data/masterData.js';

async function uploadAllData() {
  console.log('Starting data upload...');
  const batch = writeBatch(db);

  try {
    // --- COLLECTIONS WITH A SINGLE DOCUMENT ---
    console.log('Uploading single-document collections...');
    const singleDocs = {
      'schedule': { id: 'main-schedule', data: schedule },
      'courses': { id: 'main-list', data: { list: courses } },
      'tasks': { id: 'main-list', data: { list: tasks } },
    };
    for (const collName in singleDocs) {
      const { id, data } = singleDocs[collName];
      const docRef = doc(db, collName, id);
      batch.set(docRef, data);
    }
    console.log('Single-document collections queued.');

    // --- COLLECTIONS WITH MULTIPLE DOCUMENTS (like our hierarchies) ---
    console.log('Uploading multi-document collections...');
    const multiDocs = {
      'resources': resources,
      'official_notes': officialNotes,
    };
    for (const collName in multiDocs) {
      const dataObject = multiDocs[collName];
      for (const docId in dataObject) {
        const docData = dataObject[docId];
        const docRef = doc(db, collName, docId);
        batch.set(docRef, docData);
      }
    }
    console.log('Multi-document collections queued.');

    // Commit all changes
    await batch.commit();
    console.log('\n🎉 All data has been successfully uploaded to Firestore!');

  } catch (error) {
    console.error('❌ Error uploading data:', error);
    process.exit(1);
  }
}

uploadAllData();