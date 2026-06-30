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
const timelineSteps = Array.from(document.querySelectorAll(".timeline-step"));

let activeJobId = null;
let pollTimer = null;
const statusOrder = ["queued", "provisioning", "installing", "starting", "ready"];

function setStatus(text, state) {
  statusEl.textContent = text;
  statusEl.dataset.state = state || "";
  renderTimeline(state);
}

function renderTimeline(state) {
  const activeIndex = statusOrder.indexOf(state);
  for (const step of timelineSteps) {
    const stepName = step.dataset.step;
    const stepIndex = statusOrder.indexOf(stepName);
    step.classList.remove("is-active", "is-complete", "is-failed");
    if (state === "failed") {
      step.classList.add("is-failed");
    } else if (activeIndex !== -1 && stepIndex < activeIndex) {
      step.classList.add("is-complete");
    } else if (activeIndex !== -1 && stepIndex === activeIndex) {
      step.classList.add(state === "ready" ? "is-complete" : "is-active");
    }
  }
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
  agentStatus.textContent = job.agentStatus || "Pending";
  instanceId.textContent = job.instanceId || "Pending";
  renderMonitor(monitor);

  if (job.websiteUrl) {
    websiteLink.querySelector("strong").textContent = job.websiteUrl;
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
    const formatted = formatter(item);
    if (typeof formatted === "string") {
      li.textContent = formatted;
    } else {
      li.appendChild(formatted);
    }
    el.appendChild(li);
  }
}

function renderMonitor(monitor) {
  monitorState.textContent = monitor.status;
  monitorState.dataset.state = monitor.status;
  monitorBackend.textContent = monitor.backend;
  monitorModel.textContent = monitor.model;
  monitorPrompt.textContent = monitor.promptPack;
  monitorRuns.textContent = String(monitor.metrics.queuedRuns);
  renderList(monitorEvents, monitor.recentEvents, (event) => {
    const time = new Date(event.createdAt).toLocaleTimeString();
    const item = document.createElement("span");
    const heading = document.createElement("strong");
    heading.textContent = `${time} · ${event.type}`;
    item.appendChild(heading);
    item.appendChild(document.createElement("br"));
    item.appendChild(document.createTextNode(event.message));
    return item;
  });
  renderList(monitorFiles, monitor.agentRuns, (file) => file);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("Submitting launch request...", "queued");
  logsEl.textContent = "";
  websiteLink.querySelector("strong").textContent = "Pending";
  websiteLink.href = "#";
  agentStatus.textContent = "Pending";
  instanceId.textContent = "Pending";
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
