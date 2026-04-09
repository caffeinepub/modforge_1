import { useActor as useCoreActor } from "@caffeineai/core-infrastructure";
import { createActor } from "../backend";
import type { backendInterface } from "../backend";

/**
 * Local wrapper around core-infrastructure's useActor.
 * Binds the project's createActor so callers need zero arguments.
 */
export function useActor(): {
  actor: backendInterface | null;
  isFetching: boolean;
} {
  return useCoreActor(createActor) as {
    actor: backendInterface | null;
    isFetching: boolean;
  };
}
