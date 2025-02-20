import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  createdAt: any;
  lastLoginAt: any;
  loginCount: number;
}

export class UserService {
  private static USER_COLLECTION = 'users';

  /**
   * Create or update user profile in Firestore
   * @param user User object with basic information
   * @returns Promise resolving to the created/updated user profile
   */
  static async createOrUpdateUser(user: {
    id: string;
    email: string;
    name: string;
  }): Promise<UserProfile> {
    const userRef = doc(db, this.USER_COLLECTION, user.id);
    
    try {
      const userDoc = await getDoc(userRef);
      
      const userData: UserProfile = userDoc.exists() 
        ? {
            ...userDoc.data() as UserProfile,
            lastLoginAt: serverTimestamp(),
            loginCount: (userDoc.data() as UserProfile).loginCount + 1
          }
        : {
            ...user,
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
            loginCount: 1
          };

      await setDoc(userRef, userData, { merge: true });
      
      return userData;
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw error;
    }
  }

  /**
   * Get user profile by ID
   * @param userId Unique user identifier
   * @returns Promise resolving to user profile or null
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    const userRef = doc(db, this.USER_COLLECTION, userId);
    
    try {
      const userDoc = await getDoc(userRef);
      return userDoc.exists() ? userDoc.data() as UserProfile : null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Check if email is already registered
   * @param email User's email address
   * @returns Promise resolving to boolean
   */
  static async isEmailRegistered(email: string): Promise<boolean> {
    const usersRef = collection(db, this.USER_COLLECTION);
    const q = query(usersRef, where('email', '==', email));
    
    try {
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking email registration:', error);
      return false;
    }
  }

  /**
   * Get total number of registered users
   * @returns Promise resolving to number of users
   */
  static async getTotalUserCount(): Promise<number> {
    const usersRef = collection(db, this.USER_COLLECTION);
    
    try {
      const querySnapshot = await getDocs(usersRef);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting user count:', error);
      return 0;
    }
  }

  /**
   * Get user login statistics
   * @returns Promise resolving to login statistics
   */
  static async getUserLoginStatistics(): Promise<{
    totalUsers: number;
    averageLoginCount: number;
    mostActiveUsers: UserProfile[];
  }> {
    const usersRef = collection(db, this.USER_COLLECTION);
    
    try {
      const querySnapshot = await getDocs(usersRef);
      const users = querySnapshot.docs.map(doc => doc.data() as UserProfile);
      
      const totalUsers = users.length;
      const averageLoginCount = users.reduce((sum, user) => sum + user.loginCount, 0) / totalUsers;
      
      const mostActiveUsers = users
        .sort((a, b) => b.loginCount - a.loginCount)
        .slice(0, 5);
      
      return {
        totalUsers,
        averageLoginCount,
        mostActiveUsers
      };
    } catch (error) {
      console.error('Error getting login statistics:', error);
      return {
        totalUsers: 0,
        averageLoginCount: 0,
        mostActiveUsers: []
      };
    }
  }
}
