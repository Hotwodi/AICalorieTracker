import { getAuth, signOut } from 'firebase/auth';
import { doc, updateDoc, getFirestore } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  // Add other user properties as needed
}

export class UserService {
  static async isEmailRegistered(email: string): Promise<boolean> {
    // Implement email check logic
    return false;
  }

  static async createOrUpdateUser(userData: { id: string; email: string; name: string }): Promise<UserProfile> {
    // Implement user creation/update logic
    return userData as UserProfile;
  }

  static async updateUserLoginStatus(userId: string, isLoggedIn: boolean): Promise<void> {
    const db = getFirestore();
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isLoggedIn,
      lastLoginAt: isLoggedIn ? new Date().toISOString() : null
    });
  }

  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    // Implement get user profile logic
    return null;
  }

  static async logout(): Promise<void> {
    try {
      const auth = getAuth();
      // Sign out from Firebase
      await signOut(auth);
      
      // Clear any local storage
      localStorage.clear();
      
      // Clear any session storage
      sessionStorage.clear();
      
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  }
} 