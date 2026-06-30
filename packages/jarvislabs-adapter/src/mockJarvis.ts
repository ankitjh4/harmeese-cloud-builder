import type {
  CommandResult,
  CreateInstanceInput,
  CreateInstanceResult,
  ExposePortResult,
  InstanceStatus,
  JarvisLabsAdapter
} from "./types.js";

export class MockJarvisLabsAdapter implements JarvisLabsAdapter {
  private instances = new Map<string, InstanceStatus>();
  public actions: string[] = [];

  async createInstance(input: CreateInstanceInput): Promise<CreateInstanceResult> {
    const instanceId = `mock-jl-${Date.now().toString(36)}`;
    const publicUrl = `http://localhost:${input.websitePort}`;
    this.actions.push(`createInstance ${input.projectName} -> ${instanceId}`);
    this.instances.set(instanceId, { instanceId, status: "running", publicUrl });
    return { instanceId, publicUrl, status: "running" };
  }

  async getInstance(instanceId: string): Promise<InstanceStatus> {
    this.actions.push(`getInstance ${instanceId}`);
    return this.instances.get(instanceId) ?? { instanceId, status: "unknown" };
  }

  async runCommand(instanceId: string, command: string): Promise<CommandResult> {
    this.actions.push(`runCommand ${instanceId}: ${command}`);
    return {
      exitCode: 0,
      stdout: `[mock] ${command}`,
      stderr: ""
    };
  }

  async exposePort(instanceId: string, port: number): Promise<ExposePortResult> {
    this.actions.push(`exposePort ${instanceId}:${port}`);
    return { instanceId, port, url: `http://localhost:${port}` };
  }

  async stopInstance(instanceId: string): Promise<void> {
    this.actions.push(`stopInstance ${instanceId}`);
    const current = this.instances.get(instanceId);
    if (current) this.instances.set(instanceId, { ...current, status: "stopped" });
  }
}
