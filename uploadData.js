// uploadData.js
import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from './src/firebaseConfig.js';
import { schedule, resources } from './src/data/masterData.js';

async function uploadAllData() {
  console.log('Starting data upload...');
  // Use a batch for atomic writes
  const batch = writeBatch(db);

  try {
    // Upload Schedule
    console.log('Uploading schedule...');
    const scheduleRef = doc(db, 'schedule', 'main-schedule');
    batch.set(scheduleRef, schedule);
    console.log('Schedule queued for upload.');

    // Upload Resources
    console.log('Uploading resources...');
    for (const categoryId in resources) {
      const categoryData = resources[categoryId];
      const categoryRef = doc(db, 'resources', categoryId);
      // Set the category name
      batch.set(categoryRef, { name: categoryData.name });
      
      for (const chapterId in categoryData.chapters) {
        const chapterData = categoryData.chapters[chapterId];
        const chapterRef = doc(db, `resources/${categoryId}/chapters`, chapterId);
        // Set the chapter name
        batch.set(chapterRef, { name: chapterData.name });

        for (const resource of chapterData.resources) {
          const resourceRef = doc(collection(db, `resources/${categoryId}/chapters/${chapterId}/resources`));
          // Set the resource data
          batch.set(resourceRef, resource);
        }
      }
    }
    console.log('Resources queued for upload.');
    
    // Commit the batch
    await batch.commit();
    console.log('\n🎉 All data has been uploaded to Firestore!');

  } catch (error) {
    console.error('❌ Error uploading data:', error);
    process.exit(1);
  }
}

uploadAllData();