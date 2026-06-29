import { buildVersionMetaItems } from "@tool-workspace/hub-ui";

const APP_VERSION = "0.1.0";

/** Left rail meta — `v0.1.0 · activity` (P0004 Users / Hub golden). */
export function buildOrderDeskVersionMetaItems(live = true) {
  return buildVersionMetaItems(APP_VERSION, undefined, live);
}
