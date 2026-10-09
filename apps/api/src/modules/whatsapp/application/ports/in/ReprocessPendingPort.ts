export interface ReprocessPendingPort {
  /** Returns how many events got processed in this pass. */
  execute(): Promise<number>;
}
