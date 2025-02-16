import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const db = getFirestore();

interface NutritionEntry {
  userId: string;
  foodName: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  date: Date;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  imageUrl?: string;
}

// Add a new nutrition entry
export async function addNutritionEntry(entry: Omit<NutritionEntry, 'userId'>) {
  const auth = getAuth();
  if (!auth.currentUser) {
    throw new Error('User must be logged in to add nutrition entries');
  }

  const nutritionData = {
    ...entry,
    userId: auth.currentUser.uid,
    date: Timestamp.fromDate(entry.date)
  };

  try {
    const docRef = await addDoc(collection(db, 'nutritionEntries'), nutritionData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding nutrition entry:', error);
    throw error;
  }
}

// Get nutrition entries for the current user
export async function getUserNutritionEntries(
  startDate?: Date,
  endDate?: Date,
  mealType?: string
) {
  const auth = getAuth();
  if (!auth.currentUser) {
    throw new Error('User must be logged in to view nutrition entries');
  }

  try {
    let q = query(
      collection(db, 'nutritionEntries'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('date', 'desc')
    );

    if (startDate) {
      q = query(q, where('date', '>=', Timestamp.fromDate(startDate)));
    }
    if (endDate) {
      q = query(q, where('date', '<=', Timestamp.fromDate(endDate)));
    }
    if (mealType) {
      q = query(q, where('mealType', '==', mealType));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate()
    }));
  } catch (error) {
    console.error('Error getting nutrition entries:', error);
    throw error;
  }
}

// Update a nutrition entry
export async function updateNutritionEntry(
  entryId: string,
  updates: Partial<Omit<NutritionEntry, 'userId'>>
) {
  const auth = getAuth();
  if (!auth.currentUser) {
    throw new Error('User must be logged in to update nutrition entries');
  }

  try {
    const entryRef = doc(db, 'nutritionEntries', entryId);
    const updateData = { ...updates };
    
    if (updates.date) {
      updateData.date = Timestamp.fromDate(updates.date);
    }

    await updateDoc(entryRef, updateData);
  } catch (error) {
    console.error('Error updating nutrition entry:', error);
    throw error;
  }
}

// Delete a nutrition entry
export async function deleteNutritionEntry(entryId: string) {
  const auth = getAuth();
  if (!auth.currentUser) {
    throw new Error('User must be logged in to delete nutrition entries');
  }

  try {
    await deleteDoc(doc(db, 'nutritionEntries', entryId));
  } catch (error) {
    console.error('Error deleting nutrition entry:', error);
    throw error;
  }
}

// Get nutrition summary for a date range
export async function getNutritionSummary(startDate: Date, endDate: Date) {
  const entries = await getUserNutritionEntries(startDate, endDate);
  
  return entries.reduce((acc, entry) => {
    return {
      totalCalories: acc.totalCalories + (entry.calories || 0),
      totalProtein: acc.totalProtein + (entry.protein || 0),
      totalCarbs: acc.totalCarbs + (entry.carbs || 0),
      totalFat: acc.totalFat + (entry.fat || 0),
      entryCount: acc.entryCount + 1
    };
  }, {
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    entryCount: 0
  });
}
