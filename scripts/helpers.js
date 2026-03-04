window.App = window.App || {};

(function() {
  'use strict';

  const Helpers = {
    generateId: function() {
      return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    },

    saveToStorage: function(key, data) {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (e) {
        console.error('Storage save failed:', e);
      }
    },

    getFromStorage: function(key, defaultValue) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (e) {
        console.error('Storage load failed:', e);
        return defaultValue;
      }
    },

    formatDate: function(date) {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      }).format(new Date(date));
    },

    // Simple debounce to prevent rapid firing
    debounce: function(func, wait) {
      let timeout;
      return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
      };
    }
  };

  window.App.Helpers = Helpers;
})();
