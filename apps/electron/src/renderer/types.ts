export interface Challenge {
  id?: string;
  title?: string;
  description?: string;
}

export interface SubmissionResult {
  status: "PENDING" | "RUNNING" | "ACCEPTED" | "FAILED" | "COMPILE_ERROR" | "IDLE";
  passedCount?: number;
  totalCount?: number;
  runtimeMs?: number;
  memoryMb?: number;
  message?: string | undefined;
}
