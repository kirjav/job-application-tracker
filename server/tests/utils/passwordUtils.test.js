
jest.mock("bcrypt", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const bcrypt = require("bcrypt");
const {
  isPasswordComplex,
  hashPassword,
  verifyPasswordMatch,
} = require("../../utils/passwordUtils");


describe("Password Utils", () => {
  describe("isPasswordComplex", () => {
    it("should pass for a complex password", () => {
      const result = isPasswordComplex("StrongPass123!");
      expect(result).toBe(true);
    });

    it("should fail if too short", () => {
      const result = isPasswordComplex("S1!");
      expect(result).toBe(false);
    });

    it("should fail without a number", () => {
      const result = isPasswordComplex("NoNumbersHere!");
      expect(result).toBe(false);
    });

    it("should fail without a symbol", () => {
      const result = isPasswordComplex("NoSymbols123");
      expect(result).toBe(false);
    });

    it("should fail without a capital letter", () => {
      const result = isPasswordComplex("nouppercase123!");
      expect(result).toBe(false);
    });
  });

  describe("hashPassword", () => {
    it("should call bcrypt.hash with correct arguments", async () => {
      const fakeHashed = "hashedPassword123";
      bcrypt.hash.mockResolvedValue(fakeHashed);

      const result = await hashPassword("MySecureP@ss1");
      expect(bcrypt.hash).toHaveBeenCalledWith("MySecureP@ss1", 10);
      expect(result).toBe(fakeHashed);
    });
  });

  describe("verifyPasswordMatch", () => {
    it("should resolve without error if passwords match", async () => {
      bcrypt.compare.mockResolvedValue(true);
      await expect(
        verifyPasswordMatch("inputPassword", "hashedPassword")
      ).resolves.toBeUndefined();
    });

    it("should throw 401 error if passwords do not match", async () => {
      bcrypt.compare.mockResolvedValue(false);
      await expect(
        verifyPasswordMatch("wrongPassword", "hashedPassword")
      ).rejects.toMatchObject({
        message: "Invalid credentials",
        status: 401,
      });
    });
  });
});
