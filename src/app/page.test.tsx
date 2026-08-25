import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("home page", () => {
  it("links to the registered SWGA game", () => {
    const markup = renderToStaticMarkup(<Home />);

    expect(markup).toContain("<h1 id=\"page-title\">JSG Games</h1>");
    expect(markup).toContain("1 game available.");
    expect(markup).toContain('href="/games/swga"');
    expect(markup).toContain("SWGA");
  });
});
