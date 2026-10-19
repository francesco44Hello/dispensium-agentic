module.exports = {
  test: {
    environment: 'node',
    include: ['tests/rules/**/*.test.ts'],
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 20000,
  },
};
