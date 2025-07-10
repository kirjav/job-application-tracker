import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ApplicationForm from "./components/ApplicationForm";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import AuthRoute from "./routes/AuthRoute";
import GuestRoute from "./routes/GuestRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <GuestRoute>
              <Auth />
            </GuestRoute>
          }
        />
        <Route
          path="/apply"
          element={
            <AuthRoute>
              <ApplicationForm />
            </AuthRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <AuthRoute>
              <Dashboard />
            </AuthRoute>
          }
        />
        <Route path="*" element={<h1>404 Not Found</h1>} />
      </Routes>
    </Router>
  );
}

export default App;
