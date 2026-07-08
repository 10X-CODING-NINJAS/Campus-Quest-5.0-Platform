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

export interface SpiderVariant {
  id: number;
  name: string;
  theme: {
    progressColor: string;
  };
}

export interface DiagnosticItem {
  id: string;
  label: string;
  iconName: string;
  status: 'idle' | 'checking' | 'passed' | 'failed';
  progress: number;
}
