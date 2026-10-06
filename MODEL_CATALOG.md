# Codec model catalogue

The model dropdown loads `GET /models` from the configured backend at startup and through **Refresh Models**. The backend catalogue is also the chat allowlist, so new choices do not require a Pages/mobile rebuild. Bundled choices remain available if the catalogue cannot be fetched.

Default: `gpt-5.4-mini`. Choices also include `gpt-5.4`, GPT-4.1 Mini, GPT-4.1, GPT-4o Mini and mock mode. Existing saved selections remain selected when still available.

## Adding a model

1. Verify official documentation for image input, streaming Chat Completions, pricing and account access. A model ID appearing in OpenAI's model list does not guarantee these capabilities.
2. Set the Worker's `MODEL_CATALOG_JSON` variable to a JSON array of additions/overrides, for example:

```json
[
  {
    "id": "gpt-future-mini",
    "name": "Future Mini",
    "description": "New compatible chat and vision model",
    "inputPrice": 1,
    "outputPrice": 5,
    "adapter": "standard"
  }
]
```

This example ID is illustrative; replace it with a verified real model ID and published USD prices per million tokens. The variable is public catalogue configuration, not a secret. Use `.dev.vars` locally and the production Worker configuration for the hosted app.

3. Test a short completion and image input on the backend, then click **Refresh Models** in the app. Backend variable changes create a deployment; the frontend bundle can stay unchanged.

Adapters:
- `standard`: sends `temperature` and `max_tokens`.
- `reasoning-none`: sends `reasoning_effort: none` and `max_completion_tokens`, omitting temperature. Used for GPT-5.4/mini.
- `mock`: reserved for the built-in `mock` model, no provider request.

A model requiring another endpoint, unsupported reasoning settings or different image handling needs a new backend adapter before it can be enabled. Do not expose embedding, transcription, image-generation or audio-only models as chat choices.

Prices are displayed separately for input/output. Budget tracking remains an approximate in-memory estimate, not an authoritative provider billing total.

Official sources: [GPT-5.4 Mini](https://developers.openai.com/api/docs/models/gpt-5.4-mini), [GPT-5.4](https://developers.openai.com/api/docs/models/gpt-5.4).
