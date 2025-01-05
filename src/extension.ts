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
	const apiUrl = "http://localhost:3000/api/superheroes/chatgpt";

	try {
		const response = await axios.post(apiUrl, prompt);

		return response.data.message;
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
	return `
    <!DOCTYPE html>
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
    #send:disabled { background-color: #ccc; cursor: not-allowed; }
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

    // Enable/disable the Send button based on input
    input.addEventListener('input', () => {
      send.disabled = !input.value.trim();
    });

	// Listen for Enter key
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        sendMessage();
      }
    });

    send.addEventListener('click', () => {
      const text = input.value.trim();
      if (text) {
        addMessage('You', text);
        vscode.postMessage({ command: 'askChatGPT', text });
        input.value = '';
        send.disabled = true; // Disable button after clearing input
      }
    });

    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message.command === 'showResponse') {
        addMessage('ChatGPT', message.text);
      }
    });

    function addMessage(sender, text) {
      const div = document.createElement('div');
      div.textContent = \`\${sender}: \${text}\`;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }
  </script>
</body>
</html>
`;
}
