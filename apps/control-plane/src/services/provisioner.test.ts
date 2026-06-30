import assert from "node:assert/strict";
import { classifyCommand } from "@harmeese/shared/safety.js";

assert.equal(classifyCommand("pnpm install").classification, "allowed");
assert.equal(classifyCommand("expose port 8080").classification, "needs_approval");
assert.equal(classifyCommand("sudo su").classification, "blocked");

console.log("control-plane smoke tests passed");
