import assert from "node:assert/strict";
import { MockJarvisLabsAdapter, RealJarvisLabsAdapter } from "./index.js";

const mock = new MockJarvisLabsAdapter();
const created = await mock.createInstance({
  projectName: "demo",
  apiKey: "",
  websitePort: 8080
});
assert.match(created.instanceId, /^mock-jl-/);
assert.equal((await mock.exposePort(created.instanceId, 8080)).url, "http://localhost:8080");

const real = new RealJarvisLabsAdapter(false);
await assert.rejects(() => real.createInstance({
  projectName: "demo",
  apiKey: "",
  websitePort: 8080
}));

console.log("adapter smoke tests passed");
