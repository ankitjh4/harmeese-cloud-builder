export interface CreateInstanceInput {
  projectName: string;
  apiKey: string;
  region?: string;
  gpuType?: string;
  diskGb?: number;
  websitePort: number;
}

export interface CreateInstanceResult {
  instanceId: string;
  publicUrl: string;
  status: "creating" | "running";
}

export interface InstanceStatus {
  instanceId: string;
  status: "creating" | "running" | "stopped" | "unknown";
  publicUrl?: string;
}

export interface CommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export interface ExposePortResult {
  instanceId: string;
  port: number;
  url: string;
}

export interface JarvisLabsAdapter {
  createInstance(input: CreateInstanceInput): Promise<CreateInstanceResult>;
  getInstance(instanceId: string): Promise<InstanceStatus>;
  runCommand(instanceId: string, command: string): Promise<CommandResult>;
  exposePort(instanceId: string, port: number): Promise<ExposePortResult>;
  stopInstance(instanceId: string): Promise<void>;
}
