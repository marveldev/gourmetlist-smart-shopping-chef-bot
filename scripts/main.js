$(function () {
	"use strict"

	// Guard
	if (!window.App || !window.App.UI || !window.App.LLM) {
		console.error("Modules not loaded correctly")
		return
	}

	const UI = window.App.UI
	const LLM = window.App.LLM

	// Initialize App
	UI.init()

	// PWA Service Worker Registration
	if ('serviceWorker' in navigator) {
		window.addEventListener('load', () => {
			navigator.serviceWorker.register('/sw.js').then(registration => {
				console.log('ServiceWorker registration successful with scope: ', registration.scope);
			}).catch(err => {
				console.log('ServiceWorker registration failed: ', err);
			});
		});
	}

	// Event Listeners: List
	$("#add-form").on("submit", function (e) {
		e.preventDefault()
		const $input = $("#item-input")
		UI.addItem($input.val())
		$input.val("").focus()
	})

	$(".filter-btn").on("click", function () {
		const filter = $(this).data("filter")
		UI.setFilter(filter)
	})

	$("#clear-completed-btn").on("click", () => UI.clearCompleted())
	$("#clear-all-btn").on("click", () => UI.clearAll())
	$("#smart-sort-btn").on("click", () => UI.smartSort())

	$("#share-header-btn").on("click", () => UI.openShareModal())
	$("#share-close-btn, #share-backdrop, #share-cancel-btn").on("click", () =>
		UI.closeShareModal(),
	)
	$("#share-form").on("submit", function (e) {
		e.preventDefault()
		const email = $("#share-email-input").val()
		UI.shareListWithEmail(email)
	})
	$("#theme-toggle-btn").on("click", () => UI.toggleTheme())
	// Event Listeners: Chat
	$("#chat-toggle-btn, #chat-close-btn, #chat-backdrop, #open-chef-btn").on(
		"click",
		() => UI.toggleChat(),
	)

	// if ($('#open-chef-btn').length) {
	//   (async function initAI() {
	//     try {
	//       $('#open-chef-btn').prop('disabled', true).addClass('opacity-50 cursor-not-allowed').removeClass('hover:bg-orange-600');
	//       $('#ai-status-text').text('Loading Chef Bot... 0%');
	//       await LLM.load(null, (progress) => UI.updateAiProgress(progress));
	//       if (!UI.state.isAiReady) {
	//         UI.updateAiProgress(100);
	//       }
	//     } catch (err) {
	//       console.error('AI Load Error:', err);
	//       $('#ai-status-text').text('Failed to load AI. WebGPU may be missing.');
	//       $('#ai-progress-bar').addClass('bg-red-500');
	//       $('#open-chef-btn').prop('disabled', true).addClass('opacity-50 cursor-not-allowed').removeClass('hover:bg-orange-600');
	//     }
	//   })();
	// }

	// Chat Logic
	$("#chat-form").on("submit", async function (e) {
		e.preventDefault()
		const $input = $("#chat-input")
		const text = $input.val().trim()
		if (!text || !LLM.ready) return

		// 1. Add user message to UI
		UI.appendMessageBubble("user", text)
		$input.val("")

		// 2. Add to history
		UI.state.chatHistory.push({ role: "user", content: text })
		App.Helpers.saveToStorage("chef.chat", UI.state.chatHistory)

		// 3. Prepare Context
		const listItems = UI.state.items.map((i) => i.name).join(", ")
		const systemPrompt = `You are Chef Bot, a friendly and creative culinary expert. 
    The user has a shopping list containing: ${listItems || "nothing yet"}. 
    Suggest recipes or advice based on these ingredients if asked. 
    Keep responses helpful, encouraging, and concise (under 100 words). 
    Format bold text with **asterisks**.`

		// 4. Generate Stream
		let aiResponse = ""
		const $container = $("#chat-messages")

		// Create a placeholder bubble for AI
		const $aiBubble = $(`
      <div class="flex w-full mb-4 justify-start">
        <div class="max-w-[85%] p-3.5 rounded-2xl bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm">
          <div class="prose text-sm leading-relaxed ai-typing">...</div>
        </div>
      </div>
    `)
		$container.append($aiBubble)
		UI.scrollToBottom()
		const $contentDiv = $aiBubble.find(".prose")

		try {
			// Use history for context
			const messages = UI.state.chatHistory.slice(-5) // keep context window small for speed

			await LLM.generate(messages, {
				system: systemPrompt,
				onToken: (token) => {
					if (aiResponse === "") $contentDiv.removeClass("ai-typing").html("")
					aiResponse += token
					// Simple Markdown parse for display during stream
					const displayHtml = aiResponse
						.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
						.replace(/\n/g, "<br>")
					$contentDiv.html(displayHtml)
					UI.scrollToBottom()
				},
			})

			// 5. Save AI response
			UI.state.chatHistory.push({ role: "assistant", content: aiResponse })
			App.Helpers.saveToStorage("chef.chat", UI.state.chatHistory)
		} catch (err) {
			$contentDiv.html(
				'<span class="text-red-500">Oops, I got distracted. Please try again.</span>',
			)
			console.error(err)
		}
	})

	// "Analyze List" Shortcut
	$("#analyze-btn").on("click", function () {
		const items = UI.state.items.map((i) => i.name)
		if (items.length === 0) {
			UI.showToast("Add items to your list first!")
			return
		}
		const prompt =
			"Based on my current shopping list, what can I cook? Give me one creative recipe idea."
		$("#chat-input").val(prompt)
		$("#chat-form").submit()
		if (window.innerWidth < 1024) UI.toggleChat()
	})

	// Clear Chat
	$("#clear-chat-btn").on("click", function () {
		if (confirm("Clear chat history?")) {
			UI.state.chatHistory = []
			App.Helpers.saveToStorage("chef.chat", [])
			UI.renderChatHistory()
		}
	})
})
