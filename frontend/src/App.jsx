
import { Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import KanbanBoard from "./pages/KanbanBoard";
import Workspaces from "./pages/Workspaces";
import Projects from "./pages/Projects";
import Boards from "./pages/Boards";
import Issues from "./pages/Issues";

import "./App.css";

function PublicRoute({ children }) {
    const { isAuthenticated } = useAuth();

    return isAuthenticated
        ? <Navigate to="/dashboard" replace />
        : children;
}

function AppRoutes() {
    return (
        <Routes>
            <Route
                path="/"
                element={<Navigate to="/dashboard" replace />}
            />

            <Route
                path="/login"
                element={
                    <PublicRoute>
                        <Login />
                    </PublicRoute>
                }
            />

            <Route
                path="/register"
                element={
                    <PublicRoute>
                        <Register />
                    </PublicRoute>
                }
            />

            <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />

                   <Route path="/workspaces" element={<Workspaces />} />

                   <Route path="/projects" element={<Projects />} />

                   <Route path="/boards" element={<Boards />} />
                    
                   <Route path="/issues" element={<Issues />} />

                    <Route path="/kanban" element={<KanbanBoard />} />
                </Route>
            </Route>

            <Route
                path="*"
                element={<Navigate to="/" replace />}
            />
        </Routes>
    );
}

function App() {
    return (
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    );
}

export default App;
