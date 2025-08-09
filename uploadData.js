// uploadData.js
import { collection, doc, setDoc } from 'firebase/firestore';
// Make sure firebaseConfig.js has the '.js' extension
import { db } from './src/firebaseConfig.js'; 
// Make sure scheduleData.js has the '.js' extension
import { scheduleData } from './src/data/scheduleData.js'; 
// Make sure resourceData.js has the '.js' extension
import { resourceData } from './src/data/resourceData.js'; 

async function uploadAllData() {
  console.log('Starting data upload...');

  try {
    // Upload Schedule
    console.log('Uploading schedule...');
    const scheduleRef = doc(collection(db, 'schedule'));
    await setDoc(scheduleRef, scheduleData);
    console.log('✅ Schedule uploaded successfully!');

    // Upload Resources
    console.log('Uploading resources...');
    const resourcesRef = doc(db, 'resources', 'main-library'); 
    await setDoc(resourcesRef, resourceData);
    console.log('✅ Resources uploaded successfully!');

    console.log('\n🎉 All data has been uploaded to Firestore!');
  } catch (error) {
    console.error('❌ Error uploading data:', error);
  }
}

uploadAllData();