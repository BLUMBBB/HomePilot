"""Load test for HomePilot's read-heavy paths.

Run locally / against staging (NOT production — this creates real user rows
and the prod VPS is 1 vCPU / 2 GB RAM, easily overwhelmed):

    pip install locust
    locust -f loadtest/locustfile.py --host http://localhost --users 50 \
        --spawn-rate 5 --run-time 3m --headless

Each simulated user registers a unique throwaway account, logs in, then
loops over the read endpoints a logged-in client hits most (catalog,
own subscriptions, own visits). Payment endpoints are intentionally
excluded from this test.
"""
import random
import uuid

from locust import HttpUser, task, between


class HomePilotUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        email = f"loadtest-{uuid.uuid4().hex[:12]}@example.com"
        password = "LoadTest123"
        self.client.post(
            "/api/v1/auth/register",
            json={
                "name": "Load Test",
                "email": email,
                "password": password,
                "locale": "ru",
                "accept_personal_data_processing": True,
            },
            name="/auth/register",
        )
        resp = self.client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": password},
            name="/auth/login",
        )
        token = resp.json().get("access_token") if resp.ok else None
        self.headers = {"Authorization": f"Bearer {token}"} if token else {}

    @task(5)
    def health(self):
        self.client.get("/health", name="/health")

    @task(4)
    def browse_catalog(self):
        self.client.get("/api/v1/cities", name="/cities")
        self.client.get("/api/v1/tariffs", name="/tariffs")
        self.client.get("/api/v1/apartment-types", name="/apartment-types")

    @task(3)
    def list_own_subscriptions(self):
        self.client.get("/api/v1/subscriptions", headers=self.headers, name="/subscriptions (auth)")

    @task(2)
    def list_own_visits(self):
        self.client.get("/api/v1/visits", headers=self.headers, name="/visits (auth)")

    @task(1)
    def random_wait(self):
        pass
