import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SignedInAuthControls } from "./auth-controls";

describe("signed-in header controls", () => {
  it("keeps the email and sign-out UI while adding the Profile link", () => {
    const markup = renderToStaticMarkup(
      <SignedInAuthControls identity="player@example.com" />,
    );

    expect(markup).toContain("player@example.com");
    expect(markup).toContain('href="/profile"');
    expect(markup).toContain("Profile");
    expect(markup).toContain('action="/auth/signout"');
    expect(markup).toContain("Sign out");
  });
});
