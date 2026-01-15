import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class UserService implements OnModuleInit {
  private db: FirebaseFirestore.Firestore;

  constructor(private readonly firebaseService: FirebaseService) {}

  onModuleInit() {
    this.db = this.firebaseService.getFirestore();
  }

  // Get user from Firestore by UID (from Firebase Auth)
  async getUserByUid(uid: string) {
    const doc = await this.db.collection('users').doc(uid).get();
    
    if (!doc.exists) {
      throw new NotFoundException(`User with UID ${uid} not found`);
    }
    
    return {
      uid: doc.id,
      ...doc.data(),
    };
  }

  // Optional: Get user by custom document ID if needed
  async getUserById(userId: string) {
    const doc = await this.db.collection('users').doc(userId).get();
    
    if (!doc.exists) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    
    return doc.data();
  }
}