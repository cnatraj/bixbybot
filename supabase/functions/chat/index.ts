import { OpenAI } from "npm:openai@4.28.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ASSISTANT_ID = Deno.env.get("OPENAI_ASSISTANT_ID");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const FUNCTION_VERSION = "1.0.3";

interface ChatRequest {
  message: string;
  threadId?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Debug: Log environment variables (masked)
    console.log("Environment check:", {
      hasApiKey: !!OPENAI_API_KEY,
      hasAssistantId: !!ASSISTANT_ID,
      apiKeyLength: OPENAI_API_KEY?.length || 0,
    });

    // Validate OpenAI credentials
    if (!OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }

    if (!ASSISTANT_ID) {
      throw new Error("OpenAI Assistant ID not configured");
    }

    const { message, threadId }: ChatRequest = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({
          error: "Message is required",
          version: FUNCTION_VERSION,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Processing request:", {
      messageLength: message.length,
      hasThreadId: !!threadId,
    });

    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
      defaultHeaders: {
        "OpenAI-Beta": "assistants=v2",
      },
    });

    // Test OpenAI connection
    try {
      await openai.models.list();
      console.log("OpenAI connection successful");
    } catch (error) {
      console.error("OpenAI connection test failed:", error);
      throw new Error(`OpenAI connection failed: ${error.message}`);
    }

    // Create or retrieve thread
    let thread;
    try {
      thread = threadId
        ? await openai.beta.threads.retrieve(threadId)
        : await openai.beta.threads.create();
      console.log("Thread operation successful:", {
        threadId: thread.id,
        isNew: !threadId,
      });
    } catch (error) {
      console.error("Thread operation failed:", error);
      if (error.status === 401) {
        throw new Error("Invalid OpenAI API key");
      } else if (error.status === 404 && threadId) {
        console.log("Thread not found, creating new thread");
        thread = await openai.beta.threads.create();
      } else {
        throw new Error(`Thread operation failed: ${error.message}`);
      }
    }

    // Add message to thread
    try {
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: message,
      });
      console.log("Message added to thread");
    } catch (error) {
      console.error("Failed to add message:", error);
      throw new Error(`Failed to add message: ${error.message}`);
    }

    // Run the Assistant
    let run;
    try {
      run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: ASSISTANT_ID,
      });
      console.log("Assistant run created");
    } catch (error) {
      console.error("Run creation failed:", error);
      if (error.status === 404) {
        throw new Error("Invalid Assistant ID");
      }
      throw new Error(`Run creation failed: ${error.message}`);
    }

    // Wait for completion
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    console.log("Initial run status:", runStatus.status);

    while (runStatus.status !== "completed") {
      if (runStatus.status === "failed" || runStatus.status === "cancelled") {
        console.error("Run failed:", runStatus);
        throw new Error(`Assistant run failed: ${runStatus.status}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      console.log("Updated run status:", runStatus.status);
    }

    // Get assistant's response
    let messages;
    try {
      messages = await openai.beta.threads.messages.list(thread.id);
      console.log("Retrieved messages successfully");
    } catch (error) {
      console.error("Failed to retrieve messages:", error);
      throw new Error(`Failed to retrieve messages: ${error.message}`);
    }

    const lastMessage = messages.data[0];

    return new Response(
      JSON.stringify({
        response: lastMessage.content[0].text.value,
        threadId: thread.id,
        version: FUNCTION_VERSION,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);

    let errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    let statusCode = 500;

    if (errorMessage.includes("API key")) {
      statusCode = 401;
    } else if (errorMessage.includes("Assistant ID")) {
      statusCode = 404;
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined,
        version: FUNCTION_VERSION,
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
