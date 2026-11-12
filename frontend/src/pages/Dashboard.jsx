
import { useEffect, useState } from "react";
import {
    useNavigate,
    useOutletContext,
} from "react-router-dom";

import api from "../services/api";
import "./Overview.css";

function Dashboard() {
    const navigate = useNavigate();

    const {
        visibleNotifications = [],
        notificationLoading = false,
        unreadCount = 0,
        handleMarkAsRead = () => {},
    } = useOutletContext() || {};

    const [notificationOpen, setNotificationOpen] = useState(false);

    const [workspaces, setWorkspaces] = useState([]);
    const [projects, setProjects] = useState([]);
    const [boards, setBoards] = useState([]);
    const [issues, setIssues] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const getList = (data) =>
        Array.isArray(data) ? data : data?.results || [];

    // LOAD DASHBOARD DATA
    useEffect(() => {
        const fetchOverview = async () => {
            try {
                const [
                    workspaceResponse,
                    projectResponse,
                    boardResponse,
                    issueResponse,
                ] = await Promise.all([
                    api.get("workspaces/"),
                    api.get("projects/"),
                    api.get("projects/boards/"),
                    api.get("projects/issues/"),
                ]);

                setWorkspaces(getList(workspaceResponse.data));
                setProjects(getList(projectResponse.data));
                setBoards(getList(boardResponse.data));
                setIssues(getList(issueResponse.data));
            } catch (error) {
                console.error("Unable to load overview:", error);
                setError(
                    "Unable to load overview data. Please try again."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchOverview();
    }, []);

    // OPEN NOTIFICATION AND NAVIGATE TO ISSUE
    const handleNotificationClick = async (notification) => {
        try {
            if (!notification.is_read) {
                await handleMarkAsRead(notification.id);
            }

            setNotificationOpen(false);

            navigate(`/issues?issue=${notification.issue}`);

        } catch (error) {
            console.error("Unable to open notification:", error);
        }
    };

    const formatStatus = (status) =>
        status
            ?.replaceAll("_", " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());

    const getProjectName = (projectId) =>
        projects.find((p) => p.id === projectId)?.name ||
        `Project #${projectId}`;

    return (
        <div className="overview-page">

            {/* PAGE HEADER */}
            <header className="overview-header">

                <div className="overview-header-info">
                    <span className="overview-breadcrumb">
                        Workspace / Overview
                    </span>

                    <h1>Overview</h1>

                    <p>
                        Welcome back! Here's what's happening in your workspace.
                    </p>
                </div>

                {/* HEADER ACTIONS */}
                <div className="overview-header-actions">

                    {/* NOTIFICATION BELL */}
                    <div className="overview-notification-wrapper">

                        <button
                            className="overview-notification-bell"
                            onClick={() =>
                                setNotificationOpen((previous) => !previous)
                            }
                            aria-label="Notifications"
                            title="Notifications"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                width="21"
                                height="21"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                                <path d="M10 21h4" />
                            </svg>

                            {unreadCount > 0 && (
                                <span className="overview-notification-badge">
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </span>
                            )}
                        </button>

                        {/* NOTIFICATION DROPDOWN */}
                        {notificationOpen && (
                            <div className="overview-notification-dropdown">

                                <div className="overview-notification-header">
                                    <div>
                                        <h3>Notifications</h3>
                                        <span>{unreadCount} unread</span>
                                    </div>

                                    <button
                                        onClick={() =>
                                            setNotificationOpen(false)
                                        }
                                        aria-label="Close notifications"
                                    >
                                        ×
                                    </button>
                                </div>

                                <div className="overview-notification-list">

                                    {notificationLoading ? (
                                        <div className="overview-notification-empty">
                                            Loading notifications...
                                        </div>
                                    ) : visibleNotifications.length === 0 ? (
                                        <div className="overview-notification-empty">
                                            <p>No notifications yet</p>
                                            <small>
                                                New updates will appear here.
                                            </small>
                                        </div>
                                    ) : (
                                        visibleNotifications.map(
                                            (notification) => (
                                                <div
                                                    key={notification.id}
                                                    className={`overview-notification-item ${
                                                        notification.is_read
                                                            ? "read"
                                                            : "unread"
                                                    }`}
                                                    onClick={() =>
                                                        handleNotificationClick(
                                                            notification
                                                        )
                                                    }
                                                    style={{ cursor: "pointer" }}
                                                    title="Click to open this issue"
                                                >
                                                    <strong>
                                                        {notification.issue_title ||
                                                            "Issue notification"}
                                                    </strong>

                                                    <p>
                                                        {notification.message}
                                                    </p>

                                                    <small>
                                                        {notification.notification_type?.replaceAll(
                                                            "_",
                                                            " "
                                                        )}
                                                        {" · "}
                                                        {new Date(
                                                            notification.created_at
                                                        ).toLocaleString()}
                                                    </small>

                                                    {!notification.is_read ? (
                                                        <button
                                                            className="overview-mark-read"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleMarkAsRead(
                                                                    notification.id
                                                                );
                                                            }}
                                                        >
                                                            Mark as Read
                                                        </button>
                                                    ) : (
                                                        <span className="overview-read-label">
                                                            Read
                                                        </span>
                                                    )}
                                                </div>
                                            )
                                        )
                                    )}

                                </div>
                            </div>
                        )}

                    </div>

                    {/* KANBAN BUTTON */}
                    <button
                        className="overview-kanban-button"
                        onClick={() => navigate("/kanban")}
                    >
                        <span>▥</span>
                        Open Kanban Board
                    </button>

                </div>
            </header>

            {/* LOADING */}
            {loading && (
                <div className="overview-message">
                    Loading overview...
                </div>
            )}

            {/* ERROR */}
            {error && (
                <div className="overview-error">
                    {error}
                </div>
            )}

            {!loading && !error && (
                <>

                    {/* WELCOME SECTION */}
                    <section className="overview-welcome">
                        <div>
                            <span>PROJECTHUB WORKSPACE</span>

                            <h2>
                                Manage everything in one place.
                            </h2>

                            <p>
                                Organize teams, track projects and keep
                                your work moving forward.
                            </p>
                        </div>

                        <div className="overview-welcome-icon">
                            ✦
                        </div>
                    </section>

                    {/* STATISTICS */}
                    <section className="overview-stats">

                        <article className="overview-stat-card">
                            <div className="overview-stat-icon">▣</div>
                            <p>Total Workspaces</p>
                            <h2>{workspaces.length}</h2>
                        </article>

                        <article className="overview-stat-card">
                            <div className="overview-stat-icon">◫</div>
                            <p>Total Projects</p>
                            <h2>{projects.length}</h2>
                        </article>

                        <article className="overview-stat-card">
                            <div className="overview-stat-icon">▤</div>
                            <p>Total Boards</p>
                            <h2>{boards.length}</h2>
                        </article>

                        <article className="overview-stat-card">
                            <div className="overview-stat-icon">☷</div>
                            <p>Total Issues</p>
                            <h2>{issues.length}</h2>
                        </article>

                    </section>

                    {/* QUICK ACCESS */}
                    <section className="overview-quick-section">

                        <div className="overview-section-heading">
                            <div>
                                <h2>Quick Access</h2>
                                <p>
                                    Go directly to the section you want to manage.
                                </p>
                            </div>
                        </div>

                        <div className="overview-quick-grid">

                            <button onClick={() => navigate("/workspaces")}>
                                <span>▣</span>
                                <strong>Workspaces</strong>
                                <small>Manage your team spaces</small>
                            </button>

                            <button onClick={() => navigate("/projects")}>
                                <span>◫</span>
                                <strong>Projects</strong>
                                <small>Manage your projects</small>
                            </button>

                            <button onClick={() => navigate("/boards")}>
                                <span>▤</span>
                                <strong>Boards</strong>
                                <small>Organize project boards</small>
                            </button>

                            <button onClick={() => navigate("/issues")}>
                                <span>☷</span>
                                <strong>Issues</strong>
                                <small>Track tasks and bugs</small>
                            </button>

                        </div>
                    </section>

                    {/* RECENT ISSUES */}
                    <section className="overview-recent-section">

                        <div className="overview-section-heading">
                            <div>
                                <h2>Recent Issues</h2>
                                <p>
                                    Latest tasks across your projects.
                                </p>
                            </div>

                            <button onClick={() => navigate("/issues")}>
                                View All →
                            </button>
                        </div>

                        {issues.length === 0 ? (
                            <div className="overview-empty">
                                No issues available yet.
                            </div>
                        ) : (
                            <div className="overview-issues-list">
                                {issues.slice(0, 5).map((issue) => (
                                    <article
                                        className="overview-issue-row"
                                        key={issue.id}
                                    >
                                        <div>
                                            <strong>{issue.title}</strong>

                                            <p>
                                                ISSUE-{issue.id} ·{" "}
                                                {getProjectName(issue.project)}
                                            </p>
                                        </div>

                                        <span className="overview-issue-status">
                                            {formatStatus(issue.status)}
                                        </span>
                                    </article>
                                ))}
                            </div>
                        )}

                    </section>
                </>
            )}

            <footer className="overview-footer">
                ProjectHub · Multi-Tenant SaaS Project Management Platform
            </footer>

        </div>
    );
}

export default Dashboard;
