# StageZero

StageZero runs the live start-order selection for SS1 at Baja de Lagos. After the prologue, the organizer enters the results, eligible crews take turns choosing a starting position on a shared phone or tablet, and a projected display shows each choice as it happens. The organizer can download the confirmed grid as a PDF once selection is complete.

The application uses React, TypeScript, Vite, Express, and SQLite. A single Node.js process serves the frontend and API, validates each selection, and pushes updates to connected browsers through Server-Sent Events (SSE). SQLite keeps the event state on the host computer, which makes it possible to run the event on a private network without internet access once dependencies are installed.

- [Quick start](#quick-start)
- [Run an event](#run-an-event)
- [Connect the controller](#connect-the-controller)
- [Data and backups](#data-and-backups)
- [Development and testing](#development-and-testing)
- [Troubleshooting](#troubleshooting)

## Quick start

Use Node.js **22.13 or later**, npm, and `make`. Node 24 LTS is recommended and specified in `.nvmrc`. The `sqlite3` command-line tool is only needed for backups.

On macOS with [Homebrew](https://formulae.brew.sh/formula/node@24):

```sh
brew install node@24
export PATH="$(brew --prefix node@24)/bin:$PATH"
node -v
```

If Node 24 is already installed, run the `export` in the terminal you plan to use, including the VS Code integrated terminal. For future sessions, add it to your shell's startup file, such as `~/.zshrc` for interactive zsh or `~/.bash_profile` for a Bash login shell. If you already use nvm, run `nvm install && nvm use` from the repository root.

From the repository root:

```sh
make install
make run
```

`make install` installs dependencies from the frontend and backend lockfiles. `make run` builds both projects and starts the server on port **8000**. Keep the terminal open during the event. Press `Ctrl+C` to stop it.

| Interface | Address |
| --- | --- |
| Event management | [http://localhost:8000/](http://localhost:8000/) |
| Projection display | [http://localhost:8000/display](http://localhost:8000/display) |
| Mobile controller | Open the network URL ending in `/controller` shown by `make run` |
| API health check | [http://localhost:8000/v1/health](http://localhost:8000/v1/health) |

## Run an event

The interface is in Portuguese. The labels below match the application.

1. On the host computer, open **Gerir Equipas** and enter each crew's number, vehicle manufacturer, driver and co-driver, their countries, and the prologue time. Enter times as `mm:ss:cc`, for example `02:15:42` for 2 minutes, 15 seconds, and 42 hundredths.
2. Open the **Display** on the projector and switch the browser to full screen. The waiting screen shows the Baja logo and an animated track. Open the **Controller** on the phone or tablet that will pass between crews.
3. From the homepage, select **Iniciar escolha da ordem de partida**. A Display that was already open plays the opening animation and reveals the grid. The Controller shows the first eligible crew. The projection respects the device's reduced-motion preference.
4. Use **▲** and **▼** on the Controller to choose a starting position. The Display previews the choice and shows the active driver and co-driver. Select **Confirmar** to save the grid and hand the device to the next crew.
5. Once every eligible crew has confirmed, select **Exportar ordem final em PDF**. The report includes the starting position, crew number, vehicle manufacturer, driver and co-driver details, and prologue time. Save the PDF before resetting the event.

Use `/display?debug=1` to show a small live connection indicator. A lost connection is shown in the standard Display as well.

### Selection rules

- The ten fastest crews are eligible, or all crews if there are fewer than ten. Ties in the prologue classification are ordered by ascending crew number. Crews choose in reverse classification order.
- A crew may choose an occupied position. Affected crews move down towards the first available slot. If all available slots are above the chosen position, the affected crews move up towards the nearest vacancy.
- The crew list is locked as soon as selection starts. **Gerir Equipas → Reiniciar posições** clears the grid, retains the registered crews, and restores the waiting screen.
- The PDF is enabled only after completion. Resetting the grid disables export until the next selection is complete.

## Connect the controller

### Local network or phone hotspot

Connect the host computer and the controller device to the same trusted network. On the phone or tablet, open the address printed as **Controlador na rede**, for example `http://192.168.1.20:8000/controller`. Use the host computer's actual IP address. The address `localhost` points to the device on which it is opened.

Run `make urls` after switching networks. To print the URL using a specific address, run `make urls IP=192.168.1.20`.

A venue or guest network may isolate devices. Ask the venue's IT team whether the tablet can reach the host on TCP port 8000. A second phone's hotspot is another option for connecting both devices. Test a full selection on that hotspot in advance because client-to-client connectivity varies. Anyone who can reach the application on the local network can access the Controller.

### VS Code Ports

VS Code can forward the host's port over the internet while the projector continues to use the local Display. To test reachability, start StageZero, select **Ports → Forward a Port** in VS Code, and enter `8000`. Keep the port **Private**, open the forwarded URL with `/controller` appended, and sign in on the tablet with the same account used to create the tunnel. Stop forwarding from the Ports panel when finished.

**Current limitation.** The forwarded URL uses HTTPS. The current API accepts HTTP origins for write requests, so the Controller may load while position selection or confirmation fails with `403` and «Origem do pedido inválida». Voting through the tunnel requires an update to origin validation and an end-to-end rehearsal. A tested local network or hotspot is the supported setup for the current version.

A **Public** forwarded port removes the visitor sign-in and exposes the entire service, including the API. Appending `/controller` selects a page within that service. [VS Code port forwarding documentation](https://code.visualstudio.com/docs/debugtest/port-forwarding)

### Online deployment

A Node.js host with a persistent disk can retain the current SQLite architecture. Public deployment requires authentication for event management and Controller actions, HTTPS origin handling, and verification of live updates.

Deploying the full application to Vercel would require adapting the backend to use a shared store such as MongoDB Atlas and revisiting live synchronization. Vercel Functions provide temporary writable storage and have execution time limits. [Vercel Functions runtime documentation](https://vercel.com/docs/functions/runtimes)

## Data and backups

By default, the server stores the crews, event status, and grid in `data/stagezero.sqlite` at the repository root. The data survives server restarts. A fresh database is empty. Records from a previous external database must be exported and entered into the current installation.

- **Back up.** Stop the server and run `make backup`. This copies the default database to `data/backups/` using the `sqlite3` command-line tool. For a custom database path, use SQLite's `.backup` command on that file.
- **Restore.** Stop the server, keep a copy of the current database, and place the backup at the configured database path. Restart and verify the crews and grid.
- **Rehearse.** Use a separate database so rehearsal results stay separate from event data.

```sh
STAGEZERO_DB="$PWD/data/rehearsal.sqlite" make run
```

## Development and testing

| Path | Responsibility |
| --- | --- |
| [`frontend/`](frontend/README.md) | React interface for event management, projection, and crew selection |
| [`backend/src/main.ts`](backend/src/main.ts) | Express API, persistence, live updates, and static frontend serving |
| [`backend/src/rally.ts`](backend/src/rally.ts) | Classification, eligibility, and grid placement rules |
| [`backend/src/startListPdf.ts`](backend/src/startListPdf.ts) | Final start-order PDF |
| [`backend/test/`](backend/test/) | Rule and API integration tests |

`make dev` starts Vite at `127.0.0.1:3000` and the API at `127.0.0.1:8000`. Vite reloads the frontend and proxies `/v1` to the local API. Restart the development processes after changing backend code to recompile it. Use `make run` to test with a separate device.

| Command | Purpose |
| --- | --- |
| `make help` | List available commands |
| `make install` | Install locked dependencies |
| `make run` | Build and start the application |
| `make start` | Start the server using existing build output |
| `make urls` | Print Display and Controller URLs |
| `make dev` | Start frontend and API development processes |
| `make check` | Type-check and build both projects |
| `make test` | Build and test event start, selection, live updates, persistence, and PDF export |
| `make audit` | Audit npm dependencies |
| `make backup` | Back up the default SQLite database |
| `make clean` | Remove build output |

Set `PORT` to use a different port, for example `make run PORT=8080`. Use `make run HOST=127.0.0.1` for a host-only session.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| `make run` reports Node 20 | Run `node -v` and `command -v node` in that terminal, then activate Node 24. |
| TypeScript reports `TS2688` for names such as `node 3` | Run `make install` from the repository root to recreate both `node_modules` directories from the lockfiles. |
| The host browser refuses the connection | Check that the server is still running and the URL uses the correct port. Try `/v1/health`. |
| The Display opens on the host, but the controller cannot connect | Check the address with `make urls`, the host firewall, and the network's device isolation settings. |
| The tunneled Controller opens, but writes fail with `403` | See the HTTPS limitation under [VS Code Ports](#vs-code-ports). |
| The Display and Controller are waiting | Add at least one crew and start selection from the homepage. |
| PDF export is disabled | Check connectivity and confirm that every eligible crew has selected a position. |

Before the event, rehearse with the actual computer, projector, and controller device. Verify the opening animation, the preview of an occupied position, the handover to the next crew, and PDF export after the final choice.
