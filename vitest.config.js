module.exports = {
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
    // Rules tests need the Firestore emulator; they run via `npm run test:rules`.
    exclude: ['tests/rules/**', 'node_modules/**'],
  },
};
