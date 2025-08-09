// uploadData.js
import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from './src/firebaseConfig.js';
// Import the new tasks object
import { schedule, resources, courses, tasks } from './src/data/masterData.js';

async function uploadAllData() {
  console.log('Starting data upload...');
  const batch = writeBatch(db);

  try {
    // Upload Schedule
    console.log('Uploading schedule...');
    const scheduleRef = doc(db, 'schedule', 'main-schedule');
    batch.set(scheduleRef, schedule);
    
    // Upload Resources
    console.log('Uploading resources...');
    for (const categoryId in resources) {
        const categoryData = resources[categoryId];
        const categoryRef = doc(db, 'resources', categoryId);
        batch.set(categoryRef, { name: categoryData.name });
        for (const chapterId in categoryData.chapters) {
            const chapterData = categoryData.chapters[chapterId];
            const chapterRef = doc(db, `resources/${categoryId}/chapters`, chapterId);
            batch.set(chapterRef, { name: chapterData.name });
            for (const resource of chapterData.resources) {
                const resourceRef = doc(collection(db, `resources/${categoryId}/chapters/${chapterId}/resources`));
                batch.set(resourceRef, resource);
            }
        }
    }
    
    // Upload Course List
    console.log('Uploading course list...');
    const coursesRef = doc(db, 'courses', 'main-list');
    batch.set(coursesRef, { list: courses });
    
    // --- NEW: Upload Task List ---
    console.log('Uploading task list...');
    const tasksRef = doc(db, 'tasks', 'main-list');
    batch.set(tasksRef, { list: tasks }); // We store the empty array in a 'list' field
    console.log('Task list queued for upload.');

    // Commit all changes at once
    await batch.commit();
    console.log('\n🎉 All data has been uploaded to Firestore!');

  } catch (error) {
    console.error('❌ Error uploading data:', error);
    process.exit(1);
  }
}

uploadAllData();