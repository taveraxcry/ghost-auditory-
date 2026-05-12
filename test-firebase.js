const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyCJA5ZjZHZE2t2Nhb38OuVdM_BZb-PSwQk",
  authDomain: "solo-huellas.firebaseapp.com",
  projectId: "solo-huellas",
  storageBucket: "solo-huellas.firebasestorage.app",
  messagingSenderId: "36509732220",
  appId: "1:36509732220:web:d532c612ad39d373c968f9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testFirebase() {
  console.log("Attempting to write to Firestore...");
  try {
    const docRef = await addDoc(collection(db, "audits"), {
      query: "Test Query",
      status: "resolved",
      is_complex: false,
      created_at: new Date().toISOString()
    });
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
  process.exit();
}

testFirebase();
