import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { ClientSecretCredential } from "@azure/identity";
import { AIProjectClient } from "@azure/ai-projects";

dotenv.config();

const app = express();

app.use(
cors({
origin: "*",
methods: ["GET", "POST"],
credentials: false,
})
);

app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3000;

const credential = new ClientSecretCredential(
process.env.AZURE_TENANT_ID,
process.env.AZURE_CLIENT_ID,
process.env.AZURE_CLIENT_SECRET
);

const projectClient = new AIProjectClient(
process.env.PROJECT_ENDPOINT,
credential
);

app.get("/", (req, res) => {
res.status(200).json({
success: true,
service: "NDB Foundry Chatbot",
status: "running",
version: process.env.AGENT_VERSION,
timestamp: new Date().toISOString(),
});
});

app.get("/health", async (req, res) => {
try {
const agent = await projectClient.agents.get(
process.env.AGENT_NAME
);

```
res.json({
  success: true,
  healthy: true,
  agent: agent.name,
  timestamp: new Date().toISOString(),
});
```

} catch (error) {
res.status(500).json({
success: false,
healthy: false,
error: error.message,
});
}
});

app.post("/chat", async (req, res) => {
try {
const { message } = req.body;

```
if (!message || typeof message !== "string") {
  return res.status(400).json({
    success: false,
    error: "message is required",
  });
}

console.log(
  `[${new Date().toISOString()}] Incoming message:`,
  message
);

const openAIClient = projectClient.getOpenAIClient();

const response = await openAIClient.responses.create(
  {
    input: message,
  },
  {
    body: {
      agent_reference: {
        type: "agent_reference",
        name: process.env.AGENT_NAME,
        version: process.env.AGENT_VERSION,
      },
    },
  }
);

res.status(200).json({
  success: true,
  answer: response.output_text || "",
  responseId: response.id || null,
  timestamp: new Date().toISOString(),
});
```

} catch (error) {
console.error("CHAT ERROR");
console.error(error);

```
res.status(500).json({
  success: false,
  status: error.status || 500,
  code: error.code || "internal_error",
  error: error.message,
  timestamp: new Date().toISOString(),
});
```

}
});

process.on("SIGINT", () => {
console.log("Shutting down...");
process.exit(0);
});

process.on("SIGTERM", () => {
console.log("Shutting down...");
process.exit(0);
});

app.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
});
