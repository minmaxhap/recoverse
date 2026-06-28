import { REFLECTION_SHARE_HASH_PREFIX } from "./reflectionShare";

export interface ModeHistoryState<TMode extends string = string> {
  recoverseMode: TMode;
}

export function createHistoryState<TMode extends string>(mode: TMode): ModeHistoryState<TMode> {
  return { recoverseMode: mode };
}

export function shouldRecordHistory(options: { recordHistory?: boolean }): boolean {
  return options.recordHistory !== false;
}

export function urlWithoutHash(pathname: string, search: string): string {
  return `${pathname}${search}`;
}

export function popFallbackMode<TMode extends string>(stack: TMode[], defaultMode: TMode): TMode {
  return stack.pop() ?? defaultMode;
}

export function urlHasShareHash(locationHash: string): boolean {
  return locationHash.startsWith(REFLECTION_SHARE_HASH_PREFIX);
}
