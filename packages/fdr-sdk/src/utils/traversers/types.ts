export const SKIP = "skip" as const;
export const STOP = false;
export const CONTINUE = true;

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type Action = typeof CONTINUE | typeof SKIP | typeof STOP | void;

export type TraverserVisit<N, P extends N = N> = (
  node: N,
  parents: readonly P[]
) => Action;
export type TraverserGetChildren<N, P extends N = N> = (
  parent: P
) => readonly N[];

export type DeleterAction = "deleted" | "should-delete-parent" | "noop";
