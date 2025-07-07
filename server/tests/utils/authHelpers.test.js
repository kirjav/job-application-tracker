const { getAuthenticatedUser } = require("../../utils/authHelpers");

jest.mock("../../utils/prisma", () => ({
  user: {
    findUnique: jest.fn(),
  },
}));

const prisma = require("../../utils/prisma");

describe("Unit: getAuthenticatedUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw an error if userId is missing", async () => {
    await expect(getAuthenticatedUser()).rejects.toThrow("User ID is required");
  });

  it("should throw 404 error if user is not found", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    try {
      await getAuthenticatedUser(1);
    } catch (err) {
      expect(err.message).toBe("User not found");
      expect(err.statusCode).toBe(404);
    }
  });

  it("should return user if found", async () => {
    const mockUser = { id: 1, email: "test@example.com" };
    prisma.user.findUnique.mockResolvedValue(mockUser);

    const user = await getAuthenticatedUser(1);
    expect(user).toEqual(mockUser);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });
});
