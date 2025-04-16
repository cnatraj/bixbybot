import { OpenAI } from "npm:openai@4.28.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ASSISTANT_ID = Deno.env.get("OPENAI_ASSISTANT_ID");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const FUNCTION_VERSION = "1.0.1"; // Added version number

interface ChatRequest {
  message: string;
  threadId?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate OpenAI credentials
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY environment variable is not set");
      throw new Error("OpenAI API key not configured");
    }

    if (!ASSISTANT_ID) {
      console.error("OPENAI_ASSISTANT_ID environment variable is not set");
      throw new Error("OpenAI Assistant ID not configured");
    }

    const { message, threadId }: ChatRequest = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });

    // Validate OpenAI connection
    try {
      await openai.models.list();
    } catch (error) {
      console.error("Failed to connect to OpenAI:", error);
      throw new Error("Invalid OpenAI API key or connection error");
    }

    // Create a new thread if threadId is not provided
    let thread;
    try {
      thread = threadId
        ? await openai.beta.threads.retrieve(threadId)
        : await openai.beta.threads.create();
    } catch (error) {
      console.error("Error creating/retrieving thread:", error);
      if (error.status === 401) {
        throw new Error("Invalid OpenAI API key");
      } else if (error.status === 404 && threadId) {
        // If thread not found, create a new one
        thread = await openai.beta.threads.create();
      } else {
        throw new Error("Failed to initialize chat thread");
      }
    }

    // Add the user's message to the thread
    try {
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: message,
      });
    } catch (error) {
      console.error("Error adding message to thread:", error);
      throw new Error("Failed to add message to thread");
    }

    // Run the Assistant
    let run;
    try {
      run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: ASSISTANT_ID,
      });
    } catch (error) {
      console.error("Error creating run:", error);
      if (error.status === 404) {
        throw new Error("Invalid Assistant ID");
      }
      throw new Error("Failed to process message with assistant");
    }

    // Wait for the completion
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);

    while (runStatus.status !== "completed") {
      if (runStatus.status === "failed" || runStatus.status === "cancelled") {
        console.error("Run failed with status:", runStatus.status);
        throw new Error(`Assistant run failed: ${runStatus.status}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    // Get the latest message from the thread
    let messages;
    try {
      messages = await openai.beta.threads.messages.list(thread.id);
    } catch (error) {
      console.error("Error retrieving messages:", error);
      throw new Error("Failed to retrieve assistant response");
    }

    const lastMessage = messages.data[0];

    return new Response(
      JSON.stringify({
        response: lastMessage.content[0].text.value,
        threadId: thread.id,
        version: FUNCTION_VERSION, // Added version to response
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);

    // Provide more specific error messages based on the type of error
    let errorMessage =
      error instanceof Error ? error.message : "Failed to process message";
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
        version: FUNCTION_VERSION, // Added version to error response
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
