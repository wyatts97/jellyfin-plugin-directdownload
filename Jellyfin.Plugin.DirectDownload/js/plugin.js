// Main entry point for the Direct Download plugin
// This script loads all components and initializes the plugin

(function() {
    'use strict';

    // Plugin configuration and state
    const DirectDownload = {
        name: 'DirectDownload',
        version: '1.0.0',
        config: {},
        isLoading: false,
        
        // Component registry
        components: {},
        
        // Initialize the plugin
        init: async function() {
            console.log('[DirectDownload] Initializing plugin...');
            
            try {
                // Load configuration
                await this.loadConfig();
                
                // Load components
                await this.loadComponents();
                
                // Initialize UI
                this.initializeUI();
                
                // Set up event listeners
                this.setupEventListeners();
                
                console.log('[DirectDownload] Plugin initialized successfully');
            } catch (error) {
                console.error('[DirectDownload] Failed to initialize plugin:', error);
            }
        },
        
        // Load plugin configuration
        loadConfig: async function() {
            try {
                const response = await fetch('/DirectDownload/Config');
                if (response.ok) {
                    this.config = await response.json();
                } else {
                    // Fallback to default configuration
                    this.config = {
                        maxResults: 10,
                        preferredQuality: '1080p',
                        enableCaching: true
                    };
                }
            } catch (error) {
                console.warn('[DirectDownload] Could not load configuration, using defaults:', error);
                this.config = {
                    maxResults: 10,
                    preferredQuality: '1080p',
                    enableCaching: true
                };
            }
        },
        
        // Load all plugin components
        loadComponents: async function() {
            const components = [
                'search/api',
                'search/ui',
                'search/results',
                'download/manager',
                'download/server-manager',
                'ui/modal',
                'ui/button',
                'utils/formatting'
            ];
            
            for (const component of components) {
                try {
                    await this.loadComponent(component);
                } catch (error) {
                    console.warn(`[DirectDownload] Failed to load component ${component}:`, error);
                }
            }
            
            // Initialize server download manager after components loaded
            if (DirectDownload.components.ServerDownloadManager) {
                await DirectDownload.components.ServerDownloadManager.init();
            }
        },
        
        // Load a single component
        loadComponent: function(componentName) {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = `/DirectDownload/js/${componentName}.js`;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        },
        
        // Initialize UI elements
        initializeUI: function() {
            // Add search button to item detail pages
            this.addSearchButtons();
            
            // Add menu item to dashboard
            this.addDashboardMenuItem();
            
            // Create main modal
            this.createSearchModal();
        },
        
        // Add search buttons to item detail pages
        addSearchButtons: function() {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.addedNodes) {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                // Check if this is an item detail page
                                const detailPage = node.querySelector('.itemDetailPage');
                                if (detailPage) {
                                    this.addSearchButtonToDetailPage(detailPage);
                                }
                            }
                        });
                    }
                });
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        },
        
        // Add search button to a specific detail page
        addSearchButtonToDetailPage: function(detailPage) {
            // Check if button already exists
            if (detailPage.querySelector('.direct-download-search-btn')) {
                return;
            }
            
            // Find the button container
            const buttonContainer = detailPage.querySelector('.detailButtons') || 
                                 detailPage.querySelector('.itemActions');
            
            if (buttonContainer) {
                const searchButton = document.createElement('button');
                searchButton.className = 'direct-download-search-btn button-flat';
                searchButton.innerHTML = '<span class="material-icons search">search</span> Search Downloads';
                searchButton.addEventListener('click', () => {
                    this.openSearchModal(detailPage);
                });
                
                buttonContainer.appendChild(searchButton);
            }
        },
        
        // Add menu item to dashboard
        addDashboardMenuItem: function() {
            const adminMenu = document.querySelector('.adminDrawerMenu');
            if (adminMenu && !adminMenu.querySelector('.direct-download-menu-item')) {
                const menuItem = document.createElement('a');
                menuItem.className = 'direct-download-menu-item';
                menuItem.href = '#';
                menuItem.innerHTML = '<span class="material-icons download">download</span> Direct Download';
                menuItem.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.openSearchModal();
                });
                
                adminMenu.appendChild(menuItem);
            }
        },
        
        // Create the main search modal
        createSearchModal: function() {
            const modal = document.createElement('div');
            modal.id = 'direct-download-modal';
            modal.className = 'direct-download-modal';
            modal.innerHTML = `
                <div class="direct-download-modal-content">
                    <div class="direct-download-modal-header">
                        <h2>Search Direct Downloads</h2>
                        <button class="direct-download-modal-close">&times;</button>
                    </div>
                    <div class="direct-download-modal-body">
                        <div class="search-form">
                            <input type="text" id="direct-download-search-input" placeholder="Search for movies, TV shows..." />
                            <select id="direct-download-quality-filter">
                                <option value="">All Qualities</option>
                                <option value="480p">480p</option>
                                <option value="720p">720p</option>
                                <option value="1080p">1080p</option>
                                <option value="4K">4K</option>
                            </select>
                            <button id="direct-download-search-btn">Search</button>
                        </div>
                        <div class="search-loading" style="display: none;">
                            <div class="mdl-spinner mdl-js-spinner is-active"></div>
                            <p>Searching...</p>
                        </div>
                        <div class="search-results" id="direct-download-search-results"></div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Add modal styles
            this.addModalStyles();
            
            // Set up modal event listeners
            this.setupModalEvents();
        },
        
        // Add modal styles
        addModalStyles: function() {
            const style = document.createElement('style');
            style.textContent = `
                .direct-download-modal {
                    display: none;
                    position: fixed;
                    z-index: 10000;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.8);
                }
                
                .direct-download-modal-content {
                    background-color: #242424;
                    margin: 5% auto;
                    padding: 0;
                    border-radius: 8px;
                    width: 90%;
                    max-width: 800px;
                    max-height: 80vh;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
                }
                
                .direct-download-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px;
                    border-bottom: 1px solid #333;
                }
                
                .direct-download-modal-header h2 {
                    margin: 0;
                    color: #fff;
                }
                
                .direct-download-modal-close {
                    background: none;
                    border: none;
                    color: #fff;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                }
                
                .direct-download-modal-body {
                    padding: 20px;
                    max-height: calc(80vh - 80px);
                    overflow-y: auto;
                }
                
                .search-form {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 20px;
                }
                
                .search-form input {
                    flex: 1;
                    padding: 10px;
                    border: 1px solid #333;
                    background: #1a1a1a;
                    color: #fff;
                    border-radius: 4px;
                }
                
                .search-form select, .search-form button {
                    padding: 10px 15px;
                    border: 1px solid #333;
                    background: #00a4dc;
                    color: #fff;
                    border-radius: 4px;
                    cursor: pointer;
                }
                
                .search-loading {
                    text-align: center;
                    padding: 20px;
                    color: #fff;
                }
                
                .search-results {
                    display: grid;
                    gap: 15px;
                }
                
                .direct-download-search-btn {
                    background: #333;
                    color: #fff;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-left: 10px;
                }
                
                .direct-download-search-btn:hover {
                    background: #555;
                }
            `;
            document.head.appendChild(style);
        },
        
        // Set up modal event listeners
        setupModalEvents: function() {
            const modal = document.getElementById('direct-download-modal');
            const closeBtn = modal.querySelector('.direct-download-modal-close');
            const searchBtn = document.getElementById('direct-download-search-btn');
            const searchInput = document.getElementById('direct-download-search-input');
            
            // Close modal
            closeBtn.addEventListener('click', () => {
                this.closeSearchModal();
            });
            
            // Close on outside click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeSearchModal();
                }
            });
            
            // Search functionality
            searchBtn.addEventListener('click', () => {
                this.performSearch();
            });
            
            // Enter key search
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
        },
        
        // Open search modal
        openSearchModal: function(detailPage) {
            const modal = document.getElementById('direct-download-modal');
            modal.style.display = 'block';
            
            // If we have item info, pre-fill the search
            if (detailPage) {
                const title = detailPage.querySelector('.itemName')?.textContent || 
                            detailPage.querySelector('.name')?.textContent;
                if (title) {
                    document.getElementById('direct-download-search-input').value = title.trim();
                }
            }
            
            // Focus search input
            setTimeout(() => {
                document.getElementById('direct-download-search-input').focus();
            }, 100);
        },
        
        // Close search modal
        closeSearchModal: function() {
            const modal = document.getElementById('direct-download-modal');
            modal.style.display = 'none';
            
            // Clear results
            document.getElementById('direct-download-search-results').innerHTML = '';
        },
        
        // Perform search
        performSearch: async function() {
            const query = document.getElementById('direct-download-search-input').value.trim();
            const quality = document.getElementById('direct-download-quality-filter').value;
            
            if (!query) {
                return;
            }
            
            const loadingDiv = document.querySelector('.search-loading');
            const resultsDiv = document.getElementById('direct-download-search-results');
            
            // Show loading
            loadingDiv.style.display = 'block';
            resultsDiv.innerHTML = '';
            
            try {
                const response = await fetch(`/DirectDownload/Search?query=${encodeURIComponent(query)}${quality ? '&mediaType=' + quality : ''}`);
                
                if (response.ok) {
                    const results = await response.json();
                    this.displayResults(results);
                } else {
                    throw new Error('Search failed');
                }
            } catch (error) {
                console.error('[DirectDownload] Search error:', error);
                resultsDiv.innerHTML = '<p style="color: #ff6b6b;">Search failed. Please try again.</p>';
            } finally {
                loadingDiv.style.display = 'none';
            }
        },
        
        // Display search results
        displayResults: function(results) {
            const resultsDiv = document.getElementById('direct-download-search-results');
            
            if (!results || results.length === 0) {
                resultsDiv.innerHTML = '<p style="color: #ccc;">No results found.</p>';
                return;
            }
            
            resultsDiv.innerHTML = results.map(result => this.createResultCard(result)).join('');
            
            // Add event listeners to result cards
            resultsDiv.querySelectorAll('.download-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const btnElement = e.target.closest('.download-btn');
                    const card = btnElement.closest('.search-result-card');
                    const url = btnElement.dataset.url;
                    const fileName = btnElement.dataset.filename;
                    const mediaType = btnElement.dataset.mediatype;
                    const quality = btnElement.dataset.quality;
                    this.handleDownload(url, fileName, mediaType, quality);
                });
            });
        },
        
        // Handle download
        handleDownload: function(url, fileName, mediaType, quality) {
            // Use server-side download manager with library path selection
            if (DirectDownload.components.ServerDownloadManager) {
                DirectDownload.components.ServerDownloadManager.showLibraryPathSelector(
                    url, 
                    fileName || this.extractFileName(url), 
                    mediaType || 'unknown',
                    quality || 'unknown'
                );
            } else {
                // Fallback to direct browser download if server manager not loaded
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName || '';
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        },
        
        // Extract filename from URL
        extractFileName: function(url) {
            try {
                const urlObj = new URL(url);
                const pathname = urlObj.pathname;
                return pathname.substring(pathname.lastIndexOf('/') + 1) || 'download';
            } catch {
                return 'download';
            }
        },
        
        // Create result card HTML
        createResultCard: function(result) {
            const size = this.formatFileSize(result.Size);
            const quality = result.Quality || 'Unknown';
            const extension = result.FileExtension || '';
            const lastModified = result.LastModified ? new Date(result.LastModified).toLocaleDateString() : 'Unknown';
            
            return `
                <div class="search-result-card">
                    <div class="result-header">
                        <h3>${this.escapeHtml(result.Title)}${extension}</h3>
                        <div class="result-quality">${quality}</div>
                    </div>
                    <div class="result-meta">
                        <span class="result-source">📁 ${result.Source}</span>
                        <span class="result-size">💾 ${size}</span>
                        <span class="result-date">📅 ${lastModified}</span>
                        <span class="result-type">📄 ${extension.toUpperCase()}</span>
                    </div>
                    <div class="result-actions">
                        <button class="download-btn button-flat" 
                                data-url="${this.escapeHtml(result.DownloadUrl)}"
                                data-filename="${this.escapeHtml(result.Title)}${extension}"
                                data-mediatype="${this.escapeHtml(result.MediaType)}"
                                data-quality="${this.escapeHtml(quality)}">
                            <span class="material-icons download">download</span> Download
                        </button>
                        <button class="copy-link-btn button-flat" data-url="${this.escapeHtml(result.DownloadUrl)}">
                            <span class="material-icons content_copy">content_copy</span> Copy Link
                        </button>
                    </div>
                </div>
            `;
        },
        
        // Format file size
        formatFileSize: function(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        },
        
        // Escape HTML
        escapeHtml: function(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },
        
        // Set up global event listeners
        setupEventListeners: function() {
            // Add copy link functionality
            document.addEventListener('click', (e) => {
                if (e.target.closest('.copy-link-btn')) {
                    const btn = e.target.closest('.copy-link-btn');
                    const url = btn.dataset.url;
                    
                    navigator.clipboard.writeText(url).then(() => {
                        // Show success message
                        const originalText = btn.innerHTML;
                        btn.innerHTML = '<span class="material-icons check">check</span> Copied!';
                        setTimeout(() => {
                            btn.innerHTML = originalText;
                        }, 2000);
                    }).catch(() => {
                        console.error('[DirectDownload] Failed to copy to clipboard');
                    });
                }
            });
        }
    };
    
    // Initialize plugin when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => DirectDownload.init());
    } else {
        DirectDownload.init();
    }
    
    // Make plugin available globally
    window.DirectDownload = DirectDownload;
    
})();
