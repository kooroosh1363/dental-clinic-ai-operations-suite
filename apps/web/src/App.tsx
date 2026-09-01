import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  Bot,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  FileClock,
  Users,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "./api";
import { Logo } from "./components/Logo";
import { StatusPill } from "./components/StatusPill";
import type {
  AgentAnswer,
  Appointment,
  Approval,
  AuditLog,
  DashboardSummary,
  Patient,
  User,
} from "./types";

type View =
  | "dashboard"
  | "appointments"
  | "patients"
  | "approvals"
  | "assistant"
  | "audit";

function Login({
  onLogin,
  onIntake,
}: {
  onLogin: (token: string, user: User) => void;
  onIntake: () => void;
}) {
  const [email, setEmail] = useState("admin@novasmile.demo");
  const [password, setPassword] = useState("DemoClinic!2026");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await api.request<{ token: string; user: User }>(
        "/auth/login",
        { method: "POST", body: JSON.stringify({ email, password }) },
      );
      api.setToken(result.token);
      onLogin(result.token, result.user);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="login-shell">
      <section className="login-story">
        <Logo />
        <div className="story-copy">
          <span className="eyebrow">
            <Sparkles size={15} /> Human-controlled AI operations
          </span>
          <h1>
            More care.
            <br />
            <em>Less operational noise.</em>
          </h1>
          <p>
            A reference platform for intake, scheduling, approvals, grounded
            answers and clinic analytics.
          </p>
        </div>
        <div className="trust-row">
          <ShieldCheck />
          <span>Synthetic data</span>
          <i></i>
          <span>Human approval</span>
          <i></i>
          <span>Auditable actions</span>
        </div>
      </section>
      <section className="login-panel">
        <form onSubmit={submit} className="login-card">
          <div className="mobile-logo">
            <Logo />
          </div>
          <span className="eyebrow">Staff workspace</span>
          <h2>Welcome back</h2>
          <p>Use the pre-filled demo account.</p>
          <label>
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="username"
            />
          </label>
          <label>
            Password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
            />
          </label>
          {error && (
            <div className="form-error">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}
          <button className="primary-button" disabled={loading}>
            {loading ? "Signing in…" : "Open workspace"}
            <ChevronRight size={18} />
          </button>
          <button type="button" className="intake-link" onClick={onIntake}>
            Request a patient appointment
          </button>
          <small className="demo-note">
            Reference implementation · not a live clinic deployment
          </small>
        </form>
      </section>
    </main>
  );
}

function PatientIntake({ onBack }: { onBack: () => void }) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError("");
    try {
      await api.request("/public/intake", {
        method: "POST",
        body: JSON.stringify({
          fullName: data.get("fullName"),
          email: data.get("email"),
          phone: data.get("phone"),
          service: data.get("service"),
          preferredDate: data.get("preferredDate"),
          message: data.get("message"),
          consent: data.get("consent") === "on",
        }),
      });
      setSent(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Request failed");
    }
  };
  return (
    <main className="public-shell">
      <section className="public-card">
        <Logo />
        {sent ? (
          <div className="success-state">
            <Check />
            <h1>Request received</h1>
            <p>A staff member will review your request before scheduling.</p>
            <button className="secondary-button" onClick={onBack}>
              Back to staff login
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="intake-form">
            <span className="eyebrow">Patient appointment request</span>
            <h1>Tell us how we can help.</h1>
            <p>
              This form does not provide medical advice. Urgent messages are
              routed to a person.
            </p>
            <div className="form-grid">
              <label>
                Full name
                <input name="fullName" required minLength={2} />
              </label>
              <label>
                Email
                <input name="email" type="email" required />
              </label>
              <label>
                Phone
                <input name="phone" required placeholder="+1 604 555 0199" />
              </label>
              <label>
                Preferred date
                <input name="preferredDate" type="date" required />
              </label>
              <label>
                Service
                <select name="service" defaultValue="Cleaning">
                  {[
                    "Cleaning",
                    "Emergency exam",
                    "Filling",
                    "Root canal consult",
                    "Crown consult",
                    "Whitening",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label className="wide">
                Message
                <textarea name="message" required minLength={3} />
              </label>
            </div>
            <label className="consent">
              <input name="consent" type="checkbox" required /> I consent to
              NovaSmile processing this demo request.
            </label>
            {error && <div className="form-error">{error}</div>}
            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={onBack}
              >
                Back
              </button>
              <button className="primary-button">Submit request</button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value,
  note,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  note: string;
  tone: string;
}) {
  return (
    <article className="metric-card">
      <div className={`metric-icon ${tone}`}>{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </article>
  );
}

function Dashboard({
  summary,
  appointments,
  onNewAppointment,
  onViewAppointments,
}: {
  summary: DashboardSummary;
  appointments: Appointment[];
  onNewAppointment: () => void;
  onViewAppointments: () => void;
}) {
  const today = new Date().toLocaleDateString("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{today}</span>
          <h1>Good morning, Maya.</h1>
          <p>Here is what needs attention across NovaSmile today.</p>
        </div>
        <button className="secondary-button" onClick={onNewAppointment}>
          <CalendarDays size={17} />
          New appointment
        </button>
      </div>
      <section className="metrics-grid">
        <MetricCard
          icon={<CalendarDays />}
          label="Today's appointments"
          value={summary.todayAppointments}
          note="Across 2 clinicians"
          tone="cyan"
        />
        <MetricCard
          icon={<Check />}
          label="Confirmation rate"
          value={`${summary.confirmedRate}%`}
          note="Current schedule"
          tone="mint"
        />
        <MetricCard
          icon={<ClipboardCheck />}
          label="Pending approvals"
          value={summary.pendingApprovals}
          note="Human decision required"
          tone="purple"
        />
        <MetricCard
          icon={<AlertTriangle />}
          label="High no-show risk"
          value={summary.highRiskNoShows}
          note="Follow-up recommended"
          tone="amber"
        />
      </section>
      <section className="dashboard-grid">
        <article className="panel chart-panel">
          <div className="panel-title">
            <div>
              <span>Appointment volume</span>
              <h3>Next seven days</h3>
            </div>
            <span className="trend">+12% vs last week</span>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary.weeklyVolume}>
                <defs>
                  <linearGradient id="volume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7457e8" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#7457e8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="#e8e8f0"
                  vertical={false}
                />
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} width={24} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="appointments"
                  stroke="#7457e8"
                  strokeWidth={3}
                  fill="url(#volume)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="panel focus-panel">
          <div className="panel-title">
            <div>
              <span>Operations focus</span>
              <h3>AI with clear boundaries</h3>
            </div>
            <ShieldCheck className="purple-text" />
          </div>
          <div className="focus-list">
            <div>
              <Bot />
              <span>
                <strong>Grounded answers</strong>
                <small>Only approved clinic articles are used.</small>
              </span>
            </div>
            <div>
              <ClipboardCheck />
              <span>
                <strong>Human approval</strong>
                <small>Clinical and financial actions remain controlled.</small>
              </span>
            </div>
            <div>
              <Activity />
              <span>
                <strong>Auditable workflows</strong>
                <small>Every decision and automation is logged.</small>
              </span>
            </div>
          </div>
        </article>
        <article className="panel appointments-panel">
          <div className="panel-title">
            <div>
              <span>Live schedule</span>
              <h3>Upcoming appointments</h3>
            </div>
            <button className="text-button" onClick={onViewAppointments}>
              View all
              <ChevronRight size={16} />
            </button>
          </div>
          <AppointmentTable appointments={appointments.slice(0, 5)} />
        </article>
      </section>
    </>
  );
}

function AppointmentModal({
  patients,
  onClose,
  onCreated,
}: {
  patients: Patient[];
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [error, setError] = useState("");
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await api.request("/appointments", {
        method: "POST",
        body: JSON.stringify({
          patientId: data.get("patientId"),
          service: data.get("service"),
          startsAt: new Date(String(data.get("startsAt"))).toISOString(),
          durationMinutes: Number(data.get("durationMinutes")),
          clinician: data.get("clinician"),
          notes: data.get("notes"),
        }),
      });
      await onCreated();
      onClose();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not create appointment",
      );
    }
  };
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-title"
        onSubmit={submit}
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow">Scheduling</span>
            <h2 id="appointment-title">New appointment</h2>
          </div>
          <button type="button" aria-label="Close" onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="form-grid">
          <label>
            Patient
            <select name="patientId" required>
              {patients.map((p) => (
                <option value={p.id} key={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Service
            <select name="service">
              {[
                "Cleaning",
                "Emergency exam",
                "Filling",
                "Root canal consult",
                "Crown consult",
                "Whitening",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Date and time
            <input name="startsAt" type="datetime-local" required />
          </label>
          <label>
            Duration
            <select name="durationMinutes" defaultValue="45">
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
              <option value="90">90 minutes</option>
            </select>
          </label>
          <label>
            Clinician
            <input name="clinician" defaultValue="Dr. Rivera" required />
          </label>
          <label className="wide">
            Notes
            <textarea name="notes" />
          </label>
        </div>
        {error && <div className="form-error">{error}</div>}
        <div className="form-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" disabled={!patients.length}>
            Create appointment
          </button>
        </div>
      </form>
    </div>
  );
}

function Patients({ patients }: { patients: Patient[] }) {
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Patient operations</span>
          <h1>Patients</h1>
          <p>
            Consent-backed patient records created from synthetic demo data.
          </p>
        </div>
      </div>
      <article className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="patient-cell">
                      <span>
                        {p.full_name
                          .split(" ")
                          .map((x) => x[0])
                          .join("")}
                      </span>
                      <strong>{p.full_name}</strong>
                    </div>
                  </td>
                  <td>{p.email}</td>
                  <td>{p.phone}</td>
                  <td>{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </>
  );
}

function Audit({ logs }: { logs: AuditLog[] }) {
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Accountability</span>
          <h1>Audit trail</h1>
          <p>Immutable operational events for staff, agents and workflows.</p>
        </div>
      </div>
      <section className="audit-list">
        {logs.map((log) => (
          <article key={log.id}>
            <FileClock />
            <div>
              <strong>{log.action}</strong>
              <span>
                {log.entity_type} · {log.entity_id}
              </span>
            </div>
            <time>{new Date(log.created_at).toLocaleString()}</time>
          </article>
        ))}
      </section>
    </>
  );
}

function AppointmentTable({ appointments }: { appointments: Appointment[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Patient</th>
            <th>Service</th>
            <th>Date & time</th>
            <th>Clinician</th>
            <th>Status</th>
            <th>No-show risk</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((item) => (
            <tr key={item.id}>
              <td>
                <div className="patient-cell">
                  <span>
                    {item.patient_name
                      .split(" ")
                      .map((x) => x[0])
                      .join("")}
                  </span>
                  <strong>{item.patient_name}</strong>
                </div>
              </td>
              <td>{item.service}</td>
              <td>
                {new Date(item.starts_at).toLocaleString("en-CA", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </td>
              <td>{item.clinician}</td>
              <td>
                <StatusPill value={item.status} />
              </td>
              <td>
                <div className="risk">
                  <i style={{ width: `${item.no_show_score}%` }}></i>
                  <span>{item.no_show_score}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!appointments.length && (
        <div className="empty-state">
          <CalendarDays />
          <h3>No appointments yet</h3>
          <p>New bookings will appear here.</p>
        </div>
      )}
    </div>
  );
}

function Approvals({
  approvals,
  onResolve,
}: {
  approvals: Approval[];
  onResolve: (id: string, status: "approved" | "rejected") => void;
}) {
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Human decision gate</span>
          <h1>Approval queue</h1>
          <p>
            Sensitive actions remain paused until an accountable staff member
            decides.
          </p>
        </div>
      </div>
      <section className="approval-grid">
        {approvals.map((item) => (
          <article className="approval-card" key={item.id}>
            <div className="approval-top">
              <span className="approval-kind">
                {item.kind.replaceAll("_", " ")}
              </span>
              <StatusPill value={item.status} />
            </div>
            <h3>{item.summary}</h3>
            <p>
              Requested by <strong>{item.requested_by}</strong> ·{" "}
              {new Date(item.created_at).toLocaleDateString()}
            </p>
            {item.status === "pending" && (
              <div className="approval-actions">
                <button
                  onClick={() => onResolve(item.id, "rejected")}
                  className="reject-button"
                >
                  <X size={16} />
                  Reject
                </button>
                <button
                  onClick={() => onResolve(item.id, "approved")}
                  className="approve-button"
                >
                  <Check size={16} />
                  Approve
                </button>
              </div>
            )}
          </article>
        ))}
      </section>
    </>
  );
}

function Assistant() {
  const [question, setQuestion] = useState(
    "What should a new patient bring to the first visit?",
  );
  const [answer, setAnswer] = useState<AgentAnswer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const ask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      setAnswer(
        await api.request("/agent/ask", {
          method: "POST",
          body: JSON.stringify({ question, sessionId: "demo-session-001" }),
        }),
      );
    } catch (r) {
      setError(r instanceof Error ? r.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Approved-knowledge assistant</span>
          <h1>Clinic assistant</h1>
          <p>
            Answers operational questions and escalates clinical judgment or
            unsupported requests.
          </p>
        </div>
      </div>
      <section className="assistant-layout">
        <article className="assistant-chat">
          <div className="chat-intro">
            <div className="agent-orb">
              <Bot />
            </div>
            <h2>How can I help?</h2>
            <p>
              Ask about office hours, appointments, new-patient preparation or
              payment policy.
            </p>
          </div>
          {answer && (
            <div
              className={`answer-card ${answer.escalated ? "escalated" : ""}`}
            >
              <div className="answer-meta">
                {answer.escalated ? <AlertTriangle /> : <ShieldCheck />}
                <span>
                  {answer.grounded
                    ? "Grounded in approved sources"
                    : "Escalated safely"}
                </span>
              </div>
              <p>{answer.answer}</p>
              {answer.citations.length > 0 && (
                <div className="citations">
                  Sources:{" "}
                  {answer.citations.map((x) => (
                    <span key={x.id}>{x.title}</span>
                  ))}
                </div>
              )}
            </div>
          )}
          {error && <div className="form-error">{error}</div>}
          <form className="ask-form" onSubmit={ask}>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              aria-label="Question"
            />
            <button disabled={loading}>
              <Sparkles size={17} />
              {loading ? "Checking…" : "Ask assistant"}
            </button>
          </form>
        </article>
        <aside className="boundary-card">
          <ShieldCheck />
          <h3>Safety boundary</h3>
          <p>
            The assistant cannot diagnose, recommend treatment, reveal private
            data or act outside approved clinic knowledge.
          </p>
          <ul>
            <li>Prompt-injection checks</li>
            <li>Approved-source retrieval</li>
            <li>No medical decision authority</li>
            <li>Audit record per interaction</li>
          </ul>
        </aside>
      </section>
    </>
  );
}

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [intake, setIntake] = useState(false);
  const [view, setView] = useState<View>("dashboard");
  const [menu, setMenu] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");
  const [appointmentModal, setAppointmentModal] = useState(false);
  const [error, setError] = useState("");
  const load = async () => {
    try {
      const [s, a, p, patientRows, auditRows] = await Promise.all([
        api.request<DashboardSummary>("/dashboard"),
        api.request<Appointment[]>("/appointments"),
        api.request<Approval[]>("/approvals"),
        api.request<Patient[]>("/patients"),
        user?.role === "admin"
          ? api.request<AuditLog[]>("/audit")
          : Promise.resolve([]),
      ]);
      setSummary(s);
      setAppointments(a);
      setApprovals(p);
      setPatients(patientRows);
      setLogs(auditRows);
    } catch (r) {
      setError(r instanceof Error ? r.message : "Could not load workspace");
    }
  };
  useEffect(() => {
    if (user) void load();
  }, [user]);
  const pending = useMemo(
    () => approvals.filter((x) => x.status === "pending").length,
    [approvals],
  );
  if (!user && intake) return <PatientIntake onBack={() => setIntake(false)} />;
  if (!user)
    return (
      <Login
        onLogin={(token, next) => {
          localStorage.setItem("novasmile-token", token);
          setUser(next);
        }}
        onIntake={() => setIntake(true)}
      />
    );
  const resolve = async (id: string, status: "approved" | "rejected") => {
    await api.request(`/approvals/${id}/resolve`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });
    await load();
  };
  const nav = [
    ["dashboard", "Overview", <LayoutDashboard />],
    ["appointments", "Appointments", <CalendarDays />],
    ["patients", "Patients", <Users />],
    ["approvals", "Approvals", <ClipboardCheck />],
    ["assistant", "AI assistant", <Bot />],
    ...(user.role === "admin"
      ? [["audit", "Audit trail", <FileClock />] as const]
      : []),
  ] as const;
  return (
    <div className="app-shell">
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <div className="sidebar-head">
          <Logo />
          <button className="close-menu" onClick={() => setMenu(false)}>
            <X />
          </button>
        </div>
        <nav>
          {nav.map(([id, label, icon]) => (
            <button
              key={id}
              className={view === id ? "active" : ""}
              onClick={() => {
                setView(id);
                setMenu(false);
              }}
            >
              {icon}
              <span>{label}</span>
              {id === "approvals" && pending > 0 && <b>{pending}</b>}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="mini-user">
            <span>MC</span>
            <div>
              <strong>{user.fullName}</strong>
              <small>{user.role}</small>
            </div>
          </div>
          <button
            title="Sign out"
            onClick={() => {
              api.clearToken();
              localStorage.removeItem("novasmile-token");
              setUser(null);
            }}
          >
            <LogOut />
          </button>
        </div>
      </aside>
      <main className="workspace">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMenu(true)}>
            <Menu />
          </button>
          <div className="search-box">
            <Search />
            <input
              aria-label="Search workspace"
              placeholder="Search patients, appointments…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="top-actions">
            <button>
              <Bell />
              <i></i>
            </button>
            <div className="profile-chip">
              <span>MC</span>
              <div>
                <strong>Maya Chen</strong>
                <small>Clinic admin</small>
              </div>
            </div>
          </div>
        </header>
        <div className="content">
          {error && (
            <div className="global-error">
              <AlertTriangle />
              {error}
            </div>
          )}
          {!summary ? (
            <div className="loading-state">
              <Activity />
              <span>Preparing clinic workspace…</span>
            </div>
          ) : view === "dashboard" ? (
            <Dashboard
              summary={summary}
              appointments={appointments.filter((x) =>
                `${x.patient_name} ${x.service} ${x.clinician}`
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              )}
              onNewAppointment={() => setAppointmentModal(true)}
              onViewAppointments={() => setView("appointments")}
            />
          ) : view === "appointments" ? (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">Scheduling operations</span>
                  <h1>Appointments</h1>
                  <p>Live appointments with explainable no-show risk.</p>
                </div>
              </div>
              <article className="panel">
                <AppointmentTable
                  appointments={appointments.filter((x) =>
                    `${x.patient_name} ${x.service} ${x.clinician}`
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                  )}
                />
              </article>
            </>
          ) : view === "patients" ? (
            <Patients
              patients={patients.filter((x) =>
                `${x.full_name} ${x.email} ${x.phone}`
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              )}
            />
          ) : view === "approvals" ? (
            <Approvals approvals={approvals} onResolve={resolve} />
          ) : view === "assistant" ? (
            <Assistant />
          ) : (
            <Audit logs={logs} />
          )}
        </div>
      </main>
      {appointmentModal && (
        <AppointmentModal
          patients={patients}
          onClose={() => setAppointmentModal(false)}
          onCreated={load}
        />
      )}
    </div>
  );
}
