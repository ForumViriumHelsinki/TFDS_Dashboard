import {
  OpenFeature,
  InMemoryProvider,
  type EvaluationContext,
} from "@openfeature/react-sdk";

const isAuthenticated =
  String(import.meta.env.VITE_AUTHENTICATED || "").toLowerCase() === "true";

const flags = {
  "segments-tab": {
    disabled: false,
    variants: {
      on: true,
      off: false,
    },
    defaultVariant: "off",
    contextEvaluator: (context?: EvaluationContext) =>
      context?.authenticated ? "on" : "off",
  },
};

OpenFeature.setProvider(new InMemoryProvider(flags));
OpenFeature.setContext({ authenticated: isAuthenticated });
