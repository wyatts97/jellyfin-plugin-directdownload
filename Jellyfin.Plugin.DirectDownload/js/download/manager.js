// Download Manager module for Direct Download plugin
// Handles download operations and tracking

(function(DirectDownload) {
    'use strict';
    
    DirectDownload.components.DownloadManager = {
        // Download history
        downloadHistory: [],
        
        // Active downloads
        activeDownloads: new Map(),
        
        // Initialize download manager
        init: function() {
            this.loadDownloadHistory();
            this.setupDownloadHandlers();
        },
        
        // Load download history from localStorage
        loadDownloadHistory: function() {
            try {
                const saved = localStorage.getItem('direct-download-history');
                if (saved) {
                    this.downloadHistory = JSON.parse(saved);
                }
            } catch (error) {
                console.error('[DirectDownload] Failed to load download history:', error);
                this.downloadHistory = [];
            }
        },
        
        // Save download history to localStorage
        saveDownloadHistory: function() {
            try {
                localStorage.setItem('direct-download-history', JSON.stringify(this.downloadHistory));
            } catch (error) {
                console.error('[DirectDownload] Failed to save download history:', error);
            }
        },
        
        // Setup download handlers
        setupDownloadHandlers: function() {
            // Handle magnet links
            document.addEventListener('click', (e) => {
                const downloadBtn = e.target.closest('.download-btn');
                if (downloadBtn && downloadBtn.dataset.url) {
                    e.preventDefault();
                    const url = downloadBtn.dataset.url;
                    const title = downloadBtn.dataset.title || 'Unknown';
                    this.handleDownload(url, title);
                }
            });
        },
        
        // Handle download
        handleDownload: function(url, title = 'Unknown') {
            // Add to history
            this.addToHistory(url, title);
            
            // Handle different URL types
            if (url.startsWith('magnet:')) {
                this.handleMagnetLink(url, title);
            } else if (url.startsWith('http://') || url.startsWith('https://')) {
                this.handleDirectLink(url, title);
            } else {
                this.showNotification('Unsupported download URL', 'error');
            }
        },
        
        // Handle magnet link
        handleMagnetLink: function(magnetLink, title) {
            try {
                // Add to active downloads
                const downloadId = this.generateDownloadId();
                this.activeDownloads.set(downloadId, {
                    url: magnetLink,
                    title: title,
                    type: 'magnet',
                    startTime: Date.now(),
                    status: 'starting'
                });
                
                // Show notification
                this.showNotification(`Starting download: ${title}`, 'info');
                
                // Try to open magnet link
                const magnetUri = encodeURI(magnetLink);
                window.location.href = magnetUri;
                
                // Update status
                const download = this.activeDownloads.get(downloadId);
                if (download) {
                    download.status = 'started';
                    download.status = 'external_client';
                }
                
                // Show download started notification
                setTimeout(() => {
                    this.showNotification(
                        `Download started for "${title}". Check your torrent client.`, 
                        'success'
                    );
                }, 1000);
                
            } catch (error) {
                console.error('[DirectDownload] Magnet link error:', error);
                this.showNotification('Failed to open magnet link', 'error');
            }
        },
        
        // Handle direct download link
        handleDirectLink: function(url, title) {
            try {
                // Add to active downloads
                const downloadId = this.generateDownloadId();
                this.activeDownloads.set(downloadId, {
                    url: url,
                    title: title,
                    type: 'direct',
                    startTime: Date.now(),
                    status: 'starting'
                });
                
                // Show notification
                this.showNotification(`Starting download: ${title}`, 'info');
                
                // Open in new tab for direct download
                const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
                
                if (newWindow) {
                    // Update status
                    const download = this.activeDownloads.get(downloadId);
                    if (download) {
                        download.status = 'started';
                        download.status = 'browser_download';
                    }
                    
                    this.showNotification(`Download started for "${title}"`, 'success');
                } else {
                    // Fallback: copy to clipboard
                    this.copyToClipboard(url);
                    this.showNotification(
                        `Download link copied to clipboard: ${title}`, 
                        'info'
                    );
                }
                
            } catch (error) {
                console.error('[DirectDownload] Direct download error:', error);
                this.showNotification('Failed to start download', 'error');
            }
        },
        
        // Add to download history
        addToHistory: function(url, title) {
            const historyItem = {
                url: url,
                title: title,
                timestamp: Date.now(),
                type: url.startsWith('magnet:') ? 'magnet' : 'direct'
            };
            
            // Add to beginning of array
            this.downloadHistory.unshift(historyItem);
            
            // Limit history size
            if (this.downloadHistory.length > 100) {
                this.downloadHistory = this.downloadHistory.slice(0, 100);
            }
            
            this.saveDownloadHistory();
        },
        
        // Get download history
        getDownloadHistory: function(limit = 20) {
            return this.downloadHistory.slice(0, limit);
        },
        
        // Clear download history
        clearDownloadHistory: function() {
            this.downloadHistory = [];
            this.saveDownloadHistory();
            this.showNotification('Download history cleared', 'info');
        },
        
        // Get active downloads
        getActiveDownloads: function() {
            return Array.from(this.activeDownloads.values());
        },
        
        // Generate unique download ID
        generateDownloadId: function() {
            return 'download_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        },
        
        // Copy to clipboard
        copyToClipboard: async function(text) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (error) {
                console.error('[DirectDownload] Failed to copy to clipboard:', error);
                return false;
            }
        },
        
        // Show notification
        showNotification: function(message, type = 'info') {
            // Create notification element
            const notification = document.createElement('div');
            notification.className = `direct-download-notification ${type}`;
            notification.innerHTML = `
                <div class="notification-content">
                    <span class="notification-message">${message}</span>
                    <button class="notification-close">&times;</button>
                </div>
            `;
            
            // Add to page
            document.body.appendChild(notification);
            
            // Setup close handler
            notification.querySelector('.notification-close').addEventListener('click', () => {
                this.removeNotification(notification);
            });
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                this.removeNotification(notification);
            }, 5000);
            
            // Add styles if not already added
            this.addNotificationStyles();
        },
        
        // Remove notification
        removeNotification: function(notification) {
            if (notification && notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        },
        
        // Add notification styles
        addNotificationStyles: function() {
            if (document.querySelector('#direct-download-notification-styles')) {
                return;
            }
            
            const style = document.createElement('style');
            style.id = 'direct-download-notification-styles';
            style.textContent = `
                .direct-download-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10001;
                    min-width: 300px;
                    max-width: 500px;
                    padding: 15px;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                    animation: slideIn 0.3s ease-out;
                }
                
                .direct-download-notification.info {
                    background: linear-gradient(135deg, #00a4dc, #0078a8);
                    color: white;
                }
                
                .direct-download-notification.success {
                    background: linear-gradient(135deg, #4caf50, #388e3c);
                    color: white;
                }
                
                .direct-download-notification.error {
                    background: linear-gradient(135deg, #f44336, #d32f2f);
                    color: white;
                }
                
                .direct-download-notification.warning {
                    background: linear-gradient(135deg, #ff9800, #f57c00);
                    color: white;
                }
                
                .notification-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .notification-message {
                    flex: 1;
                    margin-right: 10px;
                }
                
                .notification-close {
                    background: none;
                    border: none;
                    color: inherit;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 0;
                    opacity: 0.8;
                }
                
                .notification-close:hover {
                    opacity: 1;
                }
                
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            
            document.head.appendChild(style);
        },
        
        // Show download history modal
        showHistoryModal: function() {
            const history = this.getDownloadHistory();
            
            if (history.length === 0) {
                DirectDownload.components.Modal.create('Download History', `
                    <div class="empty-history">
                        <div class="empty-icon">📥</div>
                        <h3>No Download History</h3>
                        <p>Your download history will appear here</p>
                    </div>
                `);
                return;
            }
            
            const historyHTML = history.map(item => `
                <div class="history-item">
                    <div class="history-info">
                        <h4>${this.escapeHtml(item.title)}</h4>
                        <p class="history-meta">
                            <span class="history-type">${item.type === 'magnet' ? '🧲 Magnet' : '🔗 Direct'}</span>
                            <span class="history-date">${new Date(item.timestamp).toLocaleString()}</span>
                        </p>
                    </div>
                    <div class="history-actions">
                        <button class="copy-url-btn secondary-btn" data-url="${this.escapeHtml(item.url)}">
                            <span class="material-icons content_copy">content_copy</span>
                        </button>
                        <button class="retry-download-btn primary-btn" data-url="${this.escapeHtml(item.url)}" data-title="${this.escapeHtml(item.title)}">
                            <span class="material-icons download">download</span>
                        </button>
                    </div>
                </div>
            `).join('');
            
            const modal = DirectDownload.components.Modal.create('Download History', `
                <div class="history-content">
                    <div class="history-header">
                        <button class="clear-history-btn secondary-btn">Clear History</button>
                    </div>
                    <div class="history-list">
                        ${historyHTML}
                    </div>
                </div>
            `);
            
            // Setup history actions
            modal.querySelector('.clear-history-btn').addEventListener('click', () => {
                if (confirm('Are you sure you want to clear your download history?')) {
                    this.clearDownloadHistory();
                    DirectDownload.components.Modal.close(modal);
                }
            });
            
            modal.querySelectorAll('.copy-url-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const url = e.target.closest('.copy-url-btn').dataset.url;
                    this.copyToClipboard(url).then(success => {
                        if (success) {
                            this.showNotification('URL copied to clipboard', 'success');
                        }
                    });
                });
            });
            
            modal.querySelectorAll('.retry-download-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const url = e.target.closest('.retry-download-btn').dataset.url;
                    const title = e.target.closest('.retry-download-btn').dataset.title;
                    this.handleDownload(url, title);
                    DirectDownload.components.Modal.close(modal);
                });
            });
        },
        
        // Escape HTML
        escapeHtml: function(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };
    
})(window.DirectDownload || (window.DirectDownload = {}));
