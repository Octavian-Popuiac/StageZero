# StageZero Frontend

The React and TypeScript interface provides event management, a live projection display, and the mobile controller used by each crew. Vite handles local development and production builds.

See the [main README](../README.md) for installation, event operation, network setup, and troubleshooting. Run all `make` commands from the repository root.

## Local development

```sh
make install
make dev
```

Open `http://127.0.0.1:3000`. Vite proxies `/v1` to the API at `127.0.0.1:8000`. Restart the development processes after changing backend code.

| Route | Purpose |
| --- | --- |
| `/` | Crew management, event start, and final PDF export |
| `/display` | Animated waiting screen and live starting grid |
| `/display?debug=1` | Projection display with a small connection indicator |
| `/controller` | Starting-position selection on the shared mobile device |

## Code layout

- `src/pages/` contains the three interfaces. Crew and position components live in `src/components/`.
- `src/contexts/PositionContext.tsx` receives state from the SSE endpoint at `/v1/events`. `src/services/rallyService.ts` submits changes to the API and surfaces server errors.
- `src/App.css` defines the projection layout and its animations, including support for reduced motion.
- `public/` holds the Baja logo, flags, and vehicle manufacturer images.

Run `make check` to type-check and build both projects. In event mode, `make run` builds the frontend into `frontend/dist/` and Express serves it together with the API. The Display and Controller use the same backend to stay synchronized.
