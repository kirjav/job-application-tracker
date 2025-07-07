const { handleError } = require("../../utils/handleError");

describe("Unit: handleError", () => {
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    // Prevent actual console output during tests
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  it("should return 500 with fallback message if no status or message provided", () => {
    const err = new Error();
    handleError(res, err);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal Server Error" });
  });

  it("should return error with statusCode and message if present", () => {
    const err = new Error("Something went wrong");
    err.statusCode = 400;

    handleError(res, err);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Something went wrong" });
  });

  it("should fallback to err.status if statusCode is missing", () => {
    const err = new Error("Not authorized");
    err.status = 401;

    handleError(res, err);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Not authorized" });
  });

  it("should use fallbackMessage if err.message is missing", () => {
    const err = {};
    handleError(res, err, "Custom fallback");
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Custom fallback" });
  });
});