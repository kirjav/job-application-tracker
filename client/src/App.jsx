import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ApplicationOverview from "./pages/ApplicationOverview";
import Auth from "./pages/Auth";
import AuthRoute from "./routes/AuthRoute";
import GuestRoute from "./routes/GuestRoute";
import AuthenticatedLayout from "./Layouts/AuthenticatedLayout"; // New layout

function App() {
  return (
    <Router>
      <Routes>
        {/* Guest-only route */}
        <Route
          path="/"
          element={
            <GuestRoute>
              <Auth />
            </GuestRoute>
          }
        />

        {/* Authenticated layout wrapper */}
        <Route
          element={
            <AuthRoute>
              <AuthenticatedLayout />
            </AuthRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/applications" element={<ApplicationOverview />} />
          {/* <Route path="/apply" element={<ApplicationForm />} /> */}
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<h1>404 Not Found</h1>} />
      </Routes>
    </Router>
  );
}

export default App;
