'use server';

import { adminAuth, adminDb } from '@/lib/firebase-admin';

/**
 * Deletes a user account from Firestore and Firebase Auth.
 * This is a server action and should only be executed on the server.
 * @param userId - The ID of the user to delete.
 */
export async function deleteUserAction(userId: string): Promise<void> {
  if (!userId) {
    throw new Error('User ID is required.');
  }

  try {
    // First, delete from Firestore
    const userDocRef = adminDb.collection('users').doc(userId);
    await userDocRef.delete();

    // Then, delete from Firebase Auth
    await adminAuth.deleteUser(userId);
    
    console.log(`Successfully deleted user ${userId} from Firestore and Auth.`);

  } catch (error: any) {
    // If user is not found in Auth, it might have been already deleted.
    // We can consider this a success for the purpose of this function if it was deleted from firestore.
    if (error.code === 'auth/user-not-found') {
        console.warn(`User ${userId} not found in Firebase Auth, but was deleted from Firestore.`);
        return;
    }
    console.error('Error deleting user:', error);
    // Re-throw the error to be handled by the calling client component
    throw new Error(`Failed to delete user: ${error.message}`);
  }
}
