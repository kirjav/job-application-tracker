# 📝 Job Application Tracker

A secure, full-stack web app designed to help users manage and track their job applications efficiently. This backend API powers user authentication, job entry creation, tagging, and data filtering features — all while emphasizing **code quality**, **test coverage**, and **modern security practices**.

---

## 🚀 Features

* **User Authentication**
  Secure registration & login using hashed passwords and JWTs. Password complexity is enforced via regex and schema validation.

* **Job Application Management**
  Create, update, delete, and filter job applications by tag, with pagination support.

* **Custom Tag System**
  Users can add, reuse, and delete tags (with validation to restrict special characters and prevent naming collisions).

* **Secure Input Validation**
  Every route uses [Zod](https://zod.dev/) for strong runtime input validation. All user input is sanitized and validated before interacting with the database.

* **Test Coverage**
  Includes **unit tests**, **integration tests**, and **edge case testing** for key service and route logic using **Jest** and **Supertest**.

* **Rate Limiting & Brute Force Protection**
  Sensitive routes (like `/auth`) are protected with `express-rate-limit` to prevent abuse.

* **Security Middleware**
  Uses `helmet` to set security-focused HTTP headers and `cors` to control cross-origin behavior.

---

## 🛠️ Tech Stack

* **Backend**: Node.js, Express
* **Database**: PostgreSQL (via Prisma ORM)
* **Authentication**: JWT, bcrypt
* **Validation**: Zod
* **Testing**: Jest, Supertest
* **Security**: Helmet, express-rate-limit, CORS

---

## ✅ Highlights

* 💡 **Focus on Clean Architecture**: Clear separation of controllers, middleware, validation, and service logic for easy testing and scaling.
* 🔐 **Built-In Security**: Validates every user input and protects routes with layered defense — from Zod schemas to rate limiting.
* 🧪 **Robust Test Coverage**: Confident code changes backed by detailed tests, mocks, and real-world scenarios.
* ⚙️ **Modern Developer Experience**: Uses environment-based configuration and is deployment-ready for services like **Render** or **Vercel**.

---

## 🧠 What I Learned

* Designing **RESTful APIs** with layered validation and security
* Writing **testable service layers** and **end-to-end route tests**
* Leveraging tools like **Zod** and **Prisma** for type-safe and predictable backend logic
* Balancing simplicity and robustness in building scalable backend systems

---

## 🏁 Next Steps

* Deploy backend (e.g., Render/Fly.io) and connect to a hosted PostgreSQL instance
* Build the **React frontend** (deployment via Vercel)
* Add user-facing dashboards and charts for job tracking insights

