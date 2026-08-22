# Game modules

Each game belongs in its own feature module under this directory. A game module
owns its gameplay logic, game-specific components, data and assets, and tests.

Game modules may consume shared site services and shared UI, but shared
site-level systems must remain outside individual game modules. This keeps new
games independently maintainable without duplicating application-wide
concerns.

No game implementations have been added yet.
