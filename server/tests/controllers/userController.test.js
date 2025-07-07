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

// Imports are handled here to make sure the "mock" utils get imported.

// Import Utils
const { getAuthenticatedUser } = require("../../utils/authHelpers");
const { isPasswordComplex, hashPassword, verifyPasswordMatch } = require("../../utils/passwordUtils");

//Import Controllers
const { deleteUser, updateEmail, updatePassword } = require("../../controllers/userController");

const prisma = require("../../utils/prisma");
const bcrypt = require("bcrypt");

describe("userController", () => {

        beforeEach(() => {
        jest.clearAllMocks();
    });
    
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
        let req, res;
        const mockUser = createMockUser();

        beforeEach(() => {
            req = {
                user: { userId: 1 },
                body: {
                    password: "correctPassword",
                    newEmail: "new@example.com"
                }
            };

            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };

            getAuthenticatedUser.mockReset();
            verifyPasswordMatch.mockReset();
            prisma.user.findUnique.mockReset();
            prisma.user.update.mockReset();
        });

        it("should update the user email when password and newEmail are valid", async () => {
            getAuthenticatedUser.mockResolvedValue(mockUser);
            verifyPasswordMatch.mockResolvedValue();
            prisma.user.findUnique.mockResolvedValue(null); // No user with new email
            prisma.user.update.mockResolvedValue({ email: "new@example.com" });

            await updateEmail(req, res);

            expect(getAuthenticatedUser).toHaveBeenCalledWith(1);
            expect(verifyPasswordMatch).toHaveBeenCalledWith("correctPassword", mockUser.password);
            expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: "new@example.com" } });
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { email: "new@example.com" }
            });
            expect(res.json).toHaveBeenCalledWith({ message: "Email updated successfully" });
        });

        it("should return 400 if password is missing", async () => {
            req.body.password = "";

            await updateEmail(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "Password required" });
        });

        it("should return 400 if newEmail is missing", async () => {
            req.body.newEmail = "";

            await updateEmail(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "New email required" });
        });

        it("should return 401 if password is incorrect", async () => {
            getAuthenticatedUser.mockResolvedValue(mockUser);
            verifyPasswordMatch.mockRejectedValue(
                Object.assign(new Error("Invalid credentials"), { status: 401 })
            );

            await updateEmail(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: "Invalid credentials" });
        });

        it("should return 409 if new email is already in use", async () => {
            getAuthenticatedUser.mockResolvedValue(mockUser);
            verifyPasswordMatch.mockResolvedValue();
            prisma.user.findUnique.mockResolvedValue({ id: 2, email: "new@example.com" });

            await updateEmail(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({ error: "Email already in use" });
        });

        it("should handle server errors", async () => {
            getAuthenticatedUser.mockRejectedValue(new Error("DB error"));

            await updateEmail(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "DB error" });
        });
    });


    describe("updatePassword", () => {
        let req, res;
        const mockUser = createMockUser();

        beforeEach(() => {
            req = {
                user: { userId: 1 },
                body: {
                    old_password: "oldPassword123!",
                    new_password: "NewPassword456!"
                }
            };

            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };

            getAuthenticatedUser.mockReset();
            verifyPasswordMatch.mockReset();
            isPasswordComplex.mockReset();
            hashPassword.mockReset();
            prisma.user.update.mockReset();
        });

        it("should update the password if all validations pass", async () => {
            getAuthenticatedUser.mockResolvedValue(mockUser);
            isPasswordComplex.mockReturnValue(true);
            verifyPasswordMatch.mockResolvedValue();
            hashPassword.mockResolvedValue("hashedNewPassword");
            prisma.user.update.mockResolvedValue({});

            await updatePassword(req, res);

            expect(getAuthenticatedUser).toHaveBeenCalledWith(1);
            expect(isPasswordComplex).toHaveBeenCalledWith("NewPassword456!");
            expect(verifyPasswordMatch).toHaveBeenCalledWith("oldPassword123!", mockUser.password);
            expect(hashPassword).toHaveBeenCalledWith("NewPassword456!");
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { password: "hashedNewPassword" },
            });
            expect(res.json).toHaveBeenCalledWith({ message: "Password updated successfully" });
        });

        it("should return 400 if old_password or new_password is missing", async () => {
            req.body.old_password = "";
            req.body.new_password = "";

            await updatePassword(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "Incomplete information" });
        });

        it("should return 400 if new_password is not complex", async () => {
            isPasswordComplex.mockReturnValue(false);

            await updatePassword(req, res);

            expect(isPasswordComplex).toHaveBeenCalledWith("NewPassword456!");
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "Password does not meet complexity requirements" });
        });

        it("should return 401 if old password is incorrect", async () => {
            getAuthenticatedUser.mockResolvedValue(mockUser);
            isPasswordComplex.mockReturnValue(true);
            verifyPasswordMatch.mockRejectedValue(
                Object.assign(new Error("Invalid credentials"), { statusCode: 401 })
            );

            await updatePassword(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: "Invalid credentials" });
        });

        it("should handle server errors", async () => {
            req.body = {
                old_password: "correctOldPassword",
                new_password: "Newpass123!",
            };
            isPasswordComplex.mockReturnValue(true);
            getAuthenticatedUser.mockRejectedValue(new Error("DB error"));

            await updatePassword(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "DB error" });
        });
    });

});
