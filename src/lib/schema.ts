export enum OrganizationState {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISABLED = 'disabled',
}

export enum ScheduleType {
  CRON = 'cron',
  RATE = 'rate',
}

export enum TargetType {
  DYNO = 'dyno',
}

export enum TriggerType {
  SCHEDULE = 'schedule',
  MANUAL = 'manual',
}

export enum JobState {
  ENABLED = 'enabled',
  PAUSED = 'paused',
}

export enum JobExecutionState {
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  RUNNING = 'running',
  PENDING = 'pending',
}

export enum DynoSize {
  ECO = 'Eco',
  BASIC = 'Basic',
  STANDARD_1X = 'Standard-1X',
  STANDARD_2X = 'Standartd-2X',
  PERFORMANCE_M = 'Performance-M',
  PERFORMANCE_L = 'Performance-L',
  PRIVATE_S = 'Private-S',
  PRIVATE_M = 'Private-M',
  PRIVATE_L = 'Private-L',
}

export interface JobTarget {
  TimeToLive: number;
  Command: string;
  Type: TargetType;
  Size: DynoSize;
  [k: string]: any;
}

export interface Job {
  Id: string;
  Alias: string;
  State: JobState;
  ScheduleExpression: string;
  ScheduleType: ScheduleType;
  Timezone: string;
  Target: JobTarget;
  LastAttempt: {
    Id: string,
    State: JobExecutionState;
    CreatedAt: number;
  },
  Retries: number;
  CreatedAt: number;
  UpdatedAt: number;
  [k: string]: any;
}

export interface JobExecution {
  Id: string;
  [k: string]: any;
}

export interface Organization {
  Id: string;
  Name: string;
  State: OrganizationState;
  Region: {
    Name: string;
  };
  Plan: {
    Name: string;
    JobsLimit: number;
  };
  Partner: {
    Addon: {
      name: string
    }
  };
  JobsCount: number;
  CreatedAt: number;
  UpdatedAt: number;
  [k: string]: any;
}

export interface LogSession {
  logplex_url: string;
  [k: string]: any;
}

export interface AuthInfo {
  organizationId: string;
  apiKey: string;
  [k: string]: any;
}

export interface Manifest {
  jobs: Array<any>
  [k: string]: any;
}

export interface ManifestJob {
  nickname: string;
  schedule: string;
  dyno: string;
  timezone: string;
  command: string;
  timeout: number;
  retries: number;
  state: string;
  [k: string]: any;
}
