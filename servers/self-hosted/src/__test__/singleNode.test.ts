import dotenv from "dotenv";
import { execa } from "execa";
import path from "path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { SELF_HOSTED_CONTAINER_NAME } from "./setupSelfHostedDocs";
import { getContainerId } from "./testHelpers";

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function getSingleNodeContainerId() {
    return await getContainerId("name=" + SELF_HOSTED_CONTAINER_NAME);
}

// Setup single-node container before tests
beforeAll(async () => {
    const { setup } = await import("./setupSelfHostedDocs");
    await setup();
}, 30000); // 30 second timeout for setup

// Cleanup single-node container after tests
afterAll(async () => {
    const { teardown } = await import("./setupSelfHostedDocs");
    await teardown();
}, 30000); // 30 second timeout for cleanup

describe("Self-hosted docs in traditional environment (with su permissions)", () => {
    it("Postgres is running", async () => {
        const containerId = await getSingleNodeContainerId();
        expect(containerId).toBeTruthy();

        const { stdout: postgresStatus } = await execa("docker", [
            "exec",
            containerId,
            "pg_isready",
            "-U",
            "postgres",
            "-d",
            "postgres"
        ]);
        expect(postgresStatus).toContain("accepting connections");
    });

    it("fdr database exists and has tables", async () => {
        const containerId = await getSingleNodeContainerId();
        expect(containerId).toBeTruthy();

        const { stdout: dbList } = await execa("docker", [
            "exec",
            "-e",
            "PGPASSWORD=postgres",
            containerId,
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

        const { stdout: tableList } = await execa("docker", [
            "exec",
            "-e",
            "PGPASSWORD=postgres",
            containerId,
            "psql",
            "-U",
            "postgres",
            "-d",
            "fdr",
            "-t",
            "-c",
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"
        ]);
        const tableCount = parseInt(tableList.trim());
        expect(tableCount).toBeGreaterThan(0);
    });

    it("Minio Bucket has docs", async () => {
        const containerId = await getSingleNodeContainerId();
        expect(containerId).toBeTruthy();
        const { stdout: minioStatus } = await execa("docker", ["exec", containerId, "mc", "ls", "minio"]);
        const orgName = "example-org"; // this comes from the fern folder we mount
        expect(minioStatus).toContain(`${orgName}.docs.buildwithfern.com`);
    });
});

describe("Self-hosted docs MinIO in traditional environment", () => {
    it("health check passes", async () => {
        const containerId = await getSingleNodeContainerId();
        expect(containerId).toBeTruthy();

        const { stdout: curlOutput } = await execa("docker", [
            "exec",
            containerId,
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
});

describe("FDR server in traditional environment", () => {
    it("health check passes", async () => {
        const containerId = await getSingleNodeContainerId();
        expect(containerId).toBeTruthy();

        const { stdout: curlOutput } = await execa("docker", [
            "exec",
            containerId,
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

    it("Verifies traditional su startup method was used", async () => {
        const containerId = await getSingleNodeContainerId();
        expect(containerId).toBeTruthy();

        // Check container logs for traditional su messages
        const { stdout: containerLogs } = await execa("docker", [
            "logs",
            containerId
        ]);

        // Should contain traditional su messages
        expect(containerLogs).toContain("Attempting to start PostgreSQL with su");
        expect(containerLogs).toContain("PostgreSQL started successfully using su");
        
        // Should NOT contain fallback messages
        expect(containerLogs).not.toContain("su failed (likely due to permission restrictions)");
        expect(containerLogs).not.toContain("trying direct approach");
    });
});
