class BixbyWidget {
  constructor() {
    this.clientId = this.getClientId();
    if (!this.clientId) {
      console.error(
        "BixbyWidget: No client ID provided. Add data-client-id attribute to the script tag."
      );
      return;
    }
    this.config = null;
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    this.supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    this.threadId = null;
    this.initialize();
  }

  getClientId() {
    const scripts = document.getElementsByTagName("script");
    const currentScript = scripts[scripts.length - 1];
    return currentScript?.getAttribute("data-client-id");
  }

  async initialize() {
    try {
      await this.loadClientConfig();
      if (!this.config) {
        console.error("BixbyWidget: Failed to load configuration");
        return;
      }
      this.createStyles();
      this.createWidget();
      this.initializeEventListeners();
      this.loadChatHistory();
    } catch (error) {
      console.error("BixbyWidget: Initialization failed", error);
    }
  }

  async loadClientConfig() {
    // Mock configuration data
    this.config = {
      client: {
        id: this.clientId,
        name: "Demo Company",
      },
      config: {
        theme: {
          position: {
            bottom: "20px",
            right: "20px",
          },
          button: {
            size: "60px",
            backgroundColor: "#1867C0",
            iconColor: "white",
            hoverColor: "#1557A0",
          },
          window: {
            width: "350px",
            height: "500px",
            backgroundColor: "white",
            borderRadius: "12px",
          },
          header: {
            backgroundColor: "#1867C0",
            textColor: "white",
          },
          messages: {
            userBackground: "#1867C0",
            userText: "white",
            botBackground: "#f0f0f0",
            botText: "#333",
          },
          input: {
            borderColor: "#ddd",
          },
        },
        settings: {
          inputPlaceholder: "Type your message...",
          sendButtonText: "Send",
        },
      },
    };
    return this.config;
  }

  createStyles() {
    const theme = this.config?.config?.theme || {};
    const styles = `
      .bixby-widget {
        position: fixed;
        bottom: ${theme.position?.bottom || "20px"};
        right: ${theme.position?.right || "20px"};
        z-index: 9999;
        font-family: ${
          theme.font ||
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif'
        };
      }
      .bixby-widget-button {
        width: ${theme.button?.size || "60px"};
        height: ${theme.button?.size || "60px"};
        border-radius: 50%;
        background: ${theme.button?.backgroundColor || "#1867C0"};
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s;
      }
      .bixby-widget-button:hover {
        transform: scale(1.05);
      }
      .bixby-widget-icon {
        width: 24px;
        height: 24px;
        fill: ${theme.button?.iconColor || "white"};
      }
      .bixby-chat-window {
        position: fixed;
        bottom: 100px;
        right: 20px;
        width: ${theme.window?.width || "350px"};
        height: ${theme.window?.height || "500px"};
        background: ${theme.window?.backgroundColor || "white"};
        border-radius: ${theme.window?.borderRadius || "12px"};
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
        display: none;
        flex-direction: column;
        overflow: hidden;
      }
      .bixby-chat-header {
        padding: 16px;
        background: ${theme.header?.backgroundColor || "#1867C0"};
        color: ${theme.header?.textColor || "white"};
        font-weight: 500;
      }
      .bixby-chat-messages {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
      }
      .bixby-chat-input {
        padding: 16px;
        border-top: 1px solid ${theme.input?.borderColor || "#eee"};
        display: flex;
      }
      .bixby-chat-input input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid ${theme.input?.borderColor || "#ddd"};
        border-radius: 4px;
        margin-right: 8px;
        font-size: 14px;
      }
      .bixby-chat-input button {
        padding: 8px 16px;
        background: ${theme.button?.backgroundColor || "#1867C0"};
        color: ${theme.button?.textColor || "white"};
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }
      .bixby-chat-input button:hover {
        background: ${theme.button?.hoverColor || "#1557A0"};
      }
      .bixby-typing-indicator {
        padding: 8px;
        color: #666;
        font-style: italic;
        display: none;
      }
      .bixby-error-message {
        color: #dc2626;
        padding: 8px;
        text-align: center;
        background: #fee2e2;
        border-radius: 4px;
        margin: 8px;
        display: none;
      }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  createWidget() {
    const widget = document.createElement("div");
    widget.className = "bixby-widget";

    const button = document.createElement("div");
    button.className = "bixby-widget-button";
    button.innerHTML = `
      <svg class="bixby-widget-icon" viewBox="0 0 24 24">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
      </svg>
    `;

    const chatWindow = document.createElement("div");
    chatWindow.className = "bixby-chat-window";
    chatWindow.innerHTML = `
      <div class="bixby-chat-header">Chat with ${
        this.config?.client?.name || "Bixby"
      }</div>
      <div class="bixby-chat-messages"></div>
      <div class="bixby-typing-indicator">Assistant is typing...</div>
      <div class="bixby-error-message"></div>
      <div class="bixby-chat-input">
        <input type="text" placeholder="${
          this.config?.config?.settings?.inputPlaceholder ||
          "Type your message..."
        }">
        <button>${
          this.config?.config?.settings?.sendButtonText || "Send"
        }</button>
      </div>
    `;

    widget.appendChild(button);
    widget.appendChild(chatWindow);
    document.body.appendChild(widget);

    this.elements = {
      widget,
      button,
      chatWindow,
      messages: chatWindow.querySelector(".bixby-chat-messages"),
      input: chatWindow.querySelector("input"),
      sendButton: chatWindow.querySelector("button"),
      typingIndicator: chatWindow.querySelector(".bixby-typing-indicator"),
      errorMessage: chatWindow.querySelector(".bixby-error-message"),
    };
  }

  initializeEventListeners() {
    this.elements.button.addEventListener("click", () => {
      const isVisible = this.elements.chatWindow.style.display === "flex";
      this.elements.chatWindow.style.display = isVisible ? "none" : "flex";
    });

    this.elements.sendButton.addEventListener("click", () =>
      this.sendMessage()
    );
    this.elements.input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.sendMessage();
    });
  }

  loadChatHistory() {
    const storageKey = `bixby_chat_history_${this.clientId}`;
    const chatHistory = localStorage.getItem(storageKey);
    if (chatHistory) {
      const messages = JSON.parse(chatHistory);
      messages.forEach((message) => {
        this.addMessage(message.sender, message.text, false);
      });
    }
  }

  saveChatHistory() {
    const storageKey = `bixby_chat_history_${this.clientId}`;
    const messages = Array.from(this.elements.messages.children).map(
      (messageDiv) => {
        const bubble = messageDiv.querySelector("div");
        return {
          sender: messageDiv.style.textAlign === "right" ? "user" : "bot",
          text: bubble.textContent,
          timestamp: new Date().toISOString(),
        };
      }
    );
    localStorage.setItem(storageKey, JSON.stringify(messages));
  }

  async sendMessage() {
    const message = this.elements.input.value.trim();
    if (!message) return;

    this.addMessage("user", message);
    this.elements.input.value = "";
    this.elements.typingIndicator.style.display = "block";
    this.elements.input.disabled = true;
    this.elements.sendButton.disabled = true;
    this.elements.errorMessage.style.display = "none";

    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.supabaseAnonKey}`,
        },
        body: JSON.stringify({
          message,
          threadId: this.threadId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.threadId = data.threadId;
      this.addMessage("bot", data.response);
    } catch (error) {
      console.error("Error sending message:", error);
      this.elements.errorMessage.textContent =
        "Failed to send message. Please try again.";
      this.elements.errorMessage.style.display = "block";
    } finally {
      this.elements.typingIndicator.style.display = "none";
      this.elements.input.disabled = false;
      this.elements.sendButton.disabled = false;
      this.elements.input.focus();
    }
  }

  addMessage(sender, text, shouldSave = true) {
    const messageDiv = document.createElement("div");
    messageDiv.style.marginBottom = "12px";
    messageDiv.style.textAlign = sender === "user" ? "right" : "left";

    const bubble = document.createElement("div");
    bubble.style.display = "inline-block";
    bubble.style.padding = "8px 12px";
    bubble.style.borderRadius = "12px";
    bubble.style.maxWidth = "80%";
    bubble.style.wordBreak = "break-word";

    const theme = this.config?.config?.theme || {};
    if (sender === "user") {
      bubble.style.background = theme.messages?.userBackground || "#1867C0";
      bubble.style.color = theme.messages?.userText || "white";
    } else {
      bubble.style.background = theme.messages?.botBackground || "#f0f0f0";
      bubble.style.color = theme.messages?.botText || "#333";
    }

    bubble.textContent = text;
    messageDiv.appendChild(bubble);
    this.elements.messages.appendChild(messageDiv);
    this.elements.messages.scrollTop = this.elements.messages.scrollHeight;

    if (shouldSave) {
      this.saveChatHistory();
    }
  }
}

// Auto-initialize the widget when the script loads
new BixbyWidget();
