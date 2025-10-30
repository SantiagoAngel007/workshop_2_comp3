module.exports = {
  hashSync: jest.fn((password) => `hashed_${password}`),
  compareSync: jest.fn(() => true),
  hash: jest.fn((password) => Promise.resolve(`hashed_${password}`)),
  compare: jest.fn(() => Promise.resolve(true)),
};
