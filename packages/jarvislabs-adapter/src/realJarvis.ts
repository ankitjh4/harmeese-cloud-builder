import { classifyCommand } from "@harmeese/shared/safety.js";
import type {
  CommandResult,
  CreateInstanceInput,
  CreateInstanceResult,
  ExposePortResult,
  InstanceStatus,
  JarvisLabsAdapter
} from "./types.js";

export class RealJarvisLabsAdapter implements JarvisLabsAdapter {
  constructor(private readonly allowRealProvisioning: boolean) {}

  private assertEnabled(): void {
    if (!this.allowRealProvisioning) {
      throw new Error("Real provisioning is disabled. Set ALLOW_REAL_PROVISIONING=true and HARMESE_MODE=real to enable it.");
    }
  }

  async createInstance(input: CreateInstanceInput): Promise<CreateInstanceResult> {
    this.assertEnabled();
    if (!input.apiKey) {
      throw new Error("JarvisLabs API key is required for real provisioning.");
    }

    // TODO: Replace this placeholder with official JarvisLabs CLI/SDK calls.
    // Keep command construction allowlisted and never interpolate Telegram/user text.
    const instanceId = `real-pending-${Date.now().toString(36)}`;
    return {
      instanceId,
      publicUrl: "",
      status: "creating"
    };
  }

  async getInstance(instanceId: string): Promise<InstanceStatus> {
    this.assertEnabled();
    return { instanceId, status: "unknown" };
  }

  async runCommand(instanceId: string, command: string): Promise<CommandResult> {
    this.assertEnabled();
    const safety = classifyCommand(command);
    if (safety.classification !== "allowed") {
      return {
        exitCode: 126,
        stdout: "",
        stderr: `Refused command for ${instanceId}: ${safety.classification} - ${safety.reason}`
      };
    }

    // TODO: Execute through a JarvisLabs remote command primitive once official
    // CLI/SDK details are configured. Do not shell out arbitrary user input here.
    return {
      exitCode: 0,
      stdout: `Real adapter placeholder accepted allowlisted command: ${command}`,
      stderr: ""
    };
  }

  async exposePort(instanceId: string, port: number): Promise<ExposePortResult> {
    this.assertEnabled();
    // TODO: Replace with JarvisLabs expose/open-port command once confirmed.
    return { instanceId, port, url: "" };
  }

  async stopInstance(_instanceId: string): Promise<void> {
    this.assertEnabled();
    // TODO: Replace with JarvisLabs stop command once confirmed.
  }
}
