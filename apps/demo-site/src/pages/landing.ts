export function landingPage(success = false): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>NeuralEdge Academy</title>
    <style>
      :root { --ink:#162126; --muted:#5e6972; --line:#d8e0e6; --accent:#0f766e; --accent2:#c2410c; --soft:#eef5f4; }
      * { box-sizing:border-box; }
      body { margin:0; font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:var(--ink); background:#f7f9fb; }
      header { background:#10201f; color:white; }
      .wrap { width:min(1120px, calc(100vw - 32px)); margin:0 auto; }
      nav { display:flex; justify-content:space-between; align-items:center; padding:18px 0; }
      nav strong { font-size:1.05rem; }
      nav a { color:white; text-decoration:none; font-weight:700; }
      .hero { display:grid; grid-template-columns:1.1fr .9fr; gap:38px; align-items:center; min-height:520px; padding:42px 0 56px; }
      h1 { font-size:clamp(2.35rem, 6vw, 4.9rem); line-height:1; margin:0 0 18px; letter-spacing:0; }
      .hero p { color:#cfe0dd; font-size:1.15rem; line-height:1.6; margin:0 0 26px; }
      .cta { display:inline-block; background:#f2b84b; color:#1b1b16; padding:14px 18px; border-radius:7px; text-decoration:none; font-weight:900; }
      .hero-media { min-height:360px; border-radius:8px; background:linear-gradient(135deg,#183936,#0f766e 55%,#f2b84b); display:grid; place-items:center; color:white; border:1px solid rgba(255,255,255,.18); }
      .metric { width:78%; background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.2); border-radius:8px; padding:22px; backdrop-filter:blur(8px); }
      .metric b { display:block; font-size:2.2rem; }
      section { padding:58px 0; }
      h2 { font-size:2rem; margin:0 0 20px; }
      .grid { display:grid; grid-template-columns:repeat(4, 1fr); gap:16px; }
      .card { background:white; border:1px solid var(--line); border-radius:8px; padding:20px; min-height:170px; }
      .card h3 { margin:0 0 10px; }
      .card p, .why p { color:var(--muted); line-height:1.55; }
      .why { display:grid; grid-template-columns:repeat(3, 1fr); gap:18px; }
      .form-band { background:var(--soft); border-top:1px solid var(--line); }
      form { background:white; border:1px solid var(--line); border-radius:8px; padding:22px; display:grid; grid-template-columns:1fr 1fr; gap:14px; }
      label { display:grid; gap:7px; font-weight:800; color:var(--muted); font-size:.9rem; }
      input, select, textarea { width:100%; border:1px solid var(--line); border-radius:7px; min-height:44px; padding:10px 12px; font:inherit; color:var(--ink); }
      textarea, .full { grid-column:1 / -1; }
      button { border:0; border-radius:7px; min-height:46px; background:var(--accent); color:white; font:inherit; font-weight:900; cursor:pointer; }
      .notice { border-left:5px solid var(--accent); background:white; padding:14px; border-radius:7px; margin-bottom:18px; font-weight:800; }
      footer { padding:28px 0; color:var(--muted); }
      @media (max-width:850px) { .hero, .grid, .why, form { grid-template-columns:1fr; } textarea, .full { grid-column:auto; } }
    </style>
  </head>
  <body>
    <header>
      <div class="wrap">
        <nav><strong>NeuralEdge Academy</strong><a href="#lead">Request workshop</a></nav>
        <div class="hero">
          <div>
            <h1>AI Training Programs for Modern Teams</h1>
            <p>Role-specific GenAI and agentic AI workshops that help teams move from experimentation to repeatable business outcomes.</p>
            <a class="cta" href="#lead">Request Corporate Workshop</a>
          </div>
          <div class="hero-media" aria-label="Training analytics preview">
            <div class="metric"><b>4.8/5</b><span>Average workshop rating across enterprise cohorts</span></div>
          </div>
        </div>
      </div>
    </header>

    <main>
      <section>
        <div class="wrap">
          <h2>Programs</h2>
          <div class="grid">
            <article class="card"><h3>GenAI for Finance Teams</h3><p>Forecasting workflows, controls, reporting copilots, and audit-safe prompt patterns.</p></article>
            <article class="card"><h3>GenAI for HR Teams</h3><p>Policy assistants, talent workflows, employee comms, and responsible AI practices.</p></article>
            <article class="card"><h3>GenAI for Sales & Marketing Teams</h3><p>Research, campaign production, account planning, and brand-safe content systems.</p></article>
            <article class="card"><h3>Agentic AI for Software Engineering Teams</h3><p>Spec-driven coding agents, code review workflows, testing loops, and deployment guardrails.</p></article>
          </div>
        </div>
      </section>

      <section>
        <div class="wrap">
          <h2>Why choose us</h2>
          <div class="why">
            <div><h3>Role-specific</h3><p>Every workshop is mapped to the daily workflows of the team in the room.</p></div>
            <div><h3>Hands-on</h3><p>Teams leave with reusable prompts, governance checklists, and prototype workflows.</p></div>
            <div><h3>Measured</h3><p>Programs include adoption metrics and a practical next-step roadmap.</p></div>
          </div>
        </div>
      </section>

      <section id="lead" class="form-band">
        <div class="wrap">
          <h2>Request a corporate workshop</h2>
          ${success ? '<div class="notice">Thanks. Your request was received and our team will follow up.</div>' : ""}
          <form method="post" action="/lead">
            <label>Name<input name="name" required /></label>
            <label>Company<input name="company" required /></label>
            <label>Email<input name="email" type="email" required /></label>
            <label>Team size<input name="teamSize" placeholder="25" /></label>
            <label class="full">Interest<select name="interest" required><option>Executive AI workshop</option><option>Finance team training</option><option>HR team training</option><option>Sales and marketing training</option><option>Engineering agentic AI training</option></select></label>
            <label class="full">Message<textarea name="message" rows="5" placeholder="Tell us what your team needs."></textarea></label>
            <button class="full" type="submit">Send request</button>
          </form>
        </div>
      </section>
    </main>
    <footer><div class="wrap">NeuralEdge Academy demo site generated by Harmeese Cloud Builder.</div></footer>
  </body>
</html>`;
}
