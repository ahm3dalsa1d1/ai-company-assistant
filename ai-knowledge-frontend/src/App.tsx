import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import AdminRoute from "./components/AdminRoute";
import ProtectedRoute from "./components/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import ChatPage from "./pages/ChatPage";
import DocumentsPage from "./pages/DocumentsPage";


export default function App() {
  return (
    <Routes>

      <Route
        path="/"
        element={
          <Navigate
            to="/chat"
            replace
          />
        }
      />

      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/documents"
        element={
          <AdminRoute>
            <DocumentsPage />
          </AdminRoute>
        }
      />

    </Routes>
  );
}