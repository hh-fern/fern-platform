import { connectDatabase, disconnectDatabase } from "./database";

async function main() {
  console.log("Fern Dashboard Server starting...");

  try {
    await connectDatabase();

    // Your server logic here
    console.log("Server is ready");

    // Keep the process running
    process.on("SIGINT", () => {
      console.log("Shutting down server...");
      void disconnectDatabase()
        .then(() => {
          process.exit(0);
        })
        .catch((error: unknown) => {
          console.error("Error during shutdown:", error);
          process.exit(1);
        });
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
