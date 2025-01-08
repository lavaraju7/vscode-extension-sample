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

    return "Hii,```Hello``` code ended ```hii```";
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
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
    #container { display: flex; flex-direction: column; height: 100vh; }
    #messages { flex: 1; overflow-y: auto; padding: 10px; }
    #input-container { display: flex; padding: 10px; border-top: 1px solid #ddd; }
    #input { flex: 1; padding: 10px; font-size: 16px; }
    #send { padding: 10px 20px; font-size: 16px; }
    .message { margin-bottom: 10px; }
    .code-block { background-color: #f4f4f4; padding: 10px; border: 1px solid #ddd; font-family: monospace; white-space: pre-wrap; overflow-x: auto; }
    .copy-button { margin-left: 10px; padding: 5px 10px; font-size: 14px; cursor: pointer; }
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
            textNode.textContent = snippet.content;
            div.appendChild(textNode);
          } else if (snippet.type === 'code') {
            const codeBlock = document.createElement('div');
            codeBlock.className = 'code-block';
            codeBlock.textContent = snippet.content;

            const copyButton = document.createElement('button');
            copyButton.className = 'copy-button';
            copyButton.textContent = 'Copy';
            copyButton.addEventListener('click', () => {
              navigator.clipboard.writeText(snippet.content).then(() => {
                alert('Code copied to clipboard!');
              });
            });

            const codeContainer = document.createElement('div');
            codeContainer.appendChild(codeBlock);
            codeContainer.appendChild(copyButton);
            div.appendChild(codeContainer);
          }
        });
      } else {
        div.textContent = \`\${sender}: \${text}\`;
      }

      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }


 function parseCodeSnippet(text) {
      const codeRegex = /\\\`\\\`\\\`(?:\\w*\\n)?([\\s\\S]+?)\\\`\\\`\\\`/g
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
        console.log(codeSnippets)

      return codeSnippets;
    }
  </script>
</body>
</html>
`;
}
