/**
 * New Document Change Tracking System
 *
 * This is a complete rewrite of the client-side change tracking system
 * that replaces the existing fragmented storage approach with a unified,
 * event-sourced architecture.
 */

// Core types and interfaces
export * from "./types";

// Main change tracking implementation
export {
  DocumentChangeTracker,
  DocumentChangeSetImpl,
} from "./DocumentChangeTracker";

// Storage abstractions
export {
  LocalStorageChangeStorage,
  InMemoryChangeStorage,
  createChangeStorage,
} from "./storage";
export type { ChangeStorage } from "./storage";

// React integration
export {
  EditorStateManager,
  useDocumentChanges,
  useChangeHistory,
} from "./EditorStateManager";

// Commit orchestration
export { CommitOrchestrator } from "./CommitOrchestrator";
export type { GitHubApi, DocsYmlUpdater } from "./CommitOrchestrator";

// Migration utilities
export * from "./migration";

// Re-export key types for convenience
export type {
  DocumentChangeSet,
  BaseState,
  CurrentState,
  CommitPlan,
  Change,
  FilePath,
  FileContent,
  CommitResult,
  ChangeTrackingConfig,
} from "./types";
