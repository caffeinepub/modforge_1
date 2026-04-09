// Re-export Internet Identity utilities from the platform package.
// Components import from this local path so they are isolated from
// package-name changes.
export {
  useInternetIdentity,
  InternetIdentityProvider,
} from "@caffeineai/core-infrastructure";
export type {
  InternetIdentityContext,
  Status,
} from "@caffeineai/core-infrastructure";
