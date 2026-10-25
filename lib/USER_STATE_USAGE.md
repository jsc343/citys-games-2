# Per-User Saved Data (User State) - AI Tutorial

Use this for anything that must survive a reload or a new session: progress, scores, settings, preferences. Never use `localStorage`, `sessionStorage`, `IndexedDB` or cookies for it; those are per device and not durable for Pi users.

## The only import you need

\`\`\`typescript
import { pi } from "@/lib/pi";
\`\`\`

`pi` is a ready-made client. Do not create another one, do not set a backend URL, do not call `window.SDKLite.init()`. It is a plain object, not a hook, so it works in components, stores, event handlers and utility modules alike.

## The four calls

\`\`\`typescript
await pi.userState.set("save", { level: 4, coins: 120 });   // upsert a JSON object under a key
const record = await pi.userState.get("save");              // -> { blob, updatedAt, version } | null
await pi.userState.delete("save");                          // remove a key (ok if it never existed)
const stored = await pi.userState.keys();                   // -> ["save", "settings", ...]
\`\`\`

`get()` returns `null` when the key was never written. Treat that as a fresh start with sensible defaults.

## Rules that keep it working

- Screens render only after the user is logged in, so you never need to check authentication before calling these.
- Call them from effects or event handlers in the browser, never during server rendering.
- Keep the current state in memory and write through. Debounce saves; never write on every keystroke, drag or animation frame.
- A write can be rejected (rate limit, quota, invalid key). Wrap `set()` in `try/catch`, keep the last good state, show a short non-blocking notice, and retry with backoff. Never wipe the UI or reset progress.
- Treat loaded data as untrusted input: render it as text, never via `dangerouslySetInnerHTML`.

## Limits enforced by the backend

- Keys: lowercase letters, digits, `.`, `_`, `-`; max 64 characters. One key per logical slice of state.
- Each value: a JSON object up to 64 KB, nested at most 4 levels.
- Per user: up to 64 keys and 128 KB total.
- Writes: about 1 per 5 s per key and 1 per 2 s across all keys.

When the user is out of space, free it with `pi.userState.delete()` on keys the app no longer needs.
