export function coalescePrefSet(set: Set<string> | null, defaults: Set<string>): Set<string> {
  return set ?? defaults;
}
