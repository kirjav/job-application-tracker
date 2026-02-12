import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ApplicationsView from "./pages/ApplicationsView";
import Stats from "./pages/Stats";
import Auth from "./pages/Auth/Auth";
import AuthRoute from "./routes/AuthRoute";
import GuestRoute from "./routes/GuestRoute";
import AuthenticatedLayout from "./Layouts/AuthenticatedLayout/AuthenticatedLayout";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={qc}>
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
            <Route path="/applications" element={<ApplicationsView />} />
            <Route path="/stats" element={<Stats />} />
            {/* <Route path="/apply" element={<ApplicationForm />} /> */}
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<h1>404 Not Found</h1>} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
