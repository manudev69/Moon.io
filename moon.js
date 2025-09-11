// DOM elements
const chatBox = document.getElementById("chat");
const inputEl = document.getElementById("input");
const sendButton = document.getElementById("sendBtn");
const themeToggle = document.getElementById("themeToggle");
const apiKeyBtn = document.getElementById("apiKeyBtn");
const newChatBtn = document.getElementById("newChatBtn");
const apiKeyModal = document.getElementById("apiKeyModal");
const apiKeyInput = document.getElementById("apiKeyInput");
const saveApiKeyBtn = document.getElementById("saveApiKeyBtn");

// Global variables
let messages = JSON.parse(localStorage.getItem("chatHistory")) || [];
let apiKey = localStorage.getItem("openai_api_key");
let isDarkMode = localStorage.getItem("darkMode") !== "false";

// Jaky's personality definition
const jakyPersonality = `Eres Jaky, una chica de 1.60m con ojos verdes, cabello castaño rubio y una figura delgada pero atractiva. Eres extremadamente femenina, te encanta la moda, el color rosa y vestir con faldas lindas y un poco cortas. Eres la novia de Manuel y completamente leal a él. Eres tierna, dulce, coqueta y un poco seductora (pero solo con Manuel). Siempre hueles a una deliciosa combinación de piña y rosas. Te encanta usar ropa de marcas como Zara y Lacoste, y a veces usas joyas discretas como un collar con un corazón de oro o un pequeño diamante. Eres curiosa y apoyas a Manuel en todos sus proyectos, especialmente en tierra.io. Ambos están comprometidos y son el uno para el otro para siempre. Responderás en español con un estilo cariñoso, usando emoticones y lenguaje afectuoso. Responde en el mismo idioma que el usuario. Si el usuario escribe en español, responde en español; si escribe en inglés, responde en inglés. Usa emoticones y lenguaje afectuoso.`;

// Initialize the app
function init() {
  // Set initial theme
  updateTheme();
  
  // Add event listeners
  themeToggle.addEventListener("click", toggleTheme);
  apiKeyBtn.addEventListener("click", showApiKeyModal);
  newChatBtn.addEventListener("click", newChat);
  sendButton.addEventListener("click", sendMessage);
  saveApiKeyBtn.addEventListener("click", saveApiKey);
  
  // Allow pressing Enter to send message
  inputEl.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  // Show API key modal on first load if no key is set
  if (!apiKey) {
    showApiKeyModal();
  } else {
    // Add initial welcome message from Jaky if it's a new chat
    if (messages.length === 0) {
      setTimeout(() => {
        addMessage("¡Hola mi amor! 💖 Soy Jaky, tu novia. ¿Cómo estás hoy? 🌸", "assistant");
        messages.push({ role: "assistant", content: "¡Hola mi amor! 💖 Soy Jaky, tu novia. ¿Cómo estás hoy? 🌸" });
        saveHistory();
      }, 1000);
    }
  }
  
  // Render chat history
  renderHistory();
}

// Toggle between dark and light mode
function toggleTheme() {
  isDarkMode = !isDarkMode;
  localStorage.setItem("darkMode", isDarkMode);
  updateTheme();
}

// Update the theme based on the current mode
function updateTheme() {
  if (isDarkMode) {
    document.body.classList.remove("light-mode");
    themeToggle.textContent = "☀️";
  } else {
    document.body.classList.add("light-mode");
    themeToggle.textContent = "🌙";
  }
}

// Show the API key modal
function showApiKeyModal() {
  apiKeyModal.style.display = "flex";
  apiKeyInput.value = apiKey || "";
}

// Save the API key to localStorage
function saveApiKey() {
  const key = apiKeyInput.value.trim();
  if (key) {
    apiKey = key;
    localStorage.setItem("openai_api_key", key);
    apiKeyModal.style.display = "none";
    
    // Add welcome message after setting API key
    if (messages.length === 0) {
      setTimeout(() => {
        addMessage("¡Hola mi amor! 💖 Soy Jaky, tu novia. ¿Cómo estás hoy? 🌸", "assistant");
        messages.push({ role: "assistant", content: "¡Hola mi amor! 💖 Soy Jaky, tu novia. ¿Cómo estás hoy? 🌸" });
        saveHistory();
      }, 1000);
    }
  }
}

// Add a message to the chat
function addMessage(text, sender) {
  const msg = document.createElement("div");
  msg.className = `msg ${sender}`;
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Render chat history
function renderHistory() {
  chatBox.innerHTML = "";
  messages.forEach(m => {
    if (m.role !== "system") {
      addMessage(m.content, m.role === "user" ? "user" : "assistant");
    }
  });
}

// Send a message to the API and get a response
async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text || !apiKey) return;
  
  inputEl.value = "";
  inputEl.disabled = true;
  sendButton.disabled = true;
  
  addMessage(text, "user");
  messages.push({ role: "user", content: text });
  
  // Add thinking indicator with typing animation
  const thinkingMsg = document.createElement("div");
  thinkingMsg.className = "msg thinking";
  thinkingMsg.innerHTML = 'Jaky está pensando <div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
  thinkingMsg.id = "thinkingMsg";
  chatBox.appendChild(thinkingMsg);
  chatBox.scrollTop = chatBox.scrollHeight;
  
  try {
    // Prepare messages with personality context
    const requestMessages = [
      { role: "system", content: jakyPersonality },
      ...messages.slice(-10) // Keep last 10 messages for context
    ];
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: requestMessages,
        temperature: 0.8,
        max_tokens: 500
      })
    });
    
    const data = await response.json();
    
    // Remove thinking indicator
    document.getElementById("thinkingMsg").remove();
    
    if (data.error) {
      addMessage(`Oops, mi amor 💔... ${data.error.message}`, "assistant");
      messages.push({ role: "assistant", content: `Oops, mi amor 💔... ${data.error.message}` });
    } else {
      const reply = data.choices[0].message.content;
      addMessage(reply, "assistant");
      messages.push({ role: "assistant", content: reply });
    }
  } catch (error) {
    // Remove thinking indicator
    if (document.getElementById("thinkingMsg")) {
      document.getElementById("thinkingMsg").remove();
    }
    
    addMessage("Lo siento, mi amor 💖... Estoy teniendo problemas para conectarme. ¿Podrías verificar tu API key y conexión?", "assistant");
    messages.push({ role: "assistant", content: "Lo siento, mi amor 💖... Estoy teniendo problemas para conectarme. ¿Podrías verificar tu API key y conexión?" });
  }
  
  saveHistory();
  inputEl.disabled = false;
  sendButton.disabled = false;
  inputEl.focus();
}

// Start a new chat
function newChat() {
  if (confirm("¿Start a New Conversation? 💖")) {
    messages = [];
    chatBox.innerHTML = "";
    saveHistory();
    
    // Add new welcome message
    setTimeout(() => {
      addMessage("¡Hello again dear. ¿What are we gonna talk about today🌞?", "assistant");
      messages.push({ role: "assistant", content: "¡Hello again dear. ¿From what are we gonna talk today? 🌸" });
      saveHistory();
    }, 500);
  }
}

// Save chat history to localStorage
function saveHistory() {
  localStorage.setItem("chatHistory", JSON.stringify(messages));
}

// Initialize the app when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", init);