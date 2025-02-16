import { 
  signUp, 
  signIn, 
  signInWithGoogle, 
  logOut, 
  sendPasswordReset,
  auth 
} from '@/lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  updateProfile
} from 'firebase/auth';
import { setDoc } from 'firebase/firestore';

// Mock Firebase auth methods
jest.mock('firebase/auth', () => {
  const originalModule = jest.requireActual('firebase/auth');
  return {
    ...originalModule,
    createUserWithEmailAndPassword: jest.fn(() => ({
      user: {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User'
      }
    })),
    signInWithEmailAndPassword: jest.fn(() => ({
      user: {
        uid: 'test-uid',
        email: 'test@example.com'
      }
    })),
    signInWithPopup: jest.fn(() => ({
      user: {
        uid: 'google-uid',
        email: 'test@example.com',
        displayName: 'Test User'
      }
    })),
    signOut: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    updateProfile: jest.fn(),
    GoogleAuthProvider: jest.fn(() => ({
      addScope: jest.fn().mockReturnThis(),
      setCustomParameters: jest.fn().mockReturnThis()
    })),
    getAuth: jest.fn(() => ({
      apiKey: 'test-api-key',
      appName: '[DEFAULT]',
      authDomain: 'test-auth-domain'
    }))
  };
});

// Mock Firestore methods
jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'),
  setDoc: jest.fn()
}));

describe('Firebase Authentication', () => {
  const testEmail = 'test@example.com';
  const testPassword = 'password123';
  const testDisplayName = 'Test User';

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Sign Up', () => {
    it('should successfully sign up a new user', async () => {
      // Mock a successful user creation
      const mockUser = {
        uid: 'test-uid',
        email: testEmail,
        displayName: testDisplayName
      };
      const mockUserCredential = { user: mockUser };
      
      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue(mockUserCredential);
      (updateProfile as jest.Mock).mockResolvedValue(undefined);
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      const user = await signUp(testEmail, testPassword, testDisplayName);
      
      const authArg = (createUserWithEmailAndPassword as jest.Mock).mock.calls[0][0];
      expect(authArg).toEqual(expect.objectContaining({
        apiKey: expect.any(String),
        appName: '[DEFAULT]',
        authDomain: expect.any(String)
      }));
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(), 
        testEmail, 
        testPassword
      );
      expect(updateProfile).toHaveBeenCalledWith(
        mockUser, 
        { displayName: testDisplayName }
      );
      expect(setDoc).toHaveBeenCalled();
      expect(user).toEqual(mockUser);
    }, 15000);

    it('should throw an error for invalid sign up', async () => {
      // Mock a sign-up error
      const mockError = new Error('Sign up failed');
      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(mockError);

      await expect(signUp(testEmail, testPassword)).rejects.toThrow('Sign up failed');
    });
  });

  describe('Sign In', () => {
    it('should successfully sign in a user', async () => {
      // Mock a successful sign-in
      const mockUser = {
        uid: 'test-uid',
        email: testEmail
      };
      const mockUserCredential = { user: mockUser };
      
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue(mockUserCredential);

      const user = await signIn(testEmail, testPassword);
      
      const authArg = (signInWithEmailAndPassword as jest.Mock).mock.calls[0][0];
      expect(authArg).toEqual(expect.objectContaining({
        apiKey: expect.any(String),
        appName: '[DEFAULT]',
        authDomain: expect.any(String)
      }));
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(), 
        testEmail, 
        testPassword
      );
      expect(user).toEqual(mockUser);
    }, 15000);

    it('should throw an error for invalid credentials', async () => {
      // Mock a sign-in error
      const mockError = new Error('Invalid credentials');
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(mockError);

      await expect(signIn(testEmail, testPassword)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('Google Sign In', () => {
    it('should successfully sign in with Google', async () => {
      // Mock a successful Google sign-in
      const mockUser = {
        uid: 'google-uid',
        email: testEmail,
        displayName: testDisplayName
      };
      const mockUserCredential = { user: mockUser };
      
      (signInWithPopup as jest.Mock).mockResolvedValue(mockUserCredential);
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      const user = await signInWithGoogle();
      
      const authArg = (signInWithPopup as jest.Mock).mock.calls[0][0];
      expect(authArg).toEqual(expect.objectContaining({
        apiKey: expect.any(String),
        appName: '[DEFAULT]',
        authDomain: expect.any(String)
      }));
      expect(signInWithPopup).toHaveBeenCalledWith(
        expect.anything(), 
        expect.any(Object)
      );
      expect(setDoc).toHaveBeenCalled();
      expect(user).toEqual(mockUser);
    }, 15000);

    it('should throw an error for Google sign-in failure', async () => {
      // Mock a Google sign-in error
      const mockError = new Error('Google sign-in failed');
      (signInWithPopup as jest.Mock).mockRejectedValue(mockError);

      await expect(signInWithGoogle()).rejects.toThrow('Google sign-in failed');
    });
  });

  describe('Logout', () => {
    it('should successfully log out', async () => {
      // Mock a successful logout
      (signOut as jest.Mock).mockResolvedValue(undefined);

      await logOut();
      
      const authArg = (signOut as jest.Mock).mock.calls[0][0];
      expect(authArg).toEqual(expect.objectContaining({
        apiKey: expect.any(String),
        appName: '[DEFAULT]',
        authDomain: expect.any(String)
      }));
      expect(signOut).toHaveBeenCalledWith(expect.anything());
    }, 15000);
  });

  describe('Password Reset', () => {
    it('should send a password reset email', async () => {
      // Mock a successful password reset email
      (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);

      await sendPasswordReset(testEmail);
      
      const authArg = (sendPasswordResetEmail as jest.Mock).mock.calls[0][0];
      expect(authArg).toEqual(expect.objectContaining({
        apiKey: expect.any(String),
        appName: '[DEFAULT]',
        authDomain: expect.any(String)
      }));
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        expect.anything(), 
        testEmail
      );
    }, 15000);
  });
});
