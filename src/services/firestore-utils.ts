import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../config/firebase';

export class FirestoreUtils {
  /**
   * Count the number of documents in a specific collection
   * @param collectionName Name of the Firestore collection to count
   * @returns Promise resolving to the number of documents in the collection
   */
  static async countCollectionDocuments(collectionName: string): Promise<number> {
    try {
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);
      return snapshot.size;
    } catch (error) {
      console.error(`Error counting documents in ${collectionName}:`, error);
      return 0;
    }
  }

  /**
   * Get a list of all document IDs in a collection
   * @param collectionName Name of the Firestore collection
   * @returns Promise resolving to an array of document IDs
   */
  static async listCollectionDocumentIds(collectionName: string): Promise<string[]> {
    try {
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);
      return snapshot.docs.map(doc => doc.id);
    } catch (error) {
      console.error(`Error listing document IDs in ${collectionName}:`, error);
      return [];
    }
  }

  /**
   * Retrieve detailed information about documents in a collection
   * @param collectionName Name of the Firestore collection
   * @returns Promise resolving to an array of document data
   */
  static async getCollectionDocuments(collectionName: string): Promise<any[]> {
    try {
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Error retrieving documents from ${collectionName}:`, error);
      return [];
    }
  }
}
