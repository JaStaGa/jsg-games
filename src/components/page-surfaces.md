# Shared page surfaces

`PageFrame` renders one native `main` with a full-width, centered grid and
responsive page padding. Use it once per page. Its default spacing fits Stats
and Leaderboards; pass a CSS module `className` for other page layouts.

`Surface` renders a bordered background, without adding wrappers. Its default
element is `div`; choose `as="section"` with an accessible heading association
or `as="li"` inside a list. `variant="framed"` adds the existing JSG gradient,
inset border, accent stripe, responsive padding, and 68rem maximum width.

Both forward native attributes and children. Shared CSS uses `:where()` so
local classes override defaults without depending on stylesheet load order.
Keep intentional widths, spacing, typography, and decorations in local CSS.
For example, the homepage keeps its 42rem clipped card, AuthShell its 34rem
card, and the theme selector its 960px layout and rounded theme cards.

```tsx
<PageFrame>
  <Surface as="section" variant="framed" aria-labelledby="page-title">
    <h1 id="page-title">Page title</h1>
    {/* Page content */}
  </Surface>
</PageFrame>
```

These are presentation primitives, with no client state or data access.
SWGA and Character Guessing gameplay deliberately retain their own shells,
panels, and responsive rules, including NBA's wider comparison layout.

Shared visual decisions live in `src/app/globals.css`: site grid lines, inset
and table surfaces, emphasized/subtle borders, panel/card/heading shadows,
accent decoration, primary-action text and hover color, and the default focus
ring. Reuse a token when both its purpose and value match. A coincidentally
equal gradient stop is not necessarily a table-heading surface.

Keep distinct dark gradients and shadow geometry local. Site appearance uses
`html[data-theme="light"]` semantic overrides, with dark as the default and no
system-theme inference. Neutral light surfaces use navy/blue text; orange is
retained for actions, while `--accent-text` supplies readable accent text.
Light-only surface/glow/control tokens override the local dark fallbacks.
AuthShell action outlines use `--foreground`; other focus rings use
`--focus-ring` or `--accent-secondary`.

`site-theme.ts` validates the explicit `jsg-theme` localStorage preference.
The root layout runs its small synchronous inline initializer in the head,
before body parsing/React hydration. Only the root attribute's expected
hydration difference is suppressed. Storage failures safely fall back to dark;
a failed write still allows switching for the current page.

The server-rendered SiteHeader contains one AppearanceControl client component
inside the existing SiteNavigation disclosure and retains one AuthControls.
The native labelled Dark/Light select updates the root immediately and saves
the choice. An external-store snapshot keeps its selected value synchronized
without a hydration mismatch; a layout effect restores the attribute after
React's development Strict Mode remount.

Gameplay feedback colors remain independent. SWGA pins only its inherited
grid/focus tokens at appShell. Character Guessing pins its consumed semantic
colors and dark color-scheme at its existing page root (including NBA), with
a dark backdrop when the body is light. Existing game layout and feedback
rules are unchanged; there is no generic per-game theme API.
