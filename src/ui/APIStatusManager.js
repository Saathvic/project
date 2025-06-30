export class APIStatusManager {
  constructor() {
    this.statusDot = document.getElementById('apiStatusDot');
    this.statusText = document.getElementById('apiStatusText');
    this.apiKey = import.meta.env.VITE_GROQ_API_KEY;
    this.isConnected = false;
    this.isChecking = false;
    this.lastCheckTime = 0;
    this.checkInterval = 30000; // Check every 30 seconds
    
    this.initializeStatus();
  }

  async initializeStatus() {
    if (!this.apiKey || this.apiKey === 'undefined') {
      this.updateStatus('red', 'No API Key');
      return;
    }

    this.updateStatus('yellow', 'Checking...');
    await this.checkConnection();
  }

  async checkConnection() {
    if (this.isChecking) return;
    
    this.isChecking = true;
    
    try {
      if (!this.apiKey || this.apiKey === 'undefined') {
        this.updateStatus('red', 'No API Key');
        return;
      }

      const response = await fetch('https://api.groq.com/openai/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (response.ok) {
        this.isConnected = true;
        this.updateStatus('green', 'API Connected');
      } else {
        this.isConnected = false;
        if (response.status === 401) {
          this.updateStatus('red', 'Invalid API Key');
        } else {
          this.updateStatus('red', `Error ${response.status}`);
        }
      }
    } catch (error) {
      this.isConnected = false;
      if (error.name === 'TimeoutError') {
        this.updateStatus('red', 'Connection Timeout');
      } else if (error.name === 'TypeError') {
        this.updateStatus('red', 'Network Error');
      } else {
        this.updateStatus('red', 'Connection Failed');
      }
      console.warn('API connection check failed:', error.message);
    } finally {
      this.isChecking = false;
      this.lastCheckTime = Date.now();
    }
  }

  updateStatus(color, text) {
    // Remove all color classes
    this.statusDot.classList.remove('red', 'yellow', 'green');
    
    // Add the new color class
    this.statusDot.classList.add(color);
    
    // Update text
    this.statusText.textContent = text;
    
    // Add click handler for manual refresh
    this.statusDot.onclick = () => {
      if (!this.isChecking) {
        this.updateStatus('yellow', 'Checking...');
        setTimeout(() => this.checkConnection(), 100);
      }
    };
    
    // Add tooltip
    const indicator = document.getElementById('apiStatusIndicator');
    indicator.title = `Click to refresh • Last checked: ${new Date().toLocaleTimeString()}`;
  }

  update() {
    // Periodic connection check
    const now = Date.now();
    if (now - this.lastCheckTime > this.checkInterval && !this.isChecking) {
      this.checkConnection();
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      hasApiKey: !!(this.apiKey && this.apiKey !== 'undefined'),
      isChecking: this.isChecking,
      lastCheckTime: this.lastCheckTime
    };
  }

  // Manual refresh method
  async refresh() {
    if (!this.isChecking) {
      this.updateStatus('yellow', 'Checking...');
      await this.checkConnection();
    }
  }
}