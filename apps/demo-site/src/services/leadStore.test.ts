import assert from "node:assert/strict";
import { parseLead } from "./leadStore.js";

const lead = parseLead({
  name: "Ada",
  company: "Example Co",
  email: "ada@example.com",
  teamSize: "20",
  interest: "Engineering agentic AI training",
  message: "Need a workshop"
});

assert.equal(lead.name, "Ada");
assert.throws(() => parseLead({ name: "", company: "", email: "", interest: "" }));

console.log("lead store smoke tests passed");
