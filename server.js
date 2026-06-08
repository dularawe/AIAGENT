import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { ClientSecretCredential } from "@azure/identity";
import { AIProjectClient } from "@azure/ai-projects";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

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
  res.json({
    success: true,
    service: "NDB Foundry Chatbot",
    agent: process.env.AGENT_NAME,
    version: process.env.AGENT_VERSION
  });
});

app.post("/chat", async (req, res) => {
  try {

    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Message is required"
      });
    }

    const openAIClient = projectClient.getOpenAIClient();

const response = await openAIClient.responses.create(
  {
    input: message
  },
  {
    body: {
      agent_reference: {
        type: "agent_reference",
        name: process.env.AGENT_NAME,
        version: process.env.AGENT_VERSION
      }
    }
  }
);

    res.json({
      success: true,
      answer: response.output_text,
      responseId: response.id
    });

  } catch (error) {

    console.error("CHAT ERROR");
    console.error(error);

    res.status(500).json({
      success: false,
      status: error.status,
      code: error.code,
      message: error.message
    });

  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server Running on Port ${PORT}`);
});