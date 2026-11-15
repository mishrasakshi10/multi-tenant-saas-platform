
import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import api from "../services/api";
import "./Billing.css";

function Billing() {
    const { selectedWorkspaceId } = useAuth();

    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(false);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchSubscription = async () => {
            if (!selectedWorkspaceId) {
                setSubscription(null);
                return;
            }

            setLoading(true);
            setError("");

            try {
                const response = await api.get(
                    `billing/workspaces/${selectedWorkspaceId}/subscription/`
                );

                setSubscription(response.data);
            } catch (err) {
                if (err.response?.status === 404) {
                    setSubscription(null);
                } else {
                    setError(
                        err.response?.data?.detail ||
                        "Unable to load subscription details."
                    );
                }
            } finally {
                setLoading(false);
            }
        };

        fetchSubscription();
    }, [selectedWorkspaceId]);

    const handleUpgrade = async () => {
        if (!selectedWorkspaceId) return;

        setCheckoutLoading(true);
        setError("");

        try {
            const response = await api.post(
                `billing/workspaces/${selectedWorkspaceId}/checkout/`
            );

            if (response.data.checkout_url) {
                window.location.href = response.data.checkout_url;
            } else {
                setError("Checkout URL was not returned.");
            }
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Unable to start checkout. Please try again."
            );
        } finally {
            setCheckoutLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return "Not available";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    if (!selectedWorkspaceId) {
        return (
            <div className="billing-page">
                <h1>Billing & Subscription</h1>
                <p className="billing-message">
                    Please select a workspace to view billing details.
                </p>
            </div>
        );
    }

    return (
        <div className="billing-page">
            <div className="billing-header">
                <div>
                    <h1>Billing & Subscription</h1>
                    <p>
                        Manage your workspace plan and subscription.
                    </p>
                </div>
            </div>

            {error && (
                <div className="billing-error">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="billing-message">
                    Loading subscription details...
                </div>
            ) : (
                <div className="billing-card">
                    <div className="billing-card-header">
                        <div>
                            <span className="billing-label">
                                CURRENT PLAN
                            </span>

                            <h2>
                                {subscription?.plan_name || "Free"}
                            </h2>
                        </div>

                        <span className={`billing-status ${
                            subscription?.status === "active"
                                ? "status-active"
                                : "status-inactive"
                        }`}>
                            {subscription?.status || "free"}
                        </span>
                    </div>

                    <div className="billing-divider" />

                    <div className="billing-details">
                        <div>
                            <span>Subscription Status</span>
                            <strong>
                                {subscription?.status || "No paid subscription"}
                            </strong>
                        </div>

                        <div>
                            <span>Current Period Ends</span>
                            <strong>
                                {formatDate(subscription?.current_period_end)}
                            </strong>
                        </div>

                        <div>
                            <span>Cancel at Period End</span>
                            <strong>
                                {subscription?.cancel_at_period_end
                                    ? "Yes"
                                    : "No"}
                            </strong>
                        </div>
                    </div>

                    <div className="billing-divider" />

                    <div className="billing-actions">
                        <div>
                            <h3>Upgrade your workspace</h3>
                            <p>
                                Choose a paid plan to access subscription features.
                            </p>
                        </div>

                        <button
                            className="billing-upgrade-button"
                            onClick={handleUpgrade}
                            disabled={checkoutLoading}
                        >
                            {checkoutLoading
                                ? "Starting checkout..."
                                : "Upgrade Plan"}
                        </button>
                    </div>

                    <p className="billing-note">
                        Payments are processed securely through Stripe.
                        Checkout requires Stripe account configuration.
                    </p>
                </div>
            )}
        </div>
    );
}

export default Billing;
