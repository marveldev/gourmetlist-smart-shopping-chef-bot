window.App = window.App || {};

(function() {
  'use strict';

  const UI = {
    state: {
      items: [],
      chatHistory: [],
      isAiLoading: false,
      isAiReady: false,
      filter: 'all', // all, active, completed
      theme: 'light'
    },

    init: function() {
      // Load state
      this.state.items = App.Helpers.getFromStorage('chef.list', []);
      this.state.theme = App.Helpers.getFromStorage('chef.theme', 'light');
      this.applyTheme(this.state.theme);
      
      this.state.chatHistory = App.Helpers.getFromStorage('chef.chat', []);
      
      this.renderList();
      this.renderChatHistory();
      this.updateStats();
    },

    // --- LIST MANAGEMENT ---
    addItem: function(name) {
      if (!name.trim()) return;
      const newItem = {
        id: App.Helpers.generateId(),
        name: name.trim(),
        completed: false,
        createdAt: Date.now()
      };
      this.state.items.unshift(newItem);
      this.saveList();
      this.renderList();
      this.showToast('Added ' + newItem.name);
    },

    toggleItem: function(id) {
      const item = this.state.items.find(i => i.id === id);
      if (item) {
        item.completed = !item.completed;
        this.saveList();
        this.renderList();
        this.updateStats();
      }
    },

    deleteItem: function(id) {
      this.state.items = this.state.items.filter(i => i.id !== id);
      this.saveList();
      this.renderList();
      this.updateStats();
    },

    clearCompleted: function() {
      this.state.items = this.state.items.filter(i => !i.completed);
      this.saveList();
      this.renderList();
      this.updateStats();
      this.showToast('Cleared completed items');
    },
    clearAll: function() {
      if (!this.state.items.length) return;
      if (!confirm('Clear all items?')) return;
      this.state.items = [];
      this.saveList();
      this.renderList();
      this.updateStats();
      this.showToast('Cleared all items');
    },

    smartSort: function() {
      if (!this.state.items.length) return;
      const sorted = [...this.state.items].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      });
      this.state.items = sorted;
      this.saveList();
      this.renderList();
      this.showToast('List smart sorted');
    },


    openShareModal: function() {
      $('#share-modal').removeClass('hidden');
      $('body').addClass('overflow-hidden');
      setTimeout(() => $('#share-email-input').trigger('focus'), 50);
    },

    closeShareModal: function() {
      $('#share-modal').addClass('hidden');
      $('body').removeClass('overflow-hidden');
      $('#share-email-input').val('');
    },

    shareListWithEmail: function(email) {
      const unpurchased = this.state.items.filter(i => !i.completed);
      if (!unpurchased.length) {
        this.showToast('Add unpurchased items to share');
        return;
      }
      const emailTrimmed = (email || '').trim();
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(emailTrimmed)) {
        this.showToast('Enter a valid email');
        return;
      }
      const listText = unpurchased.map(i => `• ${i.name}`).join('\n');
      const subject = encodeURIComponent('My GourmetList (unpurchased items)');
      const body = encodeURIComponent(`Here are my items to buy:\n\n${listText}\n\nShared from GourmetList`);
      const mailtoUrl = `mailto:${encodeURIComponent(emailTrimmed)}?subject=${subject}&body=${body}`;
      window.location.href = mailtoUrl;
      this.showToast('Opening your email app...');
      this.closeShareModal();
    },
    shareList: async function() {
      if (!this.state.items.length) {
        this.showToast('Add items to share');
        return;
      }
      const listText = this.state.items.map(i => `${i.completed ? '☑' : '☐'} ${i.name}`).join('\n');
      const title = 'My GourmetList';
      const sharePayload = { title, text: `${title}\n${listText}` };
      try {
        if (navigator.share) {
          await navigator.share(sharePayload);
          this.showToast('List shared');
        } else if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(sharePayload.text);
          this.showToast('List copied to clipboard');
        } else {
          this.showToast('Sharing not supported on this device');
        }
      } catch (err) {
        console.error('Share failed', err);
        this.showToast('Unable to share right now');
      }
    },
    saveList: function() {
      App.Helpers.saveToStorage('chef.list', this.state.items);
    },

    setFilter: function(filter) {
      this.state.filter = filter;
      $('.filter-btn').removeClass('bg-orange-500 text-white').addClass('text-gray-600 hover:bg-gray-100');
      $(`.filter-btn[data-filter="${filter}"]`).removeClass('text-gray-600 hover:bg-gray-100').addClass('bg-orange-500 text-white');
      this.renderList();
    },

    renderList: function() {
      const $list = $('#shopping-list');
      $list.empty();
      const filteredItems = this.state.items.filter(item => {
        if (this.state.filter === 'active') return !item.completed;
        if (this.state.filter === 'completed') return item.completed;
        if (this.state.filter === 'shared') return false;
        return true;
      });

      if (this.state.filter === 'shared') {
        $list.html(`
          <div class="flex flex-col items-center justify-center py-12 text-center">
            <div class="bg-sage-100 p-4 rounded-full mb-4">
              <svg class="w-8 h-8 text-sage-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h6m-6 4h10M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z"/></svg>
            </div>
            <p class="text-gray-500 font-medium">Shared lists are coming soon.</p>
            <p class="text-sm text-gray-400 mt-1">Invite others and collaborate in a future update.</p>
          </div>
        `);
        return;
      }

      if (filteredItems.length === 0) {
        $list.html(`
          <div class="flex flex-col items-center justify-center py-12 text-center">
            <div class="bg-sage-100 p-4 rounded-full mb-4">
              <svg class="w-8 h-8 text-sage-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            </div>
            <p class="text-gray-500 font-medium">Your list is empty.</p>
            <p class="text-sm text-gray-400 mt-1">Add items or ask Chef Bot for ideas!</p>
          </div>
        `);
        return;
      }
      filteredItems.forEach(item => {
        const $el = $(`
          <div class="group flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 mb-2 ${item.completed ? 'opacity-60 bg-gray-50' : ''}">
            <button class="flex-shrink-0 w-6 h-6 rounded-full border-2 ${item.completed ? 'bg-orange-500 border-orange-500' : 'border-gray-300 hover:border-orange-500'} flex items-center justify-center transition-colors" onclick="window.App.UI.toggleItem('${item.id}')">
              ${item.completed ? '<svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>' : ''}
            </button>
            <span class="flex-grow font-medium text-gray-700 ${item.completed ? 'line-through text-gray-400' : ''}">${item.name}</span>
            <button class="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" onclick="window.App.UI.deleteItem('${item.id}')" aria-label="Delete">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        `);
        $list.append($el);
      });
    },

    updateStats: function() {
      const total = this.state.items.length;
      const completed = this.state.items.filter(i => i.completed).length;
      const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
      
      $('#progress-bar').css('width', `${progress}%`);
      $('#stats-text').text(`${completed}/${total} done`);
    },

    // --- CHAT MANAGEMENT ---
    renderChatHistory: function() {
      const $container = $('#chat-messages');
      if (!$container.length) return;
      $container.empty();
      
      if (this.state.chatHistory.length === 0) {
        $container.html(`
          <div class="text-center py-8 opacity-60">
            <div class="inline-block p-3 bg-orange-100 rounded-full mb-3">
              <svg class="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
            </div>
            <p class="text-sm text-gray-600">I'm Chef Bot! Ask me for recipes based on your list.</p>
          </div>
        `);
      } else {
        this.state.chatHistory.forEach(msg => {
          this.appendMessageBubble(msg.role, msg.content);
        });
      }
      this.scrollToBottom();
    },

    appendMessageBubble: function(role, text) {
      const $container = $('#chat-messages');
      // Simple markdown-like formatting (bold only for now to keep it safe)
      const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
      
      const isUser = role === 'user';
      const bubble = $(`
        <div class="flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}">
          <div class="max-w-[85%] p-3.5 rounded-2xl ${isUser ? 'bg-gray-800 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'}">
            <div class="prose text-sm leading-relaxed ${isUser ? 'text-white' : 'text-gray-700'}">${formattedText}</div>
          </div>
        </div>
      `);
      $container.append(bubble);
      this.scrollToBottom();
    },
    scrollToBottom: function() {
      const $el = $('#chat-container');
      if (!$el.length || !$el[0]) return;
      $el.scrollTop($el[0].scrollHeight);
    },

    toggleChat: function() {
      const $modal = $('#chef-modal');
      const isHidden = $modal.hasClass('hidden');
      if (isHidden) {
        $modal.removeClass('hidden');
        $('body').addClass('overflow-hidden');
      } else {
        $modal.addClass('hidden');
        $('body').removeClass('overflow-hidden');
      }
    },

    showToast: function(message) {
      const $toast = $(`
        <div class="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium z-50 animate-slide-up">
          ${message}
        </div>
      `);
      $('body').append($toast);
      setTimeout(() => {
        $toast.fadeOut(300, function() { $(this).remove(); });
      }, 2000);
    },

    applyTheme: function(theme) {
      const newTheme = theme === 'dark' ? 'dark' : 'light';
      this.state.theme = newTheme;
      $('body').toggleClass('dark-theme', newTheme === 'dark');
      App.Helpers.saveToStorage('chef.theme', newTheme);
      const $btn = $('#theme-toggle-btn');
      if ($btn.length) {
        if (newTheme === 'dark') {
          $btn.attr('title', 'Switch to light theme').attr('aria-label', 'Switch to light theme');
          $btn.html('<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364 6.364l-1.414-1.414M7.05 7.05 5.636 5.636m12.728 0-1.414 1.414M7.05 16.95l-1.414 1.414M12 8a4 4 0 100 8 4 4 0 000-8z"/></svg>');
        } else {
          $btn.attr('title', 'Switch to dark theme').attr('aria-label', 'Switch to dark theme');
          $btn.html('<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12.41A8 8 0 0111.59 4 7 7 0 1012 20a8 8 0 008-7.59z"/></svg>');
        }
      }
    },

    toggleTheme: function() {
      const nextTheme = this.state.theme === 'dark' ? 'light' : 'dark';
      this.applyTheme(nextTheme);
    },

    updateAiProgress: function(percent) {
      $('#ai-progress-bar').css('width', `${percent}%`);
      $('#ai-status-text').text(`Loading Chef Bot... ${percent}%`);
      if (percent >= 100) {
        this.state.isAiReady = true;
        $('#ai-status-text').text('Chef Bot ready');
        $('#open-chef-btn').prop('disabled', false).removeClass('opacity-50 cursor-not-allowed').addClass('hover:bg-orange-600');
        $('#chat-input').prop('disabled', false).attr('placeholder', 'Ask about recipes...');
        $('#send-btn').prop('disabled', false);
      }
    }
  };

  window.App.UI = UI;
})();