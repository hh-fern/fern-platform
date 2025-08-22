# Document Change Tracking System

## Overview

This is a complete rewrite of the client-side document change tracking system that replaces the existing fragmented approach with a unified, event-sourced architecture.

## Problem Statement

The current system has several critical issues:

- **5 separate storage systems**: MdxStateContext, ClientPageStorage, DocsYmlStorage, CommittedFilesStorage, PageStorage
- **Complex reconciliation logic**: 400+ line `collectAllChanges` function that's hard to understand and test
- **Race conditions**: Multiple storage layers can get out of sync
- **Duplicate bugs**: Create→delete operations don't cancel out properly
- **Untestable**: Can't unit test commit logic without full UI integration

## Solution: Event Sourcing Architecture

### Core Principles

1. **Single Source of Truth**: Replace 5 storage systems with one unified change log
2. **Immutable Change Log**: Track operations as append-only events, not scattered state
3. **Testable Business Logic**: Separate pure functions from UI/storage concerns
4. **Modular Storage**: Abstract storage for easy testing and swapping

### Architecture Components

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   React UI Layer    │    │  Storage Layer      │    │   Commit Layer      │
│                     │    │                     │    │                     │
│ ┌─────────────────┐ │    │ ┌─────────────────┐ │    │ ┌─────────────────┐ │
│ │ useDocument     │ │    │ │ ChangeStorage   │ │    │ │ CommitOrches-   │ │
│ │ Changes Hook    │ │◄───┤ │ Interface       │ │    │ │ trator          │ │
│ └─────────────────┘ │    │ └─────────────────┘ │    │ └─────────────────┘ │
│ ┌─────────────────┐ │    │ ┌─────────────────┐ │    │ ┌─────────────────┐ │
│ │ EditorState     │ │    │ │ LocalStorage    │ │    │ │ GitHub API      │ │
│ │ Manager         │ │    │ │ Implementation  │ │    │ │ Integration     │ │
│ └─────────────────┘ │    │ └─────────────────┘ │    │ └─────────────────┘ │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
           │                           │                           │
           └───────────────────────────┼───────────────────────────┘
                                       │
                    ┌─────────────────────┐
                    │   Core Engine       │
                    │                     │
                    │ ┌─────────────────┐ │
                    │ │ DocumentChange  │ │
                    │ │ Tracker         │ │
                    │ └─────────────────┘ │
                    │ ┌─────────────────┐ │
                    │ │ DocumentChange  │ │
                    │ │ Set             │ │
                    │ └─────────────────┘ │
                    └─────────────────────┘
```

### Key Data Structures

#### DocumentChangeSet

```typescript
interface DocumentChangeSet {
  baseState: BaseState; // What's currently in Git
  changes: Change[]; // Ordered log of operations

  getCurrentState(): CurrentState;
  getCommitPlan(): CommitPlan;
  addChange(change): DocumentChangeSet;
}
```

#### Change Types

```typescript
type Change =
  | { type: "file:create"; path: string; content: string; section?: string }
  | { type: "file:update"; path: string; content: string }
  | { type: "file:delete"; path: string }
  | { type: "docs.yml:add-page"; pagePath: string; section: string }
  | { type: "docs.yml:remove-page"; pagePath: string };
```

## Benefits

### 1. Testability

```typescript
// Easy unit tests for complex scenarios
describe("DocumentChangeTracker", () => {
  it("should handle create then delete", () => {
    const tracker = new DocumentChangeTracker(baseState);

    const afterCreate = tracker.addChange({
      type: "file:create",
      path: "page.mdx",
      content: "# Hello",
    });

    const afterDelete = afterCreate.addChange({
      type: "file:delete",
      path: "page.mdx",
    });

    expect(afterDelete.getCommitPlan().filesToCommit.size).toBe(0);
  });
});
```

### 2. No More Duplicate Issues

The change log approach automatically handles:

- Create page A, delete page A → no net changes
- Multiple operations on same file → only final state matters
- Docs.yml updates computed deterministically

### 3. Debuggability

```typescript
// Debug any state by replaying changes
const debugState = changes.reduce(
  (state, change) => applyChange(state, change),
  baseState
);
```

### 4. Performance

- Only compute diffs when needed
- Can implement optimizations like change compaction
- Clear separation of concerns

## Usage Examples

### React Hook Usage

```typescript
function DocumentEditor({ branchName }: { branchName: string }) {
  const {
    createFile,
    updateFile,
    deleteFile,
    hasChanges,
    getCommitPlan
  } = useDocumentChanges(baseState, {
    branchId: branchName,
    autoSave: true,
    autoSaveDelayMs: 300
  });

  // Replace existing stageChanges calls
  const handlePageEdit = (path: string, content: string) => {
    updateFile(path, content);
  };

  const handleNewPage = (path: string, content: string, section: string) => {
    createFile(path, content, section);
  };

  return (
    <div>
      <button onClick={() => handleNewPage('new-page.mdx', '# New Page', 'API')}>
        Create Page
      </button>
      {hasChanges() && <CommitButton changes={getCommitPlan()} />}
    </div>
  );
}
```

### Commit Logic Replacement

```typescript
// BEFORE: Complex collectAllChanges function (400+ lines)
const { filesToCommit, filesToDelete } = collectAllChanges(
  changedMdxFiles,
  branch
);

// AFTER: Simple, testable commit orchestration
const commitOrchestrator = new CommitOrchestrator(githubApi, docsYmlUpdater);
const result = await commitOrchestrator.commit(changeSet, {
  owner,
  repo,
  branch,
  pathPrefix: "fern/",
});
```

## Migration Strategy

### Phase 1: Core Engine ✅

- [x] Build DocumentChangeTracker with comprehensive tests
- [x] Implement storage abstraction with localStorage + in-memory versions
- [x] Create conversion utilities from current storage formats

### Phase 2: Replace Commit Logic

1. Replace `collectAllChanges` with `CommitOrchestrator`
2. Keep existing UI but route through new system
3. Extensive testing of commit scenarios

### Phase 3: Unify State Management

1. Replace `MdxStateContext` with `EditorStateManager`
2. Migrate client page creation/deletion
3. Remove old storage classes

### Phase 4: Advanced Features

1. Change compaction and optimization
2. Undo/redo support
3. Conflict resolution for concurrent edits

## Testing

All core business logic is covered by comprehensive unit tests:

```bash
npm test src/document-changes/__test__/
```

Test coverage includes:

- Change tracking and compaction logic
- Storage layer functionality
- Complex change sequences (create→update→delete→create)
- Edge cases and error handling

## Files Structure

```
src/document-changes/
├── types.ts                    # Core type definitions
├── DocumentChangeTracker.ts    # Main change tracking logic
├── storage.ts                  # Storage abstraction layer
├── EditorStateManager.ts       # React integration
├── CommitOrchestrator.ts       # Commit logic replacement
├── migration.ts                # Legacy storage conversion
├── index.ts                    # Public API exports
├── example-usage.ts            # Usage examples
├── README.md                   # This file
└── __test__/
    ├── DocumentChangeTracker.test.ts
    └── storage.test.ts
```

## Comparison: Before vs After

| Aspect              | Before                               | After                              |
| ------------------- | ------------------------------------ | ---------------------------------- |
| **Storage Systems** | 5 separate localStorage keys         | 1 unified change log               |
| **Commit Logic**    | 400+ line collectAllChanges function | Clean, modular CommitOrchestrator  |
| **Testability**     | Requires full UI integration         | Pure functions, easily unit tested |
| **Race Conditions** | Multiple storage layers can desync   | Immutable change log, no races     |
| **Duplicate Bugs**  | Create→delete doesn't cancel         | Automatic change compaction        |
| **Debugging**       | Hard to trace state changes          | Full change history available      |
| **Performance**     | Recalculates everything each time    | Only computes diffs when needed    |

The new architecture eliminates the root causes of the current issues and provides a solid foundation for reliable document editing.
