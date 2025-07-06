function createMockUser(overrides = {}) {
  return {
    id: 1,
    email: "test@example.com",
    password: "hashedpassword123",
    ...overrides,
  };
}

module.exports = { createMockUser };