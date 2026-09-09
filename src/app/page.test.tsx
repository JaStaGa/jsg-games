import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("home page", () => {
  it("links to both registered games", () => {
    const markup = renderToStaticMarkup(<Home />);

    expect(markup).toContain("<h1 id=\"page-title\">JSG Games</h1>");
    expect(markup).toContain("2 games available.");
    expect(markup).toContain('href="/games/character-guessing"');
    expect(markup).toContain("Character Guessing");
    expect(markup).toContain('href="/games/swga"');
    expect(markup).toContain("SWGA");
  });
});
