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

Keep distinct page gradients, input treatments, shadow geometry, and local
contrast choices local. Cyan focus outlines still use `--accent-secondary`;
AuthShell's white action outlines remain explicit. Gameplay feedback colors
are independent of these site tokens. The tokens preserve current dark-default
values; they do not introduce theme switching or a game-theme API.
