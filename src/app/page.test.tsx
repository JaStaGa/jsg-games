import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("home page", () => {
  it("renders the foundation state without publishing a game", () => {
    const markup = renderToStaticMarkup(<Home />);

    expect(markup).toContain("<h1 id=\"page-title\">JSG Games</h1>");
    expect(markup).toContain("No games have been migrated yet.");
  });
});
