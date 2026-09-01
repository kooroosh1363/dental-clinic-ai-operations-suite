// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <svg>{children}</svg>
  ),
  Area: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

const dashboard = {
  todayAppointments: 4,
  confirmedRate: 75,
  pendingApprovals: 1,
  highRiskNoShows: 2,
  weeklyVolume: [
    { day: "Mon", appointments: 4 },
    { day: "Tue", appointments: 2 },
    { day: "Wed", appointments: 3 },
    { day: "Thu", appointments: 1 },
    { day: "Fri", appointments: 4 },
    { day: "Sat", appointments: 1 },
    { day: "Sun", appointments: 0 },
  ],
  serviceMix: [{ service: "Cleaning", count: 4 }],
};
const appointments = [
  {
    id: "a1",
    service: "Cleaning",
    starts_at: "2026-09-01T10:00:00.000Z",
    duration_minutes: 45,
    clinician: "Dr. Rivera",
    status: "confirmed",
    no_show_score: 18,
    patient_name: "Olivia Martin",
    patient_id: "p1",
  },
];
const approvals = [
  {
    id: "q1",
    kind: "estimate",
    summary: "Review estimate before sending",
    status: "pending",
    requested_by: "proposal-agent",
    created_at: "2026-09-01T08:00:00.000Z",
  },
];
const patients = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    full_name: "Olivia Martin",
    email: "olivia@example.test",
    phone: "+1 604 555 0199",
    created_at: "2026-08-01T08:00:00.000Z",
  },
];
const logs = [
  {
    id: "l1",
    action: "auth.login",
    entity_type: "user",
    entity_id: "u1",
    detail: {},
    created_at: "2026-09-01T08:00:00.000Z",
  },
];

function response(data: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}
function installFetch(options: { loginError?: boolean } = {}) {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/auth/login"))
        return options.loginError
          ? response({ error: "Invalid email or password" }, 401)
          : response({
              token: "demo-token",
              user: {
                id: "u1",
                email: "admin@novasmile.demo",
                fullName: "Maya Chen",
                role: "admin",
              },
            });
      if (url.endsWith("/dashboard")) return response(dashboard);
      if (url.endsWith("/appointments")) return response(appointments);
      if (url.endsWith("/approvals")) return response(approvals);
      if (url.endsWith("/patients")) return response(patients);
      if (url.endsWith("/audit")) return response(logs);
      if (url.endsWith("/public/intake"))
        return response({ id: "i1", status: "received" }, 201);
      if (url.includes("/approvals/q1/resolve"))
        return response({
          id: "q1",
          status: JSON.parse(String(init?.body)).status,
        });
      if (url.endsWith("/agent/ask"))
        return response({
          answer: "NovaSmile is open Monday to Friday.",
          citations: [{ id: "1", title: "Office hours" }],
          grounded: true,
          escalated: false,
        });
      return response({ error: "not found" }, 404);
    }),
  );
}
async function login() {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: /open workspace/i }));
  await screen.findByText(/good morning/i);
  return user;
}

beforeEach(() => {
  installFetch();
  Object.defineProperty(globalThis, "ResizeObserver", {
    value: class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
    configurable: true,
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("clinic web application", () => {
  it("renders honest reference label", () => {
    render(<App />);
    expect(screen.getByText(/not a live clinic deployment/i)).toBeTruthy();
  });
  it("prefills the demo admin email", () => {
    render(<App />);
    expect((screen.getByLabelText(/email/i) as HTMLInputElement).value).toBe(
      "admin@novasmile.demo",
    );
  });
  it("prefills the demo password", () => {
    render(<App />);
    expect((screen.getByLabelText(/password/i) as HTMLInputElement).value).toBe(
      "DemoClinic!2026",
    );
  });
  it("shows dashboard after valid login", async () => {
    await login();
    expect(screen.getByText("75%")).toBeTruthy();
    expect(screen.getByText("AI with clear boundaries")).toBeTruthy();
  });
  it("loads appointments from API", async () => {
    await login();
    expect(screen.getByText("Olivia Martin")).toBeTruthy();
    expect(screen.getByText("Dr. Rivera")).toBeTruthy();
  });
  it("opens appointment workspace", async () => {
    const user = await login();
    await user.click(screen.getByRole("button", { name: /appointments/i }));
    expect(screen.getByRole("heading", { name: "Appointments" })).toBeTruthy();
  });
  it("opens human approval queue", async () => {
    const user = await login();
    await user.click(screen.getByRole("button", { name: /approvals/i }));
    expect(screen.getByText("Review estimate before sending")).toBeTruthy();
  });
  it("resolves an approval through admin action", async () => {
    const user = await login();
    await user.click(screen.getByRole("button", { name: /approvals/i }));
    await user.click(screen.getByRole("button", { name: /approve/i }));
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/approvals/q1/resolve"),
        expect.objectContaining({ method: "POST" }),
      ),
    );
  });
  it("opens AI assistant safety workspace", async () => {
    const user = await login();
    await user.click(screen.getByRole("button", { name: /ai assistant/i }));
    expect(screen.getByText("Safety boundary")).toBeTruthy();
  });
  it("asks grounded assistant question", async () => {
    const user = await login();
    await user.click(screen.getByRole("button", { name: /ai assistant/i }));
    await user.click(screen.getByRole("button", { name: /ask assistant/i }));
    expect(await screen.findByText(/NovaSmile is open Monday/)).toBeTruthy();
    expect(screen.getByText("Office hours")).toBeTruthy();
  });
  it("shows invalid-login error", async () => {
    vi.unstubAllGlobals();
    installFetch({ loginError: true });
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /open workspace/i }));
    expect(await screen.findByText(/invalid email or password/i)).toBeTruthy();
  });
  it("signs out to login screen", async () => {
    const user = await login();
    await user.click(screen.getByTitle("Sign out"));
    expect(
      screen.getByRole("button", { name: /open workspace/i }),
    ).toBeTruthy();
    expect(localStorage.getItem("novasmile-token")).toBeNull();
  });
  it("stores the demo token after login", async () => {
    await login();
    expect(localStorage.getItem("novasmile-token")).toBe("demo-token");
  });
  it("opens the public patient intake form", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      screen.getByRole("button", { name: /request a patient appointment/i }),
    );
    expect(
      screen.getByRole("heading", { name: /tell us how we can help/i }),
    ).toBeTruthy();
  });
  it("submits a consented public intake request", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      screen.getByRole("button", { name: /request a patient appointment/i }),
    );
    await user.type(screen.getByLabelText(/full name/i), "Jordan Lee");
    await user.type(screen.getByLabelText(/^email/i), "jordan@example.test");
    await user.type(screen.getByLabelText(/phone/i), "+16045550123");
    await user.type(screen.getByLabelText(/preferred date/i), "2026-09-15");
    await user.type(
      screen.getByLabelText(/message/i),
      "Routine cleaning request",
    );
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /submit request/i }));
    expect(await screen.findByText(/request received/i)).toBeTruthy();
  });
  it("opens the patient directory", async () => {
    const user = await login();
    await user.click(screen.getByRole("button", { name: /^patients$/i }));
    expect(screen.getByText("olivia@example.test")).toBeTruthy();
  });
  it("opens the audit trail for admins", async () => {
    const user = await login();
    await user.click(screen.getByRole("button", { name: /audit trail/i }));
    expect(screen.getByText("auth.login")).toBeTruthy();
  });
  it("filters appointments with workspace search", async () => {
    const user = await login();
    await user.type(
      screen.getByLabelText(/search workspace/i),
      "missing patient",
    );
    expect(screen.getByText(/no appointments yet/i)).toBeTruthy();
  });
  it("opens the real new appointment form", async () => {
    const user = await login();
    await user.click(screen.getByRole("button", { name: /new appointment/i }));
    expect(
      screen.getByRole("dialog", { name: /new appointment/i }),
    ).toBeTruthy();
    expect(screen.getByLabelText(/^patient/i)).toBeTruthy();
  });
  it("closes the new appointment form", async () => {
    const user = await login();
    await user.click(screen.getByRole("button", { name: /new appointment/i }));
    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("creates an appointment through the API", async () => {
    const user = await login();
    await user.click(screen.getByRole("button", { name: /new appointment/i }));
    await user.type(
      screen.getByLabelText(/date and time/i),
      "2026-09-15T10:30",
    );
    await user.click(
      screen.getByRole("button", { name: /create appointment/i }),
    );
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/appointments"),
        expect.objectContaining({ method: "POST" }),
      ),
    );
  });
  it("opens all appointments from dashboard shortcut", async () => {
    const user = await login();
    await user.click(screen.getByRole("button", { name: /view all/i }));
    expect(screen.getByRole("heading", { name: "Appointments" })).toBeTruthy();
  });
  it("returns from intake to staff login", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      screen.getByRole("button", { name: /request a patient appointment/i }),
    );
    await user.click(screen.getByRole("button", { name: /^back$/i }));
    expect(
      screen.getByRole("button", { name: /open workspace/i }),
    ).toBeTruthy();
  });
});
