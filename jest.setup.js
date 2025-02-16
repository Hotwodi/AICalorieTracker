// Mock Firebase configuration for testing
jest.mock('@/lib/firebase', () => {
  return {
    ...jest.requireActual('@/lib/firebase'),
    auth: {
      currentUser: null
    }
  };
});
