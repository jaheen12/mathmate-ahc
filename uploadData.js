// uploadData.js
import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from './src/firebaseConfig.js';
// Import the new courses object
import { schedule, resources, courses } from './src/data/masterData.js';

async function uploadAllData() {
  console.log('Starting data upload...');
  const batch = writeBatch(db);

  try {
    // Upload Schedule (same as before)
    console.log('Uploading schedule...');
    const scheduleRef = doc(db, 'schedule', 'main-schedule');
    batch.set(scheduleRef, schedule);
    console.log('Schedule queued for upload.');

    // Upload Resources (same as before)
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
    console.log('Resources queued for upload.');
    
    // --- NEW: Upload Course List ---
    console.log('Uploading course list...');
    const coursesRef = doc(db, 'courses', 'main-list');
    // We store the array inside a field called 'list'
    batch.set(coursesRef, { list: courses });
    console.log('Course list queued for upload.');

    await batch.commit();
    console.log('\n🎉 All data has been uploaded to Firestore!');

  } catch (error) {
    console.error('❌ Error uploading data:', error);
    process.exit(1);
  }
}

uploadAllData();