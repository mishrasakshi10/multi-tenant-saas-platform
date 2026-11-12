
import { useEffect, useState } from "react";
import {
    NavLink,
    Outlet,
    useNavigate,
    useLocation,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./AppLayout.css";

function AppLayout() {
    const {
        logout,
        selectedWorkspaceId,
        setSelectedWorkspaceId,
    } = useAuth();

    const navigate = useNavigate();
    const location = useLocation();

    const [workspaces, setWorkspaces] = useState([]);
    const [workspaceLoading, setWorkspaceLoading] = useState(true);

    const [notifications, setNotifications] = useState([]);
    const [notificationLoading, setNotificationLoading] = useState(false);

    const getList = (data) => {
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.results)) return data.results;
        return [];
    };

    // LOAD WORKSPACES
    useEffect(() => {
        const fetchWorkspaces = async () => {
            try {
                const response = await api.get("workspaces/");
                setWorkspaces(getList(response.data));
            } catch (error) {
                console.error("Unable to load workspaces:", error);
            } finally {
                setWorkspaceLoading(false);
            }
        };

        fetchWorkspaces();
    }, []);

    // SET INITIAL / URL-SELECTED WORKSPACE
    useEffect(() => {
        if (workspaceLoading || workspaces.length === 0) return;

        const params = new URLSearchParams(location.search);
        const workspaceFromUrl = params.get("workspace");

        const validWorkspace = (id) =>
            workspaces.some(
                (workspace) => String(workspace.id) === String(id)
            );

        if (workspaceFromUrl && validWorkspace(workspaceFromUrl)) {
            if (String(selectedWorkspaceId) !== String(workspaceFromUrl)) {
                setSelectedWorkspaceId(workspaceFromUrl);
            }
            return;
        }

        if (
            selectedWorkspaceId &&
            validWorkspace(selectedWorkspaceId)
        ) {
            return;
        }

        setSelectedWorkspaceId(workspaces[0].id);
    }, [
        workspaceLoading,
        workspaces,
        location.search,
        selectedWorkspaceId,
        setSelectedWorkspaceId,
    ]);

    // LOAD NOTIFICATIONS
    useEffect(() => {
        const fetchNotifications = async () => {
            setNotificationLoading(true);

            try {
                const response = await api.get("projects/notifications/");
                setNotifications(getList(response.data));
            } catch (error) {
                console.error("Unable to load notifications:", error);
                setNotifications([]);
            } finally {
                setNotificationLoading(false);
            }
        };

        fetchNotifications();
    }, [selectedWorkspaceId]);

    // FILTER BY SELECTED WORKSPACE
    const visibleNotifications = notifications.filter((notification) => {
        if (!selectedWorkspaceId) return true;

        return (
            String(notification.workspace) ===
            String(selectedWorkspaceId)
        );
    });

    const unreadCount = visibleNotifications.filter(
        (notification) => !notification.is_read
    ).length;

    // MARK AS READ
    const handleMarkAsRead = async (notificationId) => {
        try {
            await api.patch(
                `projects/notifications/${notificationId}/`,
                { is_read: true }
            );

            setNotifications((previous) =>
                previous.map((notification) =>
                    notification.id === notificationId
                        ? { ...notification, is_read: true }
                        : notification
                )
            );
        } catch (error) {
            console.error("Unable to mark notification as read:", error);
            alert("Unable to update notification. Please try again.");
        }
    };

    // CHANGE WORKSPACE
    const handleWorkspaceChange = (event) => {
        const workspaceId = event.target.value;

        setSelectedWorkspaceId(workspaceId);

        if (location.pathname === "/projects") {
            navigate(
                workspaceId
                    ? `/projects?workspace=${workspaceId}`
                    : "/projects"
            );
        }
    };

    // LOGOUT
    const handleLogout = async () => {
        try {
            await logout();
        } finally {
            navigate("/login");
        }
    };

    const navItems = [
        { path: "/dashboard", label: "Overview", icon: "▦" },
        { path: "/workspaces", label: "Workspaces", icon: "▣" },
        { path: "/projects", label: "Projects", icon: "◫" },
        { path: "/boards", label: "Boards", icon: "▤" },
        { path: "/issues", label: "Issues", icon: "☷" },
        { path: "/kanban", label: "Kanban Board", icon: "▥" },
    ];

    return (
        <div className="app-layout">

            <aside className="app-sidebar">

                <div className="app-brand">
                    <div className="app-brand-icon">P</div>

                    <div>
                        <h2>ProjectHub</h2>
                        <span>WORKSPACE</span>
                    </div>
                </div>

                {/* WORKSPACE SWITCHER */}
                <div className="workspace-switcher">
                    <label htmlFor="global-workspace">
                        CURRENT WORKSPACE
                    </label>

                    <select
                        id="global-workspace"
                        value={selectedWorkspaceId || ""}
                        onChange={handleWorkspaceChange}
                        disabled={workspaceLoading || workspaces.length === 0}
                    >
                        {workspaceLoading ? (
                            <option value="">Loading workspaces...</option>
                        ) : workspaces.length === 0 ? (
                            <option value="">No workspaces available</option>
                        ) : (
                            workspaces.map((workspace) => (
                                <option
                                    key={workspace.id}
                                    value={workspace.id}
                                >
                                    {workspace.name}
                                </option>
                            ))
                        )}
                    </select>
                </div>

                <div className="app-sidebar-label">MENU</div>

                <nav className="app-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `app-nav-item ${isActive ? "active" : ""}`
                            }
                        >
                            <span className="app-nav-icon">
                                {item.icon}
                            </span>

                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="app-sidebar-bottom">
                    <div className="app-sidebar-label">ACCOUNT</div>

                    <button
                        className="app-nav-item app-logout"
                        onClick={handleLogout}
                    >
                        <span className="app-nav-icon">↪</span>
                        Logout
                    </button>

                    <div className="app-sidebar-version">
                        ProjectHub · SaaS Platform
                    </div>
                </div>

            </aside>

            <main className="app-main">
                <div className="app-page-content">
                    <Outlet
                        context={{
                            visibleNotifications,
                            notificationLoading,
                            unreadCount,
                            handleMarkAsRead,
                        }}
                    />
                </div>
            </main>

        </div>
    );
}

export default AppLayout;
