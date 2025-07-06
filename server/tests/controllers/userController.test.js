
const prisma = require("../../utils/prisma");
const bcrypt = require("bcrypt");

// Mock Data Functions:
const { createMockUser } = require("../__mocks__/mockUser");

jest.mock("../../utils/prisma", () => ({
    user: {
        findUnique: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
    },
}));

jest.mock("bcrypt", () => ({
    compare: jest.fn(),
    hash: jest.fn(),
}));

jest.mock("../../utils/authHelpers", () => ({
    getAuthenticatedUser: jest.fn(),
}));

jest.mock("../../utils/passwordUtils", () => ({
    isPasswordComplex: jest.fn(),
    hashPassword: jest.fn(),
    verifyPasswordMatch: jest.fn(),
}));

jest.mock("../../utils/handleError", () => ({
    handleError: jest.fn((res, err, fallbackMessage) => {
        const status = err.statusCode || err.status || 500;
        const message = err.message || fallbackMessage;
        return res.status(status).json({ error: message });
    }),
}));


// Import Utils
const { getAuthenticatedUser } = require("../../utils/authHelpers");
const { isPasswordComplex, hashPassword, verifyPasswordMatch } = require("../../utils/passwordUtils");

//Import Controllers
const { deleteUser, updateEmail, updatePassword } = require("../../controllers/userController");

describe("userController", () => {
    describe("deleteUser", () => {
        let req, res;

        beforeEach(() => {
            req = {
                user: { userId: 1 },
                body: { password: "correctPassword" },
            };

            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
                send: jest.fn(),
            };
        });

        it("should delete a user with correct password", async () => {
            const mockUser = createMockUser();

            getAuthenticatedUser.mockResolvedValue(mockUser);
            verifyPasswordMatch.mockResolvedValue();
            prisma.user.delete.mockResolvedValue({});

            await deleteUser(req, res);

            expect(getAuthenticatedUser).toHaveBeenCalledWith(1);
            expect(verifyPasswordMatch).toHaveBeenCalledWith("correctPassword", mockUser.password);
            expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 1 } });
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
        });

        it("should return 400 if password is missing", async () => {
            req.body.password = "";

            await deleteUser(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "Password required" });
        });

        it("should return 401 if password is incorrect", async () => {
            const mockUser = createMockUser();

            getAuthenticatedUser.mockResolvedValue(mockUser);

            verifyPasswordMatch.mockRejectedValue(
                Object.assign(new Error("Invalid credentials"), {
                    statusCode: 401,
                    status: 401, // include this to be extra safe
                })
            );


            await deleteUser(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: "Invalid credentials" });
        });

        it("should handle server errors", async () => {
            getAuthenticatedUser.mockRejectedValue(new Error("DB error"));

            await deleteUser(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "DB error" });

        });
    });

    describe("updateEmail", () => {
        it("should update the user email when password and new_email are valid", async () => {
            // TODO: implement
        });

        it("should return 400 if new_email is missing", async () => {
            // TODO: implement
        });

        // ... other relevant edge cases
    });

    describe("updatePassword", () => {
        it("should update the password if all validations pass", async () => {
            // TODO: implement
        });

        it("should return 400 if new_password is not complex", async () => {
            // TODO: implement
        });

        // ... other relevant edge cases
    });
});
