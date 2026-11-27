# AI Integration

- **Default Mode**: `local_deterministic` (`src/lib/ai/localEngine.ts`) — runs 100% offline using your local IndexedDB records.
- **Confirmation Rule**: Food logging requests are parsed into `proposedFoodLogs` and require explicit user confirmation before being written to `foodLogs`.
- **External / Local LLM Providers**: Optional `ollama` or `openai_compatible` endpoints can be configured in **Backup & Settings**. External data sharing is disabled by default until `aiConsentGranted` is explicitly enabled by the user.
