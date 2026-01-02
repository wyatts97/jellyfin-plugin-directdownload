// Direct Download Plugin - Jellyfin UI Integration
// Compatible with JS Injector plugin

(function() {
    'use strict';
    
    console.log('[DirectDownload] Initializing plugin...');
    
    const DirectDownload = {
        initialized: false,
        
        init: function() {
            if (this.initialized) return;
            this.initialized = true;
            
            console.log('[DirectDownload] Setting up UI integration...');
            
            // Wait for Jellyfin to be ready
            this.waitForJellyfin();
        },
        
        waitForJellyfin: function() {
            if (typeof ApiClient !== 'undefined' && document.querySelector('.itemDetailPage')) {
                this.setupUI();
            } else {
                setTimeout(() => this.waitForJellyfin(), 500);
            }
        },
        
        setupUI: function() {
            // Add styles
            this.addStyles();
            
            // Watch for page changes
            this.observePageChanges();
            
            // Add button to current page if it's an item detail page
            this.addSearchButtonToCurrentPage();
            
            console.log('[DirectDownload] UI setup complete');
        },
        
        observePageChanges: function() {
            // Watch for navigation changes
            const observer = new MutationObserver(() => {
                this.addSearchButtonToCurrentPage();
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        },
        
        addSearchButtonToCurrentPage: function() {
            const detailPage = document.querySelector('.itemDetailPage');
            if (!detailPage) return;
            
            // Check if button already exists
            if (detailPage.querySelector('.directDownloadSearchBtn')) return;
            
            // Find the button container
            const buttonContainer = detailPage.querySelector('.itemDetailButtons, .detailButtons');
            if (!buttonContainer) return;
            
            // Create search button
            const searchBtn = document.createElement('button');
            searchBtn.className = 'button-flat directDownloadSearchBtn';
            searchBtn.innerHTML = `
                <span class="material-icons download" style="margin-right: 0.5em;">download</span>
                <span>Search Downloads</span>
            `;
            searchBtn.style.cssText = 'margin: 0 0.5em;';
            
            searchBtn.addEventListener('click', () => {
                const itemName = detailPage.querySelector('.itemName, .nameContainer h1')?.textContent || '';
                this.openSearchModal(itemName);
            });
            
            buttonContainer.appendChild(searchBtn);
            console.log('[DirectDownload] Search button added to detail page');
        },
        
        openSearchModal: function(initialQuery = '') {
            // Create modal backdrop
            const backdrop = document.createElement('div');
            backdrop.className = 'dialogBackdrop';
            backdrop.style.cssText = 'z-index: 9999;';
            
            // Create modal
            const modal = document.createElement('div');
            modal.className = 'dialog directDownloadModal';
            modal.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #181818;
                border-radius: 8px;
                width: 90%;
                max-width: 900px;
                max-height: 80vh;
                overflow: hidden;
                z-index: 10000;
                box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            `;
            
            modal.innerHTML = `
                <div class="dialogHeader" style="padding: 1.5em; border-bottom: 1px solid #333;">
                    <h2 style="margin: 0;">Search Direct Downloads</h2>
                    <button class="btnCloseDialog" style="position: absolute; top: 1em; right: 1em;">
                        <span class="material-icons close">close</span>
                    </button>
                </div>
                <div class="dialogContent" style="padding: 1.5em; overflow-y: auto; max-height: calc(80vh - 120px);">
                    <div class="searchForm" style="display: flex; gap: 0.5em; margin-bottom: 1.5em;">
                        <input type="text" class="searchInput" placeholder="Search for media..." 
                               value="${this.escapeHtml(initialQuery)}"
                               style="flex: 1; padding: 0.75em; background: #0a0a0a; border: 1px solid #444; color: #fff; border-radius: 4px;">
                        <button class="searchBtn button-flat" style="padding: 0.75em 1.5em;">
                            <span class="material-icons search">search</span>
                            Search
                        </button>
                    </div>
                    <div class="loadingIndicator" style="display: none; text-align: center; padding: 2em; color: #aaa;">
                        <div class="mdl-spinner mdl-spinner--single-color mdl-js-spinner is-active"></div>
                        <p>Searching...</p>
                    </div>
                    <div class="resultsContainer" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1em;"></div>
                    <div class="noResults" style="display: none; text-align: center; padding: 2em; color: #aaa;">
                        No results found. Try a different search term.
                    </div>
                </div>
            `;
            
            document.body.appendChild(backdrop);
            document.body.appendChild(modal);
            
            // Setup event handlers
            const closeBtn = modal.querySelector('.btnCloseDialog');
            const searchInput = modal.querySelector('.searchInput');
            const searchBtn = modal.querySelector('.searchBtn');
            
            const closeModal = () => {
                backdrop.remove();
                modal.remove();
            };
            
            closeBtn.addEventListener('click', closeModal);
            backdrop.addEventListener('click', closeModal);
            
            searchBtn.addEventListener('click', () => this.performSearch(modal));
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.performSearch(modal);
            });
            
            // Auto-search if there's an initial query
            if (initialQuery) {
                setTimeout(() => this.performSearch(modal), 100);
            }
            
            searchInput.focus();
        },
        
        performSearch: async function(modal) {
            const searchInput = modal.querySelector('.searchInput');
            const loadingIndicator = modal.querySelector('.loadingIndicator');
            const resultsContainer = modal.querySelector('.resultsContainer');
            const noResults = modal.querySelector('.noResults');
            
            const query = searchInput.value.trim();
            if (!query) return;
            
            loadingIndicator.style.display = 'block';
            resultsContainer.innerHTML = '';
            noResults.style.display = 'none';
            
            try {
                const response = await fetch(`/DirectDownload/Search?query=${encodeURIComponent(query)}`);
                const results = await response.json();
                
                loadingIndicator.style.display = 'none';
                
                if (results.length === 0) {
                    noResults.style.display = 'block';
                    return;
                }
                
                this.displayResults(resultsContainer, results);
            } catch (error) {
                console.error('[DirectDownload] Search error:', error);
                loadingIndicator.style.display = 'none';
                resultsContainer.innerHTML = '<p style="color: #ff6b6b; text-align: center;">Search failed. Please try again.</p>';
            }
        },
        
        displayResults: function(container, results) {
            container.innerHTML = results.map(result => this.createResultCard(result)).join('');
            
            // Add download button handlers
            container.querySelectorAll('.downloadBtn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.handleDownload(
                        btn.dataset.url,
                        btn.dataset.filename,
                        btn.dataset.mediatype,
                        btn.dataset.quality
                    );
                });
            });
        },
        
        createResultCard: function(result) {
            const size = this.formatFileSize(result.Size || 0);
            const quality = result.Quality || 'Unknown';
            const extension = result.FileExtension || '';
            const lastModified = result.LastModified ? new Date(result.LastModified).toLocaleDateString() : '';
            
            return `
                <div class="card" style="background: #0a0a0a; border: 1px solid #333; border-radius: 6px; padding: 1em;">
                    <div style="margin-bottom: 0.75em;">
                        <h3 style="margin: 0 0 0.5em 0; font-size: 1em; color: #fff;">${this.escapeHtml(result.Title)}${extension}</h3>
                        <div style="display: flex; gap: 1em; font-size: 0.85em; color: #aaa; flex-wrap: wrap;">
                            <span>📁 ${result.Source}</span>
                            <span>💾 ${size}</span>
                            <span>🎬 ${quality}</span>
                            ${lastModified ? `<span>📅 ${lastModified}</span>` : ''}
                        </div>
                    </div>
                    <button class="downloadBtn button-flat" 
                            data-url="${this.escapeHtml(result.DownloadUrl)}"
                            data-filename="${this.escapeHtml(result.Title)}${extension}"
                            data-mediatype="${this.escapeHtml(result.MediaType)}"
                            data-quality="${this.escapeHtml(quality)}"
                            style="width: 100%; padding: 0.5em;">
                        <span class="material-icons download" style="margin-right: 0.5em;">download</span>
                        Download
                    </button>
                </div>
            `;
        },
        
        handleDownload: async function(url, filename, mediaType, quality) {
            try {
                // Get library paths
                const pathsResponse = await fetch('/DirectDownload/Download/library-paths');
                const paths = await pathsResponse.json();
                
                if (paths.length === 0) {
                    this.showNotification('Please configure library paths in plugin settings first.', 'error');
                    return;
                }
                
                // Show library path selector
                this.showLibraryPathSelector(url, filename, mediaType, quality, paths);
            } catch (error) {
                console.error('[DirectDownload] Error getting library paths:', error);
                this.showNotification('Failed to load library paths', 'error');
            }
        },
        
        showLibraryPathSelector: function(url, filename, mediaType, quality, paths) {
            const backdrop = document.createElement('div');
            backdrop.className = 'dialogBackdrop';
            backdrop.style.cssText = 'z-index: 10001;';
            
            const modal = document.createElement('div');
            modal.className = 'dialog';
            modal.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #181818;
                border-radius: 8px;
                width: 90%;
                max-width: 500px;
                z-index: 10002;
                box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            `;
            
            modal.innerHTML = `
                <div class="dialogHeader" style="padding: 1.5em; border-bottom: 1px solid #333;">
                    <h2 style="margin: 0;">Select Download Location</h2>
                </div>
                <div class="dialogContent" style="padding: 1.5em;">
                    <p style="margin-bottom: 1em; color: #aaa;">
                        <strong>File:</strong> ${this.escapeHtml(filename)}<br>
                        <strong>Quality:</strong> ${quality}
                    </p>
                    <div class="pathsList">
                        ${paths.map(path => `
                            <button class="pathOption button-flat" data-path='${JSON.stringify(path).replace(/'/g, '&apos;')}'
                                    style="width: 100%; text-align: left; padding: 1em; margin-bottom: 0.5em; background: #0a0a0a; border: 1px solid #444;">
                                <div style="font-weight: bold;">${this.escapeHtml(path.Name)} ${path.IsDefault ? '(Default)' : ''}</div>
                                <div style="font-size: 0.85em; color: #aaa;">${this.escapeHtml(path.Path)}</div>
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
            
            document.body.appendChild(backdrop);
            document.body.appendChild(modal);
            
            const closeModal = () => {
                backdrop.remove();
                modal.remove();
            };
            
            backdrop.addEventListener('click', closeModal);
            
            modal.querySelectorAll('.pathOption').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const libraryPath = JSON.parse(btn.dataset.path);
                    closeModal();
                    await this.startDownload(url, filename, libraryPath, mediaType, quality);
                });
            });
        },
        
        startDownload: async function(url, filename, libraryPath, mediaType, quality) {
            try {
                const response = await fetch('/DirectDownload/Download/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        Url: url,
                        FileName: filename,
                        LibraryPath: libraryPath,
                        MediaType: mediaType,
                        Quality: quality
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    this.showNotification(`Download started: ${filename} → ${libraryPath.Name}`, 'success');
                } else {
                    throw new Error('Download failed');
                }
            } catch (error) {
                console.error('[DirectDownload] Download error:', error);
                this.showNotification('Failed to start download', 'error');
            }
        },
        
        showNotification: function(message, type = 'info') {
            // Use Jellyfin's notification system if available
            if (typeof Dashboard !== 'undefined' && Dashboard.alert) {
                Dashboard.alert(message);
            } else {
                alert(message);
            }
        },
        
        formatFileSize: function(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        },
        
        escapeHtml: function(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },
        
        addStyles: function() {
            if (document.getElementById('directDownloadStyles')) return;
            
            const style = document.createElement('style');
            style.id = 'directDownloadStyles';
            style.textContent = `
                .directDownloadSearchBtn {
                    background: #00a4dc !important;
                }
                .directDownloadSearchBtn:hover {
                    background: #0086b3 !important;
                }
                .directDownloadModal .searchInput:focus {
                    border-color: #00a4dc;
                    outline: none;
                }
            `;
            document.head.appendChild(style);
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => DirectDownload.init());
    } else {
        DirectDownload.init();
    }
    
    // Make available globally
    window.DirectDownload = DirectDownload;
    
})();
