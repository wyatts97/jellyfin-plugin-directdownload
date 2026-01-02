// Server-side download manager for Direct Download plugin
// Handles downloads through Jellyfin server with library path selection

(function(DirectDownload) {
    'use strict';
    
    DirectDownload.components.ServerDownloadManager = {
        // Active downloads tracking
        activeDownloads: new Map(),
        
        // Available library paths
        libraryPaths: [],
        
        // Polling interval for download status
        statusPollInterval: null,
        
        // Initialize server download manager
        init: async function() {
            await this.loadLibraryPaths();
            this.startStatusPolling();
        },
        
        // Load available library paths from server
        loadLibraryPaths: async function() {
            try {
                const response = await fetch('/DirectDownload/Download/library-paths');
                if (response.ok) {
                    this.libraryPaths = await response.json();
                    console.log('[DirectDownload] Loaded library paths:', this.libraryPaths);
                } else {
                    console.error('[DirectDownload] Failed to load library paths');
                    // Provide defaults if server fails
                    this.libraryPaths = [
                        { Name: 'Movies', Type: 'Movies', Path: '/media/movies', IsDefault: true },
                        { Name: 'TV Shows', Type: 'TV Shows', Path: '/media/tvshows', IsDefault: false }
                    ];
                }
            } catch (error) {
                console.error('[DirectDownload] Error loading library paths:', error);
            }
        },
        
        // Show library path selection modal
        showLibraryPathSelector: function(downloadUrl, fileName, mediaType, quality) {
            const modal = DirectDownload.components.Modal.create('Select Download Location', `
                <div class="library-path-selector">
                    <p class="download-info">
                        <strong>File:</strong> ${DirectDownload.utils.escapeHtml(fileName)}<br>
                        <strong>Quality:</strong> ${quality || 'Unknown'}<br>
                        <strong>Type:</strong> ${mediaType || 'Unknown'}
                    </p>
                    
                    <div class="library-paths-list">
                        ${this.libraryPaths.map(path => `
                            <div class="library-path-option" data-path='${JSON.stringify(path).replace(/'/g, '&apos;')}'>
                                <div class="path-header">
                                    <span class="path-icon">${this.getLibraryIcon(path.Type)}</span>
                                    <span class="path-name">${path.Name}</span>
                                    ${path.IsDefault ? '<span class="default-badge">Default</span>' : ''}
                                </div>
                                <div class="path-location">${path.Path}</div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="custom-path-section">
                        <button class="secondary-btn" id="add-custom-path-btn">
                            <span class="material-icons add">add</span> Add Custom Path
                        </button>
                    </div>
                </div>
            `, {
                size: 'medium',
                footer: `
                    <button class="secondary-btn cancel-download-btn">Cancel</button>
                `
            });
            
            // Setup path selection
            modal.querySelectorAll('.library-path-option').forEach(option => {
                option.addEventListener('click', async () => {
                    const pathData = JSON.parse(option.dataset.path);
                    DirectDownload.components.Modal.close(modal);
                    await this.startServerDownload(downloadUrl, fileName, pathData, mediaType, quality);
                });
            });
            
            // Setup custom path button
            modal.querySelector('#add-custom-path-btn')?.addEventListener('click', () => {
                this.showAddCustomPathModal();
            });
            
            // Setup cancel button
            modal.querySelector('.cancel-download-btn')?.addEventListener('click', () => {
                DirectDownload.components.Modal.close(modal);
            });
        },
        
        // Show add custom path modal
        showAddCustomPathModal: function() {
            const modal = DirectDownload.components.Modal.create('Add Custom Library Path', `
                <div class="add-custom-path-form">
                    <div class="form-group">
                        <label for="path-name">Library Name</label>
                        <input type="text" id="path-name" placeholder="e.g., Movies 4K" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="path-type">Library Type</label>
                        <select id="path-type">
                            <option value="Movies">Movies</option>
                            <option value="TV Shows">TV Shows</option>
                            <option value="Music">Music</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="path-location">File System Path</label>
                        <input type="text" id="path-location" placeholder="/media/movies" required>
                        <small>Enter the full path where files should be downloaded</small>
                    </div>
                    
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="path-default">
                            Set as default for this type
                        </label>
                    </div>
                </div>
            `, {
                size: 'medium',
                footer: `
                    <button class="secondary-btn cancel-btn">Cancel</button>
                    <button class="primary-btn save-path-btn">Save Path</button>
                `
            });
            
            // Setup save button
            modal.querySelector('.save-path-btn')?.addEventListener('click', async () => {
                const name = modal.querySelector('#path-name').value.trim();
                const type = modal.querySelector('#path-type').value;
                const location = modal.querySelector('#path-location').value.trim();
                const isDefault = modal.querySelector('#path-default').checked;
                
                if (!name || !location) {
                    alert('Please fill in all required fields');
                    return;
                }
                
                const newPath = {
                    Name: name,
                    Type: type,
                    Path: location,
                    IsDefault: isDefault
                };
                
                await this.saveLibraryPath(newPath);
                DirectDownload.components.Modal.close(modal);
            });
            
            // Setup cancel button
            modal.querySelector('.cancel-btn')?.addEventListener('click', () => {
                DirectDownload.components.Modal.close(modal);
            });
        },
        
        // Save library path to server
        saveLibraryPath: async function(libraryPath) {
            try {
                const response = await fetch('/DirectDownload/Download/library-paths', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(libraryPath)
                });
                
                if (response.ok) {
                    await this.loadLibraryPaths();
                    DirectDownload.components.DownloadManager.showNotification('Library path saved successfully', 'success');
                } else {
                    throw new Error('Failed to save library path');
                }
            } catch (error) {
                console.error('[DirectDownload] Error saving library path:', error);
                DirectDownload.components.DownloadManager.showNotification('Failed to save library path', 'error');
            }
        },
        
        // Start server-side download
        startServerDownload: async function(url, fileName, libraryPath, mediaType, quality) {
            try {
                const response = await fetch('/DirectDownload/Download/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        Url: url,
                        FileName: fileName,
                        LibraryPath: libraryPath,
                        MediaType: mediaType,
                        Quality: quality
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    this.activeDownloads.set(result.taskId, {
                        taskId: result.taskId,
                        fileName: fileName,
                        libraryPath: libraryPath.Name
                    });
                    
                    DirectDownload.components.DownloadManager.showNotification(
                        `Download started: ${fileName} → ${libraryPath.Name}`, 
                        'success'
                    );
                    
                    this.showDownloadProgressModal();
                } else {
                    throw new Error('Failed to start download');
                }
            } catch (error) {
                console.error('[DirectDownload] Error starting download:', error);
                DirectDownload.components.DownloadManager.showNotification('Failed to start download', 'error');
            }
        },
        
        // Show download progress modal
        showDownloadProgressModal: function() {
            // Check if modal already exists
            if (document.getElementById('download-progress-modal')) {
                return;
            }
            
            const modal = DirectDownload.components.Modal.create('Active Downloads', `
                <div id="download-progress-container">
                    <div class="downloads-list"></div>
                </div>
            `, {
                size: 'large',
                footer: `
                    <button class="secondary-btn close-progress-btn">Close</button>
                `
            });
            
            modal.id = 'download-progress-modal';
            
            // Setup close button
            modal.querySelector('.close-progress-btn')?.addEventListener('click', () => {
                DirectDownload.components.Modal.close(modal);
            });
            
            // Initial update
            this.updateDownloadProgress();
        },
        
        // Update download progress display
        updateDownloadProgress: async function() {
            const container = document.querySelector('#download-progress-container .downloads-list');
            if (!container) return;
            
            try {
                const response = await fetch('/DirectDownload/Download/active');
                if (!response.ok) return;
                
                const downloads = await response.json();
                
                if (downloads.length === 0) {
                    container.innerHTML = '<p class="no-downloads">No active downloads</p>';
                    return;
                }
                
                container.innerHTML = downloads.map(download => this.createProgressCard(download)).join('');
                
                // Setup cancel buttons
                container.querySelectorAll('.cancel-download-btn').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        const taskId = btn.dataset.taskId;
                        await this.cancelDownload(taskId);
                    });
                });
            } catch (error) {
                console.error('[DirectDownload] Error updating progress:', error);
            }
        },
        
        // Create progress card HTML
        createProgressCard: function(download) {
            const progress = download.Progress || 0;
            const speed = DirectDownload.utils.formatFileSize(download.SpeedBytesPerSecond || 0) + '/s';
            const downloaded = DirectDownload.utils.formatFileSize(download.DownloadedBytes || 0);
            const total = DirectDownload.utils.formatFileSize(download.TotalBytes || 0);
            const statusClass = download.Status.toLowerCase();
            
            return `
                <div class="download-progress-card ${statusClass}">
                    <div class="download-header">
                        <span class="download-filename">${DirectDownload.utils.escapeHtml(download.FileName)}</span>
                        <span class="download-status">${download.Status}</span>
                    </div>
                    <div class="download-info">
                        <span class="download-destination">→ ${download.LibraryType}</span>
                        <span class="download-speed">${speed}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="download-stats">
                        <span>${downloaded} / ${total}</span>
                        <span>${progress.toFixed(1)}%</span>
                    </div>
                    ${download.Status === 'Downloading' || download.Status === 'Queued' ? `
                        <button class="cancel-download-btn secondary-btn" data-task-id="${download.TaskId}">
                            Cancel
                        </button>
                    ` : ''}
                </div>
            `;
        },
        
        // Cancel download
        cancelDownload: async function(taskId) {
            try {
                const response = await fetch(`/DirectDownload/Download/cancel/${taskId}`, {
                    method: 'POST'
                });
                
                if (response.ok) {
                    this.activeDownloads.delete(taskId);
                    DirectDownload.components.DownloadManager.showNotification('Download cancelled', 'info');
                    this.updateDownloadProgress();
                } else {
                    throw new Error('Failed to cancel download');
                }
            } catch (error) {
                console.error('[DirectDownload] Error cancelling download:', error);
                DirectDownload.components.DownloadManager.showNotification('Failed to cancel download', 'error');
            }
        },
        
        // Start polling for download status
        startStatusPolling: function() {
            if (this.statusPollInterval) {
                clearInterval(this.statusPollInterval);
            }
            
            this.statusPollInterval = setInterval(() => {
                if (this.activeDownloads.size > 0) {
                    this.updateDownloadProgress();
                }
            }, 2000); // Poll every 2 seconds
        },
        
        // Stop polling
        stopStatusPolling: function() {
            if (this.statusPollInterval) {
                clearInterval(this.statusPollInterval);
                this.statusPollInterval = null;
            }
        },
        
        // Get library icon based on type
        getLibraryIcon: function(type) {
            const icons = {
                'Movies': '🎬',
                'TV Shows': '📺',
                'Music': '🎵',
                'Other': '📁'
            };
            return icons[type] || '📁';
        }
    };
    
})(window.DirectDownload || (window.DirectDownload = {}));
