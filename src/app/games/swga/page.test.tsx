import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SwgaPage from "./page";

describe("SWGA page", () => {
  it("renders the playable game baseline", () => {
    const markup = renderToStaticMarkup(<SwgaPage />);

    expect(markup).toContain("<h1>SWGA</h1>");
    expect(markup).toContain('aria-label="Current game stats"');
    expect(markup).toContain("Round");
    expect(markup).toContain("Score");
    expect(markup).toContain("6 left");
    expect(markup).toContain('aria-label="Game mode"');
    expect(markup).toContain('aria-pressed="true">Untimed</button>');
    expect(markup).toContain(
      'aria-pressed="false">60 Seconds (Ranked)</button>',
    );
    expect(markup).not.toContain("Time remaining:");
    expect(markup).toContain('aria-label="On-screen keyboard"');
    expect(markup).toContain("Help");
    expect(markup).toContain("Restart");
  });
});
