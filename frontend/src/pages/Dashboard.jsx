
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Overview.css";

function Dashboard() {
    const navigate = useNavigate();

    const [workspaces, setWorkspaces] = useState([]);
    const [projects, setProjects] = useState([]);
    const [boards, setBoards] = useState([]);
    const [issues, setIssues] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const getList = (data) =>
        Array.isArray(data) ? data : data?.results || [];

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
            } catch {
                setError("Unable to load overview data. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchOverview();
    }, []);

    const formatStatus = (status) =>
        status?.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

    const getProjectName = (projectId) =>
        projects.find((p) => p.id === projectId)?.name ||
        `Project #${projectId}`;

    return (
        <div className="overview-page">

            <header className="overview-header">
                <div>
                    <span className="overview-breadcrumb">
                        Workspace / Overview
                    </span>
                    <h1>Overview</h1>
                    <p>Welcome back! Here's what's happening in your workspace.</p>
                </div>

                <button
                    className="overview-kanban-button"
                    onClick={() => navigate("/kanban")}
                >
                    ▥ Open Kanban Board
                </button>
            </header>

            {loading && (
                <div className="overview-message">
                    Loading overview...
                </div>
            )}

            {error && (
                <div className="overview-error">
                    {error}
                </div>
            )}

            {!loading && !error && (
                <>
                    <section className="overview-welcome">
                        <div>
                            <span>PROJECTHUB WORKSPACE</span>
                            <h2>Manage everything in one place.</h2>
                            <p>
                                Organize teams, track projects and keep
                                your work moving forward.
                            </p>
                        </div>
                        <div className="overview-welcome-icon">✦</div>
                    </section>

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

                    <section className="overview-quick-section">
                        <div className="overview-section-heading">
                            <div>
                                <h2>Quick Access</h2>
                                <p>Go directly to the section you want to manage.</p>
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

                    <section className="overview-recent-section">
                        <div className="overview-section-heading">
                            <div>
                                <h2>Recent Issues</h2>
                                <p>Latest tasks across your projects.</p>
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
