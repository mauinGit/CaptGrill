/** @type {import('jest').Config} */
module.exports = {
  testMatch: ['<rootDir>/__tests__/**/*.test.js'],
  transform: {
    '^.+\\.js$': ['babel-jest', { presets: ['@babel/preset-env'] }],
  },
};
