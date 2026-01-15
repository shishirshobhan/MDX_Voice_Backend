// firebase.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private app: admin.app.App;

  onModuleInit() {
    if (!admin.apps.length) {
      const serviceAccountPath = path.join(
        process.cwd(),
        'serviceAccountKey.json'
      );

      this.app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath),
        // Optional: explicitly set project
        projectId: 'voiceappmdx',
      });

      console.log('Firebase Admin initialized successfully');
    } else {
      this.app = admin.app();
    }
  }

  getFirestore() {
    return admin.firestore();
  }

  getAuth() {
    return admin.auth();
  }

  getStorage() {
    return admin.storage();
  }
}