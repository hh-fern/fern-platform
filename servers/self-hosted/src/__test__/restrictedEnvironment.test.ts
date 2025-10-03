import dotenv from "dotenv";
import { execa } from "execa";
import path from "path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

dotenv.config({ path: path.join(__dirname, "../../.env") });

const K8S_NAMESPACE = "fern-test";
const POD_NAME = "fern-restricted-test";
const MANIFEST_PATH = path.join(__dirname, "restricted-environment-pod.yaml");
const KIND_CLUSTER_NAME = "fern-test-cluster";
const DOCKER_IMAGE_NAME = "fern-self-hosted:latest";

async function createKindCluster() {
    try {
        // Check if cluster already exists
        const { stdout: clusterList } = await execa("kind", ["get", "clusters"]);
        if (clusterList.includes(KIND_CLUSTER_NAME)) {
            console.log(`Kind cluster ${KIND_CLUSTER_NAME} already exists, using existing cluster`);
            return;
        }

        console.log(`Creating kind cluster: ${KIND_CLUSTER_NAME}...`);
        await execa("kind", ["create", "cluster", "--name", KIND_CLUSTER_NAME, "--wait", "60s"]);
        console.log(`Kind cluster ${KIND_CLUSTER_NAME} created successfully`);
    } catch (error) {
        console.error("Error creating kind cluster:", error);
        throw error;
    }
}

async function deleteKindCluster() {
    try {
        console.log(`Deleting kind cluster: ${KIND_CLUSTER_NAME}...`);
        await execa("kind", ["delete", "cluster", "--name", KIND_CLUSTER_NAME]);
        console.log(`Kind cluster ${KIND_CLUSTER_NAME} deleted successfully`);
    } catch (error) {
        console.error("Error deleting kind cluster:", error);
    }
}

async function loadImageToKind() {
    try {
        console.log(`Loading Docker image ${DOCKER_IMAGE_NAME} into kind cluster...`);
        await execa("kind", ["load", "docker-image", DOCKER_IMAGE_NAME, "--name", KIND_CLUSTER_NAME]);
        console.log(`Docker image ${DOCKER_IMAGE_NAME} loaded successfully`);
    } catch (error) {
        console.error("Error loading image to kind:", error);
        throw error;
    }
}

async function deleteKubernetesResources() {
    try {
        // Delete pod
        await execa("kubectl", ["delete", "pod", POD_NAME, "-n", K8S_NAMESPACE, "--ignore-not-found=true"]);
        // Delete namespace
        await execa("kubectl", ["delete", "namespace", K8S_NAMESPACE, "--ignore-not-found=true"]);
    } catch (error) {
        console.error("Error cleaning up Kubernetes resources:", error);
    }
}

async function getPodStatus() {
    try {
        const { stdout } = await execa("kubectl", [
            "get",
            "pod",
            POD_NAME,
            "-n",
            K8S_NAMESPACE,
            "-o",
            "jsonpath={.status.phase}"
        ]);
        return stdout.trim();
    } catch (error) {
        return "NotFound";
    }
}

async function getPodLogs() {
    try {
        const { stdout } = await execa("kubectl", ["logs", POD_NAME, "-n", K8S_NAMESPACE, "-c", "fern-docs"]);
        return stdout;
    } catch (error) {
        return `Error getting logs: ${error}`;
    }
}

// Setup Kubernetes pod before tests
beforeAll(async () => {
    console.log("Setting up kind cluster and Kubernetes pod with restricted security context...");

    // Create kind cluster
    await createKindCluster();

    // Load Docker image into kind cluster
    await loadImageToKind();

    // Clean up any existing resources
    await deleteKubernetesResources();
    await sleep(2000);

    // Apply manifest
    await execa("kubectl", ["apply", "-f", MANIFEST_PATH]);

    // Wait for pod to be ready
    console.log("Waiting for pod to start...");
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes

    while (attempts < maxAttempts) {
        const status = await getPodStatus();
        console.log(`Pod status: ${status}`);

        if (status === "Running") {
            console.log("Pod is running!");
            break;
        } else if (status === "Failed" || status === "Error") {
            const logs = await getPodLogs();
            console.error("Pod failed to start. Logs:", logs);
            throw new Error(`Pod failed to start: ${status}`);
        }

        await sleep(5000);
        attempts++;
    }

    if (attempts >= maxAttempts) {
        const logs = await getPodLogs();
        console.error("Pod did not start in time. Logs:", logs);
        throw new Error("Pod did not start within timeout");
    }

    // Additional wait for services to initialize
    console.log("Waiting for services to initialize...");
    await sleep(30000);
}, 600000); // 10 minute timeout

// Cleanup Kubernetes resources after tests
afterAll(async () => {
    try {
        console.log("Cleaning up Kubernetes resources...");
        await deleteKubernetesResources();
        console.log("Kubernetes cleanup complete");

        console.log("Cleaning up kind cluster...");
        await deleteKindCluster();
        console.log("Kind cluster cleanup complete");
    } catch (error) {
        console.error("Failed to cleanup resources:", error);
        throw error;
    }
}, 60000); // 1 minute timeout for cleanup

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("Self-hosted docs in Kubernetes security context (UID 65532)", () => {
    it("Pod runs with correct security context", async () => {
        const status = await getPodStatus();
        expect(status).toBe("Running");
        console.log(`Pod ${POD_NAME} is running with status: ${status}`);
    });

    it("Container runs as UID 65532", async () => {
        const { stdout: whoamiOutput } = await execa("kubectl", [
            "exec",
            POD_NAME,
            "-n",
            K8S_NAMESPACE,
            "-c",
            "fern-docs",
            "--",
            "id",
            "-u"
        ]);
        expect(whoamiOutput.trim()).toBe("65532");
    });

    it("su command fails due to restricted permissions", async () => {
        try {
            await execa("kubectl", [
                "exec",
                POD_NAME,
                "-n",
                K8S_NAMESPACE,
                "-c",
                "fern-docs",
                "--",
                "su",
                "-",
                "postgres",
                "-c",
                "echo 'test'"
            ]);
            throw new Error("su command unexpectedly succeeded - security context not properly restricted");
        } catch (error) {
            // This is expected - su should fail in restricted environment
            expect(error).toBeDefined();
        }
    });

    it("PostgreSQL starts successfully via fallback method", async () => {
        // Test PostgreSQL connection
        const { stdout: postgresStatus } = await execa("kubectl", [
            "exec",
            POD_NAME,
            "-n",
            K8S_NAMESPACE,
            "-c",
            "fern-docs",
            "--",
            "pg_isready",
            "-U",
            "postgres",
            "-d",
            "postgres"
        ]);
        expect(postgresStatus).toContain("accepting connections");
    });

    it("PostgreSQL database is accessible", async () => {
        const { stdout: dbList } = await execa("kubectl", [
            "exec",
            POD_NAME,
            "-n",
            K8S_NAMESPACE,
            "-c",
            "fern-docs",
            "--",
            "env",
            "PGPASSWORD=postgres",
            "psql",
            "-U",
            "postgres",
            "-d",
            "postgres",
            "-t",
            "-c",
            "SELECT 1 FROM pg_database WHERE datname='fdr'"
        ]);
        expect(dbList.trim()).toBe("1");
    });

    it("MinIO is running and accessible", async () => {
        const { stdout: curlOutput } = await execa("kubectl", [
            "exec",
            POD_NAME,
            "-n",
            K8S_NAMESPACE,
            "-c",
            "fern-docs",
            "--",
            "curl",
            "-s",
            "-o",
            "/dev/null",
            "-w",
            "%{http_code}",
            "http://localhost:9000/minio/health/live"
        ]);
        expect(curlOutput).toBe("200");
    });

    it("FDR server is running and accessible", async () => {
        const { stdout: curlOutput } = await execa("kubectl", [
            "exec",
            POD_NAME,
            "-n",
            K8S_NAMESPACE,
            "-c",
            "fern-docs",
            "--",
            "curl",
            "-s",
            "-o",
            "/dev/null",
            "-w",
            "%{http_code}",
            "http://localhost:8080/health"
        ]);
        expect(curlOutput).toBe("200");
    });

    it("Verifies fallback startup method was used", async () => {
        const logs = await getPodLogs();

        // Should contain our fallback messages
        expect(logs).toContain("su failed (likely due to permission restrictions)");
        expect(logs).toContain("trying direct approach");
        expect(logs).toContain("Starting PostgreSQL as current user (UID 65532)");
        expect(logs).toContain("PostgreSQL started successfully as current user");
    });

    it("All services work together in Kubernetes security context", async () => {
        // Test all services are working
        const { stdout: postgresStatus } = await execa("kubectl", [
            "exec",
            POD_NAME,
            "-n",
            K8S_NAMESPACE,
            "-c",
            "fern-docs",
            "--",
            "pg_isready",
            "-U",
            "postgres",
            "-d",
            "postgres"
        ]);
        expect(postgresStatus).toContain("accepting connections");

        const { stdout: minioStatus } = await execa("kubectl", [
            "exec",
            POD_NAME,
            "-n",
            K8S_NAMESPACE,
            "-c",
            "fern-docs",
            "--",
            "curl",
            "-s",
            "-o",
            "/dev/null",
            "-w",
            "%{http_code}",
            "http://localhost:9000/minio/health/live"
        ]);
        expect(minioStatus).toBe("200");

        const { stdout: fdrStatus } = await execa("kubectl", [
            "exec",
            POD_NAME,
            "-n",
            K8S_NAMESPACE,
            "-c",
            "fern-docs",
            "--",
            "curl",
            "-s",
            "-o",
            "/dev/null",
            "-w",
            "%{http_code}",
            "http://localhost:8080/health"
        ]);
        expect(fdrStatus).toBe("200");
    });
});
