import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PageFrame, Surface } from "./page-surfaces";
import { AuthShell } from "./auth-shell";

describe("page surfaces", () => {
  it("preserves a single main landmark and a labelled section without extra wrappers", () => {
    const html = renderToStaticMarkup(
      <PageFrame id="content" className="local-page" tabIndex={-1}>
        <Surface as="section" variant="framed" className="local-panel" aria-labelledby="title">
          <h1 id="title">Page title</h1>
        </Surface>
      </PageFrame>,
    );
    expect(html).toMatch(/^<main[^>]*><section[^>]*><h1 id="title">Page title<\/h1><\/section><\/main>$/);
    expect(html).toContain('id="content"');
    expect(html).toContain('tabindex="-1"');
    expect(html).toContain('aria-labelledby="title"');
    expect(html).toContain("local-page");
    expect(html).toContain("local-panel");
    expect(html).not.toMatch(/\s(?:as|variant)=/);
  });

  it("supports native list items and neutral divs without adding landmarks", () => {
    const html = renderToStaticMarkup(
      <ul><Surface as="li"><Surface role="status">Ready</Surface></Surface></ul>,
    );
    expect(html).toMatch(/^<ul><li[^>]*><div[^>]* role="status">Ready<\/div><\/li><\/ul>$/);
  });

  it("retains AuthShell's heading association and form content", () => {
    const html = renderToStaticMarkup(
      <AuthShell eyebrow="Account" title="Sign in" description="Welcome back">
        <form><label htmlFor="email">Email</label><input id="email" type="email" /></form>
      </AuthShell>,
    );
    expect(html.match(/<main\b/g)).toHaveLength(1);
    expect(html).toContain('aria-labelledby="auth-title"');
    expect(html).toContain('<h1 id="auth-title">Sign in</h1>');
    expect(html).toContain('<label for="email">Email</label>');
  });
});
