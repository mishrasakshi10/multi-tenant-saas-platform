
import os
import stripe


def get_stripe_client():
    """
    Return a configured Stripe client.
    Raises an error if the secret key is unavailable.
    """

    secret_key = os.getenv("STRIPE_SECRET_KEY")

    if not secret_key:
        raise ValueError(
            "STRIPE_SECRET_KEY is not configured."
        )

    return stripe.StripeClient(secret_key)
