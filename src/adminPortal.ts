import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';

class AdminPortal {
  private auth;
  private db;
  private adminEmail = "hotwodi4@gmail.com";

  constructor() {
    this.auth = getAuth();
    this.db = getFirestore();
  }

  /**
   * Validate if the current user is an admin
   */
  private async validateAdmin(): Promise<boolean> {
    const currentUser = this.auth.currentUser;
    if (!currentUser || currentUser.email !== this.adminEmail) {
      throw new Error("Unauthorized: Admin access required");
    }
    return true;
  }

  /**
   * Add a new test user to the platform
   * @param email - Email of the test user
   * @param initialPassword - Initial password for the user
   */
  async addTestUser(email: string, initialPassword: string): Promise<User> {
    await this.validateAdmin();

    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        this.auth, 
        email, 
        initialPassword
      );
      const user = userCredential.user;

      // Create user profile in Firestore
      const userRef = doc(this.db, "users", user.uid);
      await setDoc(userRef, {
        userId: user.uid,
        email: email,
        subscription: "free",  // Default to free tier
        isTestUser: true,      // Mark as a test user
        dailyTargetCalories: 2000,
        targetMacros: {
          fat: 70,
          protein: 150,
          carbs: 200
        },
        createdAt: new Date()
      });

      return user;
    } catch (error) {
      console.error("Error adding test user:", error);
      throw error;
    }
  }

  /**
   * Remove a test user from the platform
   * @param email - Email of the test user to remove
   */
  async removeTestUser(email: string): Promise<void> {
    await this.validateAdmin();

    try {
      // Find user by email
      const usersRef = collection(this.db, "users");
      const q = query(usersRef, where("email", "==", email), where("isTestUser", "==", true));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error(`No test user found with email: ${email}`);
      }

      // Delete Firestore document
      const userDoc = querySnapshot.docs[0];
      await deleteDoc(userDoc.ref);

      // Note: Deleting Firebase Auth user requires backend admin SDK
      console.warn("Firebase Auth user deletion requires backend admin SDK");
    } catch (error) {
      console.error("Error removing test user:", error);
      throw error;
    }
  }

  /**
   * Reset password for a test user
   * @param email - Email of the user to reset password
   */
  async resetUserPassword(email: string): Promise<void> {
    await this.validateAdmin();

    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error) {
      console.error("Password reset error:", error);
      throw error;
    }
  }

  /**
   * List all test users
   */
  async listTestUsers(): Promise<any[]> {
    await this.validateAdmin();

    try {
      const usersRef = collection(this.db, "users");
      const testUserQuery = query(usersRef, where("isTestUser", "==", true));
      const testUserSnapshot = await getDocs(testUserQuery);

      return testUserSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Error listing test users:", error);
      throw error;
    }
  }
}

export default new AdminPortal();
