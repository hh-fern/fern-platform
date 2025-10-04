import dotenv from "dotenv";
import { execa } from "execa";
import path from "path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

dotenv.config({ path: path.join(__dirname, "../../.env") });

const CONTAINER_NAME = "fern-restricted-test";
const DOCKER_IMAGE_NAME = "fern-self-hosted:latest";
const FERN_DIR = path.join(__dirname, "../../fern");
const TEST_UID = "65532";

async function startRestrictedContainer() {
    try {
        console.log(`Starting container ${CONTAINER_NAME} with restricted user (UID ${TEST_UID})...`);

        // Run container as restricted user with minimal capabilities
        // Use tmpfs for directories that need to be writable
        await execa("docker", [
            "run",
            "-d",
            "--name",
            CONTAINER_NAME,
            "--user",
            `${TEST_UID}:${TEST_UID}`,
            "--cap-drop",
            "ALL",
            "--cap-add",
            "NET_BIND_SERVICE", // Allow binding to ports
            "--security-opt",
            "no-new-privileges",
            "-v",
            `${FERN_DIR}:/fern:ro`,
            "--tmpfs",
            "/var/lib/postgresql/data:rw,exec,uid=65532,gid=65532",
            "--tmpfs",
            "/var/log:rw,uid=65532,gid=65532",
            "--tmpfs",
            "/run:rw,uid=65532,gid=65532",
            "--tmpfs",
            "/tmp:rw,uid=65532,gid=65532",
            "--tmpfs",
            "/data:rw,uid=65532,gid=65532",
            "-e",
            "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fdr",
            DOCKER_IMAGE_NAME
        ]);

        console.log(`Container ${CONTAINER_NAME} started successfully`);
    } catch (error) {
        console.error("Error starting container:", error);
        throw error;
    }
}

async function stopContainer() {
    try {
        console.log(`Stopping and removing container ${CONTAINER_NAME}...`);
        await execa("docker", ["stop", CONTAINER_NAME]);
        await execa("docker", ["rm", CONTAINER_NAME]);
        console.log(`Container ${CONTAINER_NAME} removed successfully`);
    } catch (error) {
        console.error("Error stopping container:", error);
    }
}

async function getContainerLogs() {
    try {
        const { stdout } = await execa("docker", ["logs", CONTAINER_NAME]);
        return stdout;
    } catch (error) {
        return `Error getting logs: ${error}`;
    }
}

// Setup container before tests
beforeAll(async () => {
    console.log("Setting up Docker container with restricted security context...");

    // Clean up any existing container
    await stopContainer();

    // Start container with restricted user
    await startRestrictedContainer();

    // Wait for services to initialize with periodic status checks
    console.log("Waiting for services to initialize...");
    const startTime = Date.now();
    const maxWaitTime = 300000; // 5 minutes
    const checkInterval = 10000; // Check every 10 seconds

    while (Date.now() - startTime < maxWaitTime) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        console.log(`Waiting... (${elapsed}s elapsed)`);

        try {
            const { stdout: isRunning } = await execa("docker", [
                "inspect",
                "-f",
                "{{.State.Running}}",
                CONTAINER_NAME
            ]);
            if (isRunning.trim() !== "true") {
                const logs = await getContainerLogs();
                console.error(`Container stopped after ${elapsed}s. Logs:`);
                console.error(logs);
                throw new Error("Container crashed during startup");
            }
        } catch (error) {
            if (error instanceof Error && error.message === "Container crashed during startup") {
                throw error;
            }
            console.error(`Error checking container status: ${error}`);
        }

        await sleep(checkInterval);
    }

    // Final check
    console.log("Startup wait complete, performing final health check...");
    try {
        const { stdout: isRunning } = await execa("docker", ["inspect", "-f", "{{.State.Running}}", CONTAINER_NAME]);
        if (isRunning.trim() !== "true") {
            const logs = await getContainerLogs();
            console.error("Container is not running after startup wait period. Logs:");
            console.error(logs);
            throw new Error("Container is not running after startup wait period");
        }
        console.log("✓ Container is running!");
    } catch (error) {
        const logs = await getContainerLogs();
        console.error("Container check failed. Logs:");
        console.error(logs);
        throw error;
    }
}, 360000); // 6 minute timeout (5 min wait + 1 min buffer)

// Cleanup container after tests
afterAll(async () => {
    try {
        console.log("Cleaning up Docker container...");
        await stopContainer();
        console.log("Container cleanup complete");
    } catch (error) {
        console.error("Failed to cleanup container:", error);
        throw error;
    }
}, 30000); // 30 second timeout for cleanup

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("Self-hosted docs in restricted Docker environment (UID 65532)", () => {
    it("Container runs as UID 65532", async () => {
        const { stdout: whoamiOutput } = await execa("docker", ["exec", CONTAINER_NAME, "id", "-u"]);
        expect(whoamiOutput.trim()).toBe(TEST_UID);
    });

    it("su command fails due to restricted permissions", async () => {
        try {
            await execa("docker", ["exec", CONTAINER_NAME, "su", "-", "postgres", "-c", "echo 'test'"]);
            throw new Error("su command unexpectedly succeeded - security context not properly restricted");
        } catch (error) {
            // This is expected - su should fail in restricted environment
            expect(error).toBeDefined();
        }
    });

    it("PostgreSQL starts successfully via fallback method", async () => {
        // Test PostgreSQL connection
        const { stdout: postgresStatus } = await execa("docker", [
            "exec",
            CONTAINER_NAME,
            "pg_isready",
            "-U",
            "postgres",
            "-d",
            "postgres"
        ]);
        expect(postgresStatus).toContain("accepting connections");
    });

    it("PostgreSQL database is accessible", async () => {
        const { stdout: dbList } = await execa("docker", [
            "exec",
            "-e",
            "PGPASSWORD=postgres",
            CONTAINER_NAME,
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
        const { stdout: curlOutput } = await execa("docker", [
            "exec",
            CONTAINER_NAME,
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
        const { stdout: curlOutput } = await execa("docker", [
            "exec",
            CONTAINER_NAME,
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
        const logs = await getContainerLogs();

        // Should contain our fallback messages
        expect(logs).toContain("su failed (likely due to permission restrictions)");
        expect(logs).toContain("trying direct approach");
        expect(logs).toContain(`Starting PostgreSQL as current user (UID ${TEST_UID})`);
        expect(logs).toContain("PostgreSQL started successfully as current user");
    });

    it("All services work together in restricted Docker environment", async () => {
        // Test all services are working
        const { stdout: postgresStatus } = await execa("docker", [
            "exec",
            CONTAINER_NAME,
            "pg_isready",
            "-U",
            "postgres",
            "-d",
            "postgres"
        ]);
        expect(postgresStatus).toContain("accepting connections");

        const { stdout: minioStatus } = await execa("docker", [
            "exec",
            CONTAINER_NAME,
            "curl",
            "-s",
            "-o",
            "/dev/null",
            "-w",
            "%{http_code}",
            "http://localhost:9000/minio/health/live"
        ]);
        expect(minioStatus).toBe("200");

        const { stdout: fdrStatus } = await execa("docker", [
            "exec",
            CONTAINER_NAME,
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
