import React, { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { collection, query, getDocs, doc, updateDoc, where, writeBatch } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

interface User {
  id: string;
  email: string;
  subscription: string;
  isAdmin: boolean;
  lastActive: Date;
  subscriptionEndDate?: Date;
}

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef);
      const querySnapshot = await getDocs(q);
      
      const usersData: User[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        usersData.push({
          id: doc.id,
          email: data.email,
          subscription: data.subscription,
          isAdmin: data.role === 'admin',
          lastActive: data.lastActive?.toDate(),
          subscriptionEndDate: data.subscriptionEndDate?.toDate()
        });
      });
      
      setUsers(usersData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage('Error fetching users');
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const makeUsersPremium = async () => {
    try {
      const batch = writeBatch(db);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 20); // 20 days from now

      for (const userId of selectedUsers) {
        const userRef = doc(db, 'users', userId);
        batch.update(userRef, {
          subscription: 'premium',
          subscriptionEndDate: endDate,
          maxPhotoUploadsPerDay: 8
        });

        // Update upload rules
        const uploadRulesRef = doc(db, `users/${userId}/upload_rules/daily`);
        batch.update(uploadRulesRef, {
          maxDaily: 8
        });
      }

      await batch.commit();
      setMessage(`Successfully upgraded ${selectedUsers.length} users to premium`);
      fetchUsers(); // Refresh the list
      setSelectedUsers([]); // Clear selection
    } catch (error) {
      console.error('Error upgrading users:', error);
      setMessage('Error upgrading users');
    }
  };

  const toggleAdminStatus = async (userId: string, makeAdmin: boolean) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: makeAdmin ? 'admin' : 'user'
      });
      setMessage(`Successfully ${makeAdmin ? 'made user admin' : 'removed admin status'}`);
      fetchUsers();
    } catch (error) {
      console.error('Error updating admin status:', error);
      setMessage('Error updating admin status');
    }
  };

  const logoutAllUsers = async () => {
    try {
      const batch = writeBatch(db);
      
      // Update all users' forceLogout flag
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      querySnapshot.forEach((userDoc) => {
        batch.update(userDoc.ref, {
          forceLogout: true,
          lastForceLogout: new Date()
        });
      });

      await batch.commit();
      setMessage('All users have been logged out');
    } catch (error) {
      console.error('Error logging out users:', error);
      setMessage('Error logging out users');
    }
  };

  const revokeSubscription = async (userId: string) => {
    try {
      const batch = writeBatch(db);
      
      // Update user document
      const userRef = doc(db, 'users', userId);
      batch.update(userRef, {
        subscription: 'free',
        subscriptionEndDate: null,
        maxPhotoUploadsPerDay: 3
      });

      // Update upload rules
      const uploadRulesRef = doc(db, `users/${userId}/upload_rules/daily`);
      batch.update(uploadRulesRef, {
        maxDaily: 3
      });

      await batch.commit();
      setMessage('Successfully revoked subscription');
      fetchUsers();
    } catch (error) {
      console.error('Error revoking subscription:', error);
      setMessage('Error revoking subscription');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
      
      {message && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4">
          {message}
        </div>
      )}

      <div className="mb-4 space-x-4">
        <button
          onClick={makeUsersPremium}
          disabled={selectedUsers.length === 0}
          className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Make Selected Users Premium (20 days)
        </button>

        <button
          onClick={logoutAllUsers}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout All Users
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="border p-2">Select</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">Subscription</th>
              <th className="border p-2">Admin Status</th>
              <th className="border p-2">Last Active</th>
              <th className="border p-2">Subscription Ends</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="border p-2">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => toggleUserSelection(user.id)}
                  />
                </td>
                <td className="border p-2">{user.email}</td>
                <td className="border p-2">{user.subscription}</td>
                <td className="border p-2">
                  <button
                    onClick={() => toggleAdminStatus(user.id, !user.isAdmin)}
                    className={`px-2 py-1 rounded ${
                      user.isAdmin ? 'bg-red-500' : 'bg-green-500'
                    } text-white`}
                  >
                    {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                  </button>
                </td>
                <td className="border p-2">
                  {user.lastActive?.toLocaleDateString()}
                </td>
                <td className="border p-2">
                  {user.subscriptionEndDate?.toLocaleDateString() || 'N/A'}
                </td>
                <td className="border p-2">
                  <button
                    onClick={() => revokeSubscription(user.id)}
                    className="bg-yellow-500 text-white px-2 py-1 rounded"
                  >
                    Revoke Premium
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPanel;
