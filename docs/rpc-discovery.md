# Native P2P RPC discovery (search-v1)

Source bases: Golos Desktop `59a52cd73506e058b646ec58bf9ba65312b34aa9` (1.8.1); ui-blogs `0a266b883e2026cdb02b7e52b63c351571b8cb1b` (1.6.0). Electron requested version range remains ^39.1.2, not an installed/runtime version assertion.

## Shared implementation

Desktop `tool/electron/rpc-discovery/` and standalone Blogs `electron/rpc-discovery/` are byte-identical vendored project source. `rpc-discovery-shared-sha256.json` records every shared file; update both copies and the hashes together. Neither application imports the other installation. No new runtime JS dependencies. Tests run with `npm run test:discovery`.

Minimal seam: trusted main-process menu or the existing app-settings page opens an isolated local panel. Only that owned panel's main frame can invoke argument-free start/cancel IPC. The panel is sandboxed/context-isolated, Node-disabled, navigation-blocked, network-disabled by CSP. Native child stdout is untrusted. The settings-save boundary is explicitly owned and schema-limited; the broader legacy Desktop custom app protocol and unrelated capabilities are not certified by this feature.

## Stable native contract agreed with core worker

`golos-rpc-directory-client --search CONFIG_DIR SECONDS [--seed HOST:PORT ...]`

The adapter invokes exactly `--search <userData>/rpc-discovery 15`. It supplies no renderer values or optional seeds. Native core owns bounded cached/default bootstrap traversal, connection/peer budgets and referral/DNS policy. Ordinary first-party chain seed nodes are bootstrap contacts, NOT fixed RPC-catalog providers, and may provide no announcements. Do not substitute a predetermined RPC list for discovery.

Stdout: one final UTF-8 JSON array (maximum 65536 bytes, maximum 64 entries), each `{ "url": "wss://...", "expires": <integer Unix seconds>, "trust": "UNVERIFIED_PEER_ANNOUNCEMENT" }`. Exit 0 means nonempty valid results; exit 3 means `[]`; cancellation/error/nonzero/signals discard output. No JSON-lines/progress messages on stdout. Diagnostic stderr is drained, bounded separately and never forwarded to the UI. Output URLs require explicit HTTP(S)/WS(S) scheme, hostname, no credentials/fragment/control characters/backslash, length <=2048, nonexpired metadata. This is syntax validation, not endpoint safety/chain verification.

The main process launches one fixed resources path with shell:false, bounded args, no stdin, private discovery config directory, OS/profile/TMP/locale/CA environment allowlist and no application credential variables. It enforces one child, a fixed 18s deadline and bounded cancellation escalation (TERM then KILL after 1s). If exit is unconfirmed after 2s, the UI receives STOP_FAILED but the concurrency slot stays blocked until actual close. No full node, WSL, Docker or PATH-discovered fallback is permitted.

## Selection / privacy policy

No startup background search is enabled. Search/cancel never fetch, probe, select or persist a discovered RPC. Each readonly result also has a keyboard-accessible «Выбрать RPC» button. Its renderer sends only a result index; main owns the current result list, expiry and generation. A native warning (Cancel by default) must be explicitly confirmed before the candidate is staged into the actual settings custom-address radio. Staging does not alter get-settings/current client configuration. Only the existing settings Save action persists the approved eight-field form schema through AppSettings.saveSettings and restarts the application. Manual local/public/custom choices remain available; copying is optional. HTTP(S)/WS(S) syntax matches golos-lib-js 0.9.80 lib/api/index.js `_setTransport`, whose HTTP/WS branches were inspected from the registry package; availability/network correctness is NOT checked.

Settings now uses a main-owned sandboxed window with a dedicated preload. Save/candidate IPC requires that exact webContents and its mainFrame, plus the expected URL; an ordinary Blogs page cannot gain write authority through history.replaceState. Unknown fields, nested config payloads and invalid types are rejected rather than silently filtered. Main merges approved fields into its existing configuration. The standalone app protocol adds a frontend-compatible CSP (inline bootstrap/styles allowed; no JavaScript eval, objects, foreign scripts or base override; WebAssembly compilation is explicitly permitted by wasm-unsafe-eval). This is scoped hardening, not a full application security audit.

Runtime gate: both products require a newly built Blogs frontend containing the updated AppSettings flat-submit and candidate integration. An old frontend sending whole cfg is intentionally rejected; do not combine the new shell with stale assets. Node VM tests exercise the actual form callbacks, saved/reloaded settings and MainApp client assignment, but are not a webpack rebuild, real HTTP/WS transport, packaged GUI or NVDA test.

## Packaging

Electron-builder beforePack validates the current target's native input and provenance; extraResources copies only native executable/library/license/provenance files outside ASAR:

`native/rpc-discovery/<win32|linux>-<x64|ia32|arm64>/golos-rpc-directory-client[.exe]`

with sibling `provenance.json` containing `contract: "search-v1"`, matching `platform`/`arch`, `sourceRepository: "https://github.com/golos-blockchain/chain-node"`, 40-lowercase-hex `sourceCommit`, and executable `sha256`. Bundle required DLL/SO runtime dependencies and licenses there. No native binaries are fabricated or copied by this patch. Missing files fail packaging and runtime search clearly. Hash/magic/provenance checks are not signatures, PE import verification, an antivirus verdict or proof of correct architecture/runtime behavior.

Standalone Blogs: `npm run build:standalone`, then `npm run pack:standalone` after dependency review/provisioning. Existing webpack/app-entry generates frontend/config; the added build-shell copies the independent Electron shell/shared adapter. The Desktop builder copies its own trusted shell last so the standalone Blogs shell cannot overwrite it.

## Remaining release gates

Native Windows/Linux artifacts and dependency/import/minimal-PATH proof, helper CLI interoperability, real P2P results, full frontend build, packaged runtime paths/stop behavior, routing with user-selected RPC and keyboard/NVDA acceptance are separate gates. Unit fixtures synthesize protocol output only for parser/lifecycle tests; they are not network-discovered results. This source change does not certify live feed/post acceptance. Feed/post routing and packaged GUI acceptance remain pending; previous local GUI work is not a release pass. No keys or live profile files are included.

## Native source prerequisite

The native helper depends on the core rpc_directory_client source work (chain-node PR #252). Its merge status and a clean Windows runtime dependency closure are not established here. The application integration neither builds nor publishes that executable. Do not substitute local binaries for reproducible public source prerequisites.

Submission base: upstream dev at `45a6bf8399cc6d1d9154cd8013b0014eb521e6ab`; upstream Firebase/mobile and git-install changes are preserved. Formik keeps the upstream relative local dependency selector (equivalent local directory, not a copied package). Run the explicit pinned prepare:formik step before dependency provisioning. The upstream preinstall hook remains in place and is not covered by the pinned preparation script safety guarantees. No frozen install/build has been verified on this port.
