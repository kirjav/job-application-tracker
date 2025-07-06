const { isPasswordComplex } = require("../../utils/passwordUtils");

describe("Password Complexity Check", () => {
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
