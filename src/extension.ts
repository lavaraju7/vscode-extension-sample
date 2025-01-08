import * as vscode from "vscode";
import axios from "axios";

export function activate(context: vscode.ExtensionContext) {
  // Command to open the ChatGPT Webview
  const chatCommand = vscode.commands.registerCommand(
    "chatgpt.openChat",
    () => {
      const panel = vscode.window.createWebviewPanel(
        "chatgpt",
        "ChatGPT",
        vscode.ViewColumn.One,
        { enableScripts: true }
      );

      panel.webview.html = getWebviewContent();

      panel.webview.onDidReceiveMessage(async (message) => {
        if (message.command === "askChatGPT") {
          const response = await askChatGPT(message.text);
          panel.webview.postMessage({
            command: "showResponse",
            text: response,
          });
        }
      });
    }
  );

  // Register real-time code recommendation provider
  const completionProvider = vscode.languages.registerCompletionItemProvider(
    { scheme: "file", language: "javascript" },
    {
      async provideCompletionItems(document, position) {
        const lineText = document.lineAt(position).text;
        const userText = lineText.slice(0, position.character);

        // Call ChatGPT for recommendations
        const suggestions = await getRecommendations(userText);

        return suggestions.map((suggestion) => {
          const item = new vscode.CompletionItem(
            suggestion.text,
            vscode.CompletionItemKind.Text
          );
          item.detail = "AI Recommendation";
          item.insertText = suggestion.text;
          return item;
        });
      },
    },
    '.'
  );

  context.subscriptions.push(completionProvider);
}

export function deactivate() { }

// Function to call ChatGPT for chat responses
async function askChatGPT(prompt: string): Promise<string> {
  // const apiUrl = "http://localhost:3000/api/superheroes/chatgpt";

  try {
    // const response = await axios.post(apiUrl, prompt);

    return "```The provided code snippet demonstrates the creation and use of a Promise in JavaScript.``` Here's a breakdown of the code: ```javascript const myPromise = new Promise((resolve, reject) => { const success = true; // Simulating success or failure if (success) { resolve(Promise resolved successfully!); } else { reject(Promise rejected.); } });```  ### Explanation: 1. *const myPromise = new Promise((resolve, reject) => {* - This line creates a new Promise and assigns it to the constant variable myPromise. A Promise is an object that represents the eventual completion (or failure) of an asynchronous operation and its resulting value. - The Promise constructor takes a function as an argument, called the executor. This function itself takes two parameters: resolve and reject, which are functions used to settle the promise. 2. *const success = true; // Simulating success or failure* - A constant variable success is declared and initialized with the value true. This variable simulates whether the asynchronous operation is successful or not. 3. *if (success) {* - This line begins a conditional statement to check the value of success. If success is true, the code inside this block will execute. 4. *resolve(Promise resolved successfully!);* - If the condition evaluates to true (meaning the operation was successful), the resolve() function is called with a message. This indicates that the promise has been fulfilled successfully, and the provided message (Promise resolved successfully!) will be the resolved value of the promise. 5. *} else {* - This line indicates the beginning of the alternative action if the promise is not fulfilled. 6. *reject(Promise rejected.);* - If success is false, the reject() function is called with a message. This indicates that the promise has been rejected, and the provided message (Promise rejected.) will be the error reason associated with the rejection. 7. *});* - This closes the executor function and the Promise constructor. ### Summary: In summary, this code snippet creates a promise that simulates an asynchronous operation. Based on the value of success, it either resolves the promise with a success message or rejects it with an error message. The promise can be handled later using .then() for successful resolution or .catch() for handling rejection. This pattern is commonly used in JavaScript for managing asynchronous operations, such as API calls or event handling, in a cleaner and more manageable way.";
  } catch (error: any) {
    return `Error: ${error.message}`;
  }
}

// Function to call ChatGPT for real-time recommendations
async function getRecommendations(prompt: string): Promise<{ text: string }[]> {
  const apiUrl = "http://localhost:3000/api/superheroes/chatgpt";

  try {
    const response = await axios.post(apiUrl, prompt);
    return [{ text: response.data.message }];
    // return response.data.message.map((choice: any) => ({
    // 	text: choice.text.trim(),
    // }));
  } catch (error: any) {
    console.log(error.message);
    return [{ text: 'Checking code' }];
  }
}

// Webview HTML content for ChatGPT
function getWebviewContent(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ChatGPT</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f9f9f9;
      color: #333;
    }
    #container {
      display: flex;
      flex-direction: column;
      height: 100vh;
    }
    #messages {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
      background-color: #ffffff;
      border-bottom: 1px solid #ddd;
    }
    #input-container {
      display: flex;
      padding: 10px;
      border-top: 1px solid #ddd;
      background-color: #f4f4f4;
    }
    #input {
      flex: 1;
      padding: 10px;
      font-size: 16px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    #send {
      padding: 10px 20px;
      margin-left: 10px;
      font-size: 16px;
      background-color: #007BFF;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    #send:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
    .message {
      margin-bottom: 10px;
    }
    .code-block-container {
      position: relative;
      margin-top: 10px;
      background-color: #f4f4f4;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 10px;
      font-family: monospace;
      white-space: pre-wrap;
      overflow-x: auto;
    }
    .code-block {
  background-color: #f4f4f4;
  padding: 10px;
  border: 1px solid #ddd;
  font-family: monospace;
  white-space: pre-wrap;
  overflow-x: auto;
  margin: 5px 0;
}

.copy-button {
  cursor: pointer;
  padding: 5px 10px;
  font-size: 14px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
}

.copy-button:hover {
  background-color: #0056b3;
}

  </style>
</head>
<body>
  <div id="container">
    <div id="messages"></div>
    <div id="input-container">
      <input id="input" type="text" placeholder="Ask ChatGPT..." />
      <button id="send" disabled>Send</button>
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script>
    const vscode = acquireVsCodeApi();
    const input = document.getElementById('input');
    const send = document.getElementById('send');
    const messages = document.getElementById('messages');

    input.addEventListener('input', () => {
      send.disabled = !input.value.trim();
    });

    function sendMessage() {
      const text = input.value.trim();
      if (text) {
        addMessage('You', text);
        vscode.postMessage({ command: 'askChatGPT', text });
        input.value = '';
        send.disabled = true;
      }
    }

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        sendMessage();
      }
    });

    send.addEventListener('click', sendMessage);

    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message.command === 'showResponse') {
        addMessage('ChatGPT', message.text);
      }
    });

    function addMessage(sender, text) {
  const div = document.createElement('div');
  div.className = 'message';

  if (sender === 'ChatGPT' && text.includes('\`\`\`')) {
    const snippets = parseCodeSnippet(text);
    snippets.forEach((snippet) => {
      if (snippet.type === 'text') {
        const textNode = document.createElement('div');
        textNode.innerHTML = marked.parse(snippet.content); // Parse markdown text
        div.appendChild(textNode);
      } else if (snippet.type === 'code') {
        // Create a container for the code block and copy button
        const codeContainer = document.createElement('div');
        codeContainer.style.display = 'flex';
        codeContainer.style.alignItems = 'center';

        // Code block
        const codeBlock = document.createElement('div');
        codeBlock.className = 'code-block';
        codeBlock.textContent = snippet.content;
        codeBlock.style.flex = '1';
        codeContainer.appendChild(codeBlock);

        // Copy button
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.textContent = 'Copy';
        copyButton.style.marginLeft = '10px';
        copyButton.addEventListener('click', () => {
          navigator.clipboard.writeText(snippet.content).then(() => {
            alert('Code copied to clipboard!');
          });
        });

        codeContainer.appendChild(copyButton);
        div.appendChild(codeContainer);
      }
    });
  } else {
    const textNode = document.createElement('div');
    textNode.innerHTML = marked.parse(\`**\${sender}:** \${text}\`); // Markdown for other text
    div.appendChild(textNode);
  }

  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}



    function parseCodeSnippet(text) {
      const codeRegex = /\\\`\\\`\\\`(?:\\w*\\n)?([\\s\\S]+?)\\\`\\\`\\\`/g;
      let match;
      const codeSnippets = [];
      let lastIndex = 0;

      while ((match = codeRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          const beforeCode = text.slice(lastIndex, match.index).trim();
          if (beforeCode) codeSnippets.push({ type: 'text', content: beforeCode });
        }
        const codeContent = match[1].trim();
        codeSnippets.push({ type: 'code', content: codeContent });
        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < text.length) {
        const afterCode = text.slice(lastIndex).trim();
        if (afterCode) codeSnippets.push({ type: 'text', content: afterCode });
      }
        console.log(codeSnippets);
      return codeSnippets;
    }
  </script>
</body>
</html>
`;
}
