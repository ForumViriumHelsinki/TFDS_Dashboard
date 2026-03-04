/**
 * OpenFeature SDK initialization with GOFF web provider.
 * Falls back to InMemoryProvider when GOFF relay is unavailable (local dev).
 */

import { GoFeatureFlagWebProvider } from "@openfeature/go-feature-flag-web-provider";
import { OpenFeature, InMemoryProvider, EvaluationContext } from "@openfeature/react-sdk";

const GOFF_ENDPOINT = "/feature-flags";
const GOFF_HEALTH_TIMEOUT_MS = 3000;

/** Fallback flag defaults when GOFF is unavailable. */
const FALLBACK_FLAGS = {
  "tfds-segments-tab": {
    disabled: false,
    variants: { enabled: true, disabled: false },
    defaultVariant: "disabled",
    contextEvaluator: (context?: EvaluationContext) =>
      context?.domain === "forumvirium.fi" ? "enabled" : "disabled",
  },
};

/**
 * Check if GOFF relay is reachable before attempting to use it.
 */
async function isGoffAvailable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      GOFF_HEALTH_TIMEOUT_MS,
    );

    const response = await fetch(`${GOFF_ENDPOINT}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Initialize OpenFeature with the appropriate provider.
 * Attempts GOFF relay first, falls back to InMemoryProvider.
 */
export async function initializeFeatureFlags(): Promise<void> {
  const context = { targetingKey: "anonymous", app: "tfds-dashboard" };

  const goffAvailable = await isGoffAvailable();

  if (goffAvailable) {
    console.info("Feature flags: connecting to GOFF relay");
    const provider = new GoFeatureFlagWebProvider({
      endpoint: `${window.location.origin}${GOFF_ENDPOINT}`,
    });

    await OpenFeature.setContext(context);

    try {
      await OpenFeature.setProviderAndWait(provider);
      console.info("Feature flags: GOFF provider initialized");
    } catch (error) {
      console.warn(
        "Feature flags: GOFF provider failed, falling back to defaults",
        error,
      );
      await OpenFeature.setProviderAndWait(
        new InMemoryProvider(FALLBACK_FLAGS),
      );
    }
  } else {
    console.info(
      "Feature flags: GOFF relay unavailable, using fallback defaults",
    );
    await OpenFeature.setContext(context);
    await OpenFeature.setProviderAndWait(new InMemoryProvider(FALLBACK_FLAGS));
  }
}

/**
 * Update evaluation context with authenticated user info.
 * Called after successful authentication to enable domain-based targeting.
 */
export async function setUserContext(email: string): Promise<void> {
  const parts = email.split("@");
  const domain = parts.length === 2 ? parts[1] : undefined;
  await OpenFeature.setContext({
    targetingKey: email,
    email,
    ...(domain && { domain }),
    app: "tfds-dashboard",
  });
}

/**
 * Clear evaluation context (e.g., on logout).
 */
export async function clearUserContext(): Promise<void> {
  await OpenFeature.setContext({
    targetingKey: "anonymous",
    app: "tfds-dashboard",
  });
}
