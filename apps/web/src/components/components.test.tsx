import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Logo } from "./Logo";
import { StatusPill } from "./StatusPill";

describe("presentational components", () => {
  it("renders full logo name", () =>
    expect(renderToStaticMarkup(<Logo />)).toContain("NovaSmile"));
  it("renders logo subtitle", () =>
    expect(renderToStaticMarkup(<Logo />)).toContain("Clinic operations"));
  it("hides copy in compact logo", () =>
    expect(renderToStaticMarkup(<Logo compact />)).not.toContain(
      "Clinic operations",
    ));
  it("keeps decorative mark hidden", () =>
    expect(renderToStaticMarkup(<Logo />)).toContain('aria-hidden="true"'));
  it.each([
    "confirmed",
    "scheduled",
    "completed",
    "cancelled",
    "no_show",
    "pending",
    "approved",
    "rejected",
  ])("renders status %s", (status) =>
    expect(renderToStaticMarkup(<StatusPill value={status} />)).toContain(
      status.replaceAll("_", " "),
    ),
  );
  it("normalizes no-show class", () =>
    expect(renderToStaticMarkup(<StatusPill value="no_show" />)).toContain(
      "pill-no-show",
    ));
});
