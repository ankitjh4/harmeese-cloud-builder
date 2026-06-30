const form = document.querySelector("#launch-form");
const statusEl = document.querySelector("#status");
const logsEl = document.querySelector("#logs");
const websiteLink = document.querySelector("#website-link");
const agentStatus = document.querySelector("#agent-status");
const instanceId = document.querySelector("#instance-id");
const monitorState = document.querySelector("#monitor-state");
const monitorBackend = document.querySelector("#monitor-backend");
const monitorModel = document.querySelector("#monitor-model");
const monitorPrompt = document.querySelector("#monitor-prompt");
const monitorRuns = document.querySelector("#monitor-runs");
const monitorEvents = document.querySelector("#monitor-events");
const monitorFiles = document.querySelector("#monitor-files");

let activeJobId = null;
let pollTimer = null;

function setStatus(text, state) {
  statusEl.textContent = text;
  statusEl.dataset.state = state || "";
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

async function pollJob() {
  if (!activeJobId) return;
  const [{ job }, { logs }, { monitor }] = await Promise.all([
    fetchJson(`/api/jobs/${activeJobId}`),
    fetchJson(`/api/jobs/${activeJobId}/logs`),
    fetchJson(`/api/jobs/${activeJobId}/monitor`)
  ]);

  setStatus(`${job.projectName}: ${job.status}`, job.status);
  logsEl.textContent = logs.join("\n") || "Waiting for first log...";
  agentStatus.textContent = `Agent status: ${job.agentStatus || "pending"}`;
  instanceId.textContent = `Instance: ${job.instanceId || "pending"}`;
  renderMonitor(monitor);

  if (job.websiteUrl) {
    websiteLink.textContent = job.websiteUrl;
    websiteLink.href = job.websiteUrl;
  }

  if (job.status === "ready" || job.status === "failed") {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function renderList(el, items, formatter) {
  el.innerHTML = "";
  if (!items.length) {
    const li = document.createElement("li");
    li.textContent = "No entries yet.";
    el.appendChild(li);
    return;
  }
  for (const item of items) {
    const li = document.createElement("li");
    li.textContent = formatter(item);
    el.appendChild(li);
  }
}

function renderMonitor(monitor) {
  monitorState.textContent = monitor.status;
  monitorBackend.textContent = monitor.backend;
  monitorModel.textContent = monitor.model;
  monitorPrompt.textContent = monitor.promptPack;
  monitorRuns.textContent = String(monitor.metrics.queuedRuns);
  renderList(monitorEvents, monitor.recentEvents, (event) => {
    const time = new Date(event.createdAt).toLocaleTimeString();
    return `${time} [${event.type}] ${event.message}`;
  });
  renderList(monitorFiles, monitor.agentRuns, (file) => file);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("Submitting launch request...", "queued");
  logsEl.textContent = "";
  const payload = Object.fromEntries(new FormData(form).entries());

  try {
    const result = await fetchJson("/api/jobs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    activeJobId = result.jobId;
    setStatus(`Job ${result.jobId}: ${result.status}`, result.status);
    await pollJob();
    pollTimer = setInterval(() => {
      pollJob().catch((error) => {
        setStatus(error.message, "failed");
      });
    }, 900);
  } catch (error) {
    setStatus(error.message, "failed");
  }
});
