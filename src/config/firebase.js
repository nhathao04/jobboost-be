const admin = require("firebase-admin");
const path = require("path");

class FirebaseService {
  constructor() {
    // Prevent multiple initializations
    if (admin.apps.length === 0) {
      const serviceAccount = require(path.join(
        process.cwd(),
        "sworker-590e8-firebase-adminsdk-fbsvc-0f83ccc788.json"
      ));

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: "gs://sworker-590e8.firebasestorage.app", // Update with your actual bucket
      });
    }

    this.storage = admin.storage();
    this.bucket = this.storage.bucket();
  }

  getStorage() {
    return this.storage;
  }

  getBucket() {
    return this.bucket;
  }

  getAdmin() {
    return admin;
  }
}

// Create singleton instance
const firebaseService = new FirebaseService();

module.exports = firebaseService;
