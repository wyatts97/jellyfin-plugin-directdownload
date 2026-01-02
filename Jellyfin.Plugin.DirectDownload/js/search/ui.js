// Search UI module for Direct Download plugin
// Handles the search interface and user interactions

(function(DirectDownload) {
    'use strict';
    
    DirectDownload.components.SearchUI = {
        // Current search state
        currentQuery: '',
        currentResults: [],
        isSearching: false,
        
        // Initialize search UI
        init: function() {
            this.setupSearchForm();
            this.setupFilters();
            this.setupKeyboardShortcuts();
        },
        
        // Setup search form
        setupSearchForm: function() {
            const searchInput = document.getElementById('direct-download-search-input');
            const searchBtn = document.getElementById('direct-download-search-btn');
            
            if (searchInput && searchBtn) {
                // Auto-complete functionality
                searchInput.addEventListener('input', this.debounce((e) => {
                    const query = e.target.value.trim();
                    if (query.length >= 3) {
                        this.showSuggestions(query);
                    } else {
                        this.hideSuggestions();
                    }
                }, 300));
                
                // Search button
                searchBtn.addEventListener('click', () => {
                    this.performSearch();
                });
                
                // Enter key
                searchInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.performSearch();
                    }
                });
            }
        },
        
        // Setup filters
        setupFilters: function() {
            const qualityFilter = document.getElementById('direct-download-quality-filter');
            const sourceFilter = document.getElementById('direct-download-source-filter');
            
            if (qualityFilter) {
                qualityFilter.addEventListener('change', () => {
                    this.filterResults();
                });
            }
            
            if (sourceFilter) {
                sourceFilter.addEventListener('change', () => {
                    this.filterResults();
                });
            }
        },
        
        // Setup keyboard shortcuts
        setupKeyboardShortcuts: function() {
            document.addEventListener('keydown', (e) => {
                // Ctrl/Cmd + K to open search
                if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                    e.preventDefault();
                    DirectDownload.openSearchModal();
                }
                
                // Escape to close modal
                if (e.key === 'Escape') {
                    const modal = document.getElementById('direct-download-modal');
                    if (modal && modal.style.display === 'block') {
                        DirectDownload.closeSearchModal();
                    }
                }
            });
        },
        
        // Perform search
        performSearch: async function() {
            const query = document.getElementById('direct-download-search-input').value.trim();
            
            if (!query || this.isSearching) {
                return;
            }
            
            this.currentQuery = query;
            this.isSearching = true;
            this.showLoading(true);
            this.clearResults();
            
            try {
                const options = this.getSearchOptions();
                const results = await DirectDownload.components.SearchAPI.search(query, options);
                
                this.currentResults = results;
                this.displayResults(results);
                this.updateSearchStats(results.length);
                
            } catch (error) {
                console.error('[DirectDownload] Search error:', error);
                this.showError('Search failed. Please try again.');
            } finally {
                this.isSearching = false;
                this.showLoading(false);
            }
        },
        
        // Get search options from filters
        getSearchOptions: function() {
            const qualityFilter = document.getElementById('direct-download-quality-filter');
            const sourceFilter = document.getElementById('direct-download-source-filter');
            
            const options = {};
            
            if (qualityFilter && qualityFilter.value) {
                options.quality = qualityFilter.value;
            }
            
            if (sourceFilter && sourceFilter.value) {
                options.source = sourceFilter.value;
            }
            
            return options;
        },
        
        // Display search results
        displayResults: function(results) {
            const resultsContainer = document.getElementById('direct-download-search-results');
            
            if (!results || results.length === 0) {
                this.showNoResults();
                return;
            }
            
            const resultsHTML = results.map(result => this.createResultCard(result)).join('');
            resultsContainer.innerHTML = resultsHTML;
            
            // Setup result card interactions
            this.setupResultCards();
        },
        
        // Create result card HTML
        createResultCard: function(result) {
            const size = DirectDownload.utils.formatFileSize(result.Size);
            const seeders = result.Seeders || 0;
            const leechers = result.Leechers || 0;
            const quality = result.Quality || 'Unknown';
            const source = result.Source || 'Unknown';
            const isTrusted = result.IsTrusted || false;
            
            return `
                <div class="search-result-card" data-quality="${quality}" data-source="${source}">
                    <div class="result-header">
                        <div class="result-title">
                            <h3>${this.escapeHtml(result.Title)}</h3>
                            ${isTrusted ? '<span class="trusted-badge">✓ Trusted</span>' : ''}
                        </div>
                        <div class="result-quality">${quality}</div>
                    </div>
                    <div class="result-meta">
                        <span class="result-source" title="Source: ${source}">${source}</span>
                        <span class="result-size" title="Size: ${size}">${size}</span>
                        <span class="result-seeders ${seeders > 0 ? 'healthy' : 'unhealthy'}" title="Seeders: ${seeders}">
                            🔼 ${seeders}
                        </span>
                        <span class="result-leechers" title="Leechers: ${leechers}">
                            🔽 ${leechers}
                        </span>
                    </div>
                    <div class="result-actions">
                        <button class="download-btn primary-btn" data-url="${this.escapeHtml(result.DownloadUrl)}" data-title="${this.escapeHtml(result.Title)}">
                            <span class="material-icons download">download</span> Download
                        </button>
                        <button class="copy-magnet-btn secondary-btn" data-url="${this.escapeHtml(result.DownloadUrl)}">
                            <span class="material-icons content_copy">content_copy</span> Copy
                        </button>
                        <button class="details-btn secondary-btn" data-result='${JSON.stringify(result).replace(/'/g, '&apos;')}'>
                            <span class="material-icons info">info</span> Details
                        </button>
                    </div>
                </div>
            `;
        },
        
        // Setup result card interactions
        setupResultCards: function() {
            const resultsContainer = document.getElementById('direct-download-search-results');
            
            // Download buttons
            resultsContainer.querySelectorAll('.download-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const url = e.target.closest('.download-btn').dataset.url;
                    const title = e.target.closest('.download-btn').dataset.title;
                    DirectDownload.components.DownloadManager.handleDownload(url, title);
                });
            });
            
            // Copy magnet buttons
            resultsContainer.querySelectorAll('.copy-magnet-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const url = e.target.closest('.copy-magnet-btn').dataset.url;
                    this.copyToClipboard(url, e.target.closest('.copy-magnet-btn'));
                });
            });
            
            // Details buttons
            resultsContainer.querySelectorAll('.details-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const result = JSON.parse(e.target.closest('.details-btn').dataset.result);
                    this.showDetailsModal(result);
                });
            });
        },
        
        // Copy to clipboard
        copyToClipboard: async function(text, button) {
            try {
                await navigator.clipboard.writeText(text);
                
                // Show success feedback
                const originalHTML = button.innerHTML;
                button.innerHTML = '<span class="material-icons check">check</span> Copied!';
                button.classList.add('success');
                
                setTimeout(() => {
                    button.innerHTML = originalHTML;
                    button.classList.remove('success');
                }, 2000);
                
            } catch (error) {
                console.error('[DirectDownload] Failed to copy to clipboard:', error);
                this.showNotification('Failed to copy to clipboard', 'error');
            }
        },
        
        // Show details modal
        showDetailsModal: function(result) {
            const modal = DirectDownload.components.Modal.create('Download Details', `
                <div class="details-content">
                    <h3>${this.escapeHtml(result.Title)}</h3>
                    <div class="details-grid">
                        <div class="detail-item">
                            <label>Source:</label>
                            <span>${result.Source}</span>
                        </div>
                        <div class="detail-item">
                            <label>Quality:</label>
                            <span>${result.Quality || 'Unknown'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Size:</label>
                            <span>${DirectDownload.utils.formatFileSize(result.Size)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Seeders:</label>
                            <span>${result.Seeders || 0}</span>
                        </div>
                        <div class="detail-item">
                            <label>Leechers:</label>
                            <span>${result.Leechers || 0}</span>
                        </div>
                        <div class="detail-item">
                            <label>Upload Date:</label>
                            <span>${new Date(result.UploadDate).toLocaleDateString()}</span>
                        </div>
                        ${result.ImdbId ? `
                        <div class="detail-item">
                            <label>IMDb:</label>
                            <span><a href="https://www.imdb.com/title/${result.ImdbId}" target="_blank">${result.ImdbId}</a></span>
                        </div>
                        ` : ''}
                    </div>
                    <div class="details-actions">
                        <button class="download-btn primary-btn" data-url="${this.escapeHtml(result.DownloadUrl)}">
                            <span class="material-icons download">download</span> Download
                        </button>
                        <button class="copy-magnet-btn secondary-btn" data-url="${this.escapeHtml(result.DownloadUrl)}">
                            <span class="material-icons content_copy">content_copy</span> Copy Magnet
                        </button>
                    </div>
                </div>
            `);
            
            // Setup modal actions
            modal.querySelector('.download-btn').addEventListener('click', (e) => {
                const url = e.target.dataset.url;
                DirectDownload.components.DownloadManager.handleDownload(url, result.Title);
                DirectDownload.components.Modal.close(modal);
            });
            
            modal.querySelector('.copy-magnet-btn').addEventListener('click', (e) => {
                const url = e.target.dataset.url;
                this.copyToClipboard(url, e.target.closest('.copy-magnet-btn'));
            });
        },
        
        // Filter results
        filterResults: function() {
            const qualityFilter = document.getElementById('direct-download-quality-filter');
            const sourceFilter = document.getElementById('direct-download-source-filter');
            const resultCards = document.querySelectorAll('.search-result-card');
            
            resultCards.forEach(card => {
                let show = true;
                
                if (qualityFilter && qualityFilter.value) {
                    const cardQuality = card.dataset.quality;
                    if (cardQuality !== qualityFilter.value) {
                        show = false;
                    }
                }
                
                if (sourceFilter && sourceFilter.value) {
                    const cardSource = card.dataset.source;
                    if (cardSource !== sourceFilter.value) {
                        show = false;
                    }
                }
                
                card.style.display = show ? 'block' : 'none';
            });
            
            this.updateSearchStats(Array.from(resultCards).filter(card => card.style.display !== 'none').length);
        },
        
        // Update search statistics
        updateSearchStats: function(count) {
            let statsElement = document.querySelector('.search-stats');
            
            if (!statsElement) {
                statsElement = document.createElement('div');
                statsElement.className = 'search-stats';
                document.querySelector('.search-form').appendChild(statsElement);
            }
            
            statsElement.textContent = count > 0 ? `Found ${count} result${count !== 1 ? 's' : ''}` : 'No results found';
        },
        
        // Show loading state
        showLoading: function(show) {
            const loadingElement = document.querySelector('.search-loading');
            if (loadingElement) {
                loadingElement.style.display = show ? 'block' : 'none';
            }
        },
        
        // Show no results
        showNoResults: function() {
            const resultsContainer = document.getElementById('direct-download-search-results');
            resultsContainer.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">🔍</div>
                    <h3>No results found</h3>
                    <p>Try adjusting your search terms or filters</p>
                </div>
            `;
        },
        
        // Show error
        showError: function(message) {
            const resultsContainer = document.getElementById('direct-download-search-results');
            resultsContainer.innerHTML = `
                <div class="search-error">
                    <div class="error-icon">⚠️</div>
                    <h3>Search Error</h3>
                    <p>${message}</p>
                </div>
            `;
        },
        
        // Clear results
        clearResults: function() {
            const resultsContainer = document.getElementById('direct-download-search-results');
            resultsContainer.innerHTML = '';
        },
        
        // Show suggestions (placeholder for future implementation)
        showSuggestions: function(query) {
            // TODO: Implement search suggestions
            console.log('[DirectDownload] Suggestions for:', query);
        },
        
        // Hide suggestions
        hideSuggestions: function() {
            // TODO: Hide suggestions dropdown
        },
        
        // Escape HTML
        escapeHtml: function(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },
        
        // Debounce function
        debounce: function(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }
    };
    
})(window.DirectDownload || (window.DirectDownload = {}));
