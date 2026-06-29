import { useEffect, useState } from "react";
import {
  configureHubUrlPrefs,
  patchHubListPrefs,
  readHubListPrefsCore,
  subscribeHubListPrefs,
} from "@tool-workspace/hub-ui";

configureHubUrlPrefs({
  defaultRange: "30d",
  defaultLimit: 100,
  patchImpl: (patch) => {
    const sp = new URLSearchParams(window.location.search);
    for (const [k, v] of Object.entries(patch)) {
      if (v == null) sp.delete(k);
      else sp.set(k, v);
    }
    const path = window.location.pathname;
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `${path}?${qs}` : path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  },
});

export function readHubListPrefs() {
  return readHubListPrefsCore();
}

export function useHubListPrefs() {
  const [prefs, setPrefs] = useState(readHubListPrefs);
  useEffect(() => subscribeHubListPrefs(() => setPrefs(readHubListPrefs())), []);
  return prefs;
}

export { patchHubListPrefs, readHubListPrefsCore };
