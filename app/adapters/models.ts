import { createModels, type Api, type Model } from "@earendil-works/pi-ai";
import { openaiProvider } from "@earendil-works/pi-ai/providers/openai";
import { anthropicProvider } from "@earendil-works/pi-ai/providers/anthropic";
import type { StreamFn } from "@earendil-works/pi-agent-core";
import type { PiConfig } from "@/harness";

/** Provider transport is replaceable independently of the agent loop. */
export interface ModelBinding {
  readonly model: Model<Api>;
  readonly stream: StreamFn;
}

export function catalogModels() {
  const models = createModels();
  models.setProvider(openaiProvider());
  models.setProvider(anthropicProvider());
  return models.getModels().map((model) => ({
    provider: model.provider,
    id: model.id,
    name: model.name,
    contextWindow: model.contextWindow,
  }));
}

export function resolveModel(config: PiConfig | undefined): ModelBinding | undefined {
  if (!config) return undefined;
  const key =
    config.provider === "openai" ? process.env.OPENAI_API_KEY : process.env.ANTHROPIC_API_KEY;
  if (!key) return undefined;
  const models = createModels();
  models.setProvider(config.provider === "openai" ? openaiProvider() : anthropicProvider());
  const model = models.getModel(config.provider, config.model);
  if (!model) throw new Error("Configured model is absent from the pinned provider catalog");
  return {
    model,
    stream: (selected, context, options) =>
      models.streamSimple(selected, context, { ...options, apiKey: key }),
  };
}
