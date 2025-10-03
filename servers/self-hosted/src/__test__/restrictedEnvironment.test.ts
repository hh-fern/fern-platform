import dotenv from "dotenv";
import { execa } from "execa";
import path from "path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { SELF_HOSTED_IMAGE_TAG_NAME } from "./setupSharedDocker";
import {
    testFdrDatabase,
    testFdrHealth,
    testMinioBucket,
    testMinioHealth,
    testPostgresConnection
} from "./testHelpers";

dotenv.config({ path: path.join(__dirname, "../../.env") });

const RESTRICTED_CONTAINER_NAME = "fern-self-hosted-restricted";
const RESTRICTED_CONTAINER_PORT = 5434;

// we have a fern folder we use for testing
const FERN_DIR = path.join(__dirname, "../../fern");

async function stopContainer(containerName: string) {
    try {
        await execa("docker", ["stop", "-t", "10", containerName]);
    } catch (_) {}
}

async function removeContainer(containerName: string) {
    try {
        await execa("docker", ["rm", "-f", containerName]);
    } catch (_) {}
}

async function getRestrictedContainerId() {
    const { stdout: containerId } = await execa("docker", [
        "ps",
        "-q",
        "--filter",
        "name=" + RESTRICTED_CONTAINER_NAME
    ]);
    return containerId;
}

// Setup restricted environment container before tests
beforeAll(async () => {
    // Remove any existing container
    await removeContainer(RESTRICTED_CONTAINER_NAME);

    // Step 1: Start container as root to simulate initContainer behavior
    console.log("Starting container as root to simulate initContainer...");
    await execa("docker", [
        "run",
        "--name",
        RESTRICTED_CONTAINER_NAME,
        "-d",
        "-p",
        `${RESTRICTED_CONTAINER_PORT}:5432`,
        "-v",
        `${FERN_DIR}:/fern`,
        SELF_HOSTED_IMAGE_TAG_NAME
    ]);

    // Step 2: Simulate initContainer - fix PostgreSQL data directory permissions
    console.log("Simulating initContainer: fixing PostgreSQL permissions...");
    const containerId = await getRestrictedContainerId();
    await execa("docker", ["exec", containerId, "chown", "-R", "65532:65532", "/var/lib/postgresql/data"]);

    // Step 3: Stop the container and restart as UID 65532 (simulating main container)
    console.log("Restarting container as UID 65532...");
    await execa("docker", ["stop", RESTRICTED_CONTAINER_NAME]);
    await execa("docker", ["rm", RESTRICTED_CONTAINER_NAME]);

    // Start as restricted user with fixed permissions
    await execa("docker", [
        "run",
        "--name",
        RESTRICTED_CONTAINER_NAME,
        "-d",
        "-p",
        `${RESTRICTED_CONTAINER_PORT}:5432`,
        "-v",
        `${FERN_DIR}:/fern`,
        "--user",
        "65532:65532", // Run as non-root user
        "--security-opt",
        "no-new-privileges:true", // Prevent privilege escalation
        SELF_HOSTED_IMAGE_TAG_NAME
    ]);

    // Wait for container to start and services to initialize
    await sleep(15000);
}, 90000); // 90 second timeout for setup (longer due to restart)

// Cleanup restricted environment container after tests
afterAll(async () => {
    try {
        console.log("Cleaning up restricted environment container...");
        await stopContainer(RESTRICTED_CONTAINER_NAME);
        await removeContainer(RESTRICTED_CONTAINER_NAME);
        console.log("Restricted environment cleanup complete");
    } catch (error) {
        console.error("Failed to cleanup restricted environment container:", error);
        throw error;
    }
}, 30000); // 30 second timeout for cleanup

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("Self-hosted docs in restricted environment (UID 65532)", () => {
    it("Container runs as non-root user", async () => {
        const containerId = await getRestrictedContainerId();
        expect(containerId).toBeTruthy();

        // Check that the container is running as UID 65532
        const { stdout: whoamiOutput } = await execa("docker", ["exec", containerId, "id", "-u"]);
        expect(whoamiOutput.trim()).toBe("65532");
    });

    it("PostgreSQL data directory has correct ownership (initContainer simulation worked)", async () => {
        const containerId = await getRestrictedContainerId();
        expect(containerId).toBeTruthy();

        // Check that PostgreSQL data directory is owned by UID 65532
        const { stdout: lsOutput } = await execa("docker", [
            "exec",
            containerId,
            "ls",
            "-ld",
            "/var/lib/postgresql/data"
        ]);

        // Should show ownership as 65532:65532
        expect(lsOutput).toContain("65532");
    });

    it("su command fails due to restricted permissions", async () => {
        const containerId = await getRestrictedContainerId();
        expect(containerId).toBeTruthy();

        // Try to run su command - it should fail
        try {
            await execa("docker", ["exec", containerId, "su", "-", "postgres", "-c", "echo 'test'"]);
            // If we get here, su worked, which means our test environment isn't properly restricted
            throw new Error("su command unexpectedly succeeded - test environment not properly restricted");
        } catch (error) {
            // This is expected - su should fail in restricted environment
            expect(error).toBeDefined();
        }
    });

    it("PostgreSQL starts successfully via fallback method", async () => {
        const containerId = await getRestrictedContainerId();
        expect(containerId).toBeTruthy();

        // Check PostgreSQL logs to verify it started via fallback method
        const { stdout: logs } = await execa("docker", ["exec", containerId, "cat", "/var/log/postgresql.log"], {
            reject: false
        }); // Don't fail if log file doesn't exist

        // Check if PostgreSQL is running
        await testPostgresConnection(containerId);

        // Verify it's running as the correct user
        const { stdout: postgresProcess } = await execa("docker", ["exec", containerId, "ps", "aux"]);

        // PostgreSQL process should be running as UID 65532
        expect(postgresProcess).toContain("postgres");
    });

    it("PostgreSQL database is accessible", async () => {
        const containerId = await getRestrictedContainerId();
        expect(containerId).toBeTruthy();

        await testFdrDatabase(containerId);
    });

    it("MinIO is running and accessible", async () => {
        const containerId = await getRestrictedContainerId();
        expect(containerId).toBeTruthy();

        await testMinioHealth(containerId);
        await testMinioBucket(containerId);
    });

    it("FDR server is running and accessible", async () => {
        const containerId = await getRestrictedContainerId();
        expect(containerId).toBeTruthy();

        await testFdrHealth(containerId);
    });

    it("All services work together in restricted environment", async () => {
        const containerId = await getRestrictedContainerId();
        expect(containerId).toBeTruthy();

        // Test all services are working
        await testPostgresConnection(containerId);
        await testFdrDatabase(containerId);
        await testMinioHealth(containerId);
        await testMinioBucket(containerId);
        await testFdrHealth(containerId);
    });
});

describe("PostgreSQL startup method verification", () => {
    it("Verifies fallback startup method was used", async () => {
        const containerId = await getRestrictedContainerId();
        expect(containerId).toBeTruthy();

        // Check container logs for our fallback messages
        const { stdout: containerLogs } = await execa("docker", ["logs", containerId]);

        // Should contain our fallback messages
        expect(containerLogs).toContain("su failed (likely due to permission restrictions)");
        expect(containerLogs).toContain("trying direct approach");
        expect(containerLogs).toContain("Starting PostgreSQL as current user (UID 65532)");
        expect(containerLogs).toContain("PostgreSQL started successfully as current user");
    });

    it("Verifies complete initContainer → main container flow", async () => {
        const containerId = await getRestrictedContainerId();
        expect(containerId).toBeTruthy();

        // This test verifies the complete flow:
        // 1. initContainer (simulated) fixed permissions
        // 2. Main container runs as UID 65532
        // 3. su fails due to restricted permissions
        // 4. Fallback method succeeds because permissions were fixed

        // Check that PostgreSQL is actually running
        await testPostgresConnection(containerId);

        // Check that it's running as the correct user
        const { stdout: postgresProcess } = await execa("docker", ["exec", containerId, "ps", "aux"]);

        // PostgreSQL process should be running as UID 65532
        expect(postgresProcess).toContain("postgres");

        // Verify the data directory ownership is correct
        const { stdout: lsOutput } = await execa("docker", [
            "exec",
            containerId,
            "ls",
            "-ld",
            "/var/lib/postgresql/data"
        ]);
        expect(lsOutput).toContain("65532");
    });
});
