// Search API module for Direct Download plugin
// Handles communication with the backend search API

(function(DirectDownload) {
    'use strict';
    
    DirectDownload.components.SearchAPI = {
        // Base API URL
        baseUrl: '/DirectDownload/Search',
        
        // Search for media
        search: async function(query, options = {}) {
            const params = new URLSearchParams({
                query: query.trim()
            });
            
            if (options.mediaType) {
                params.append('mediaType', options.mediaType);
            }
            
            if (options.year) {
                params.append('year', options.year.toString());
            }
            
            try {
                const response = await fetch(`${this.baseUrl}?${params.toString()}`);
                
                if (!response.ok) {
                    throw new Error(`Search failed with status: ${response.status}`);
                }
                
                return await response.json();
            } catch (error) {
                console.error('[DirectDownload] Search API error:', error);
                throw error;
            }
        },
        
        // Search specific source
        searchSource: async function(sourceName, query, options = {}) {
            const params = new URLSearchParams({
                query: query.trim()
            });
            
            if (options.mediaType) {
                params.append('mediaType', options.mediaType);
            }
            
            if (options.year) {
                params.append('year', options.year.toString());
            }
            
            try {
                const response = await fetch(`${this.baseUrl}/${encodeURIComponent(sourceName)}?${params.toString()}`);
                
                if (!response.ok) {
                    throw new Error(`Source search failed with status: ${response.status}`);
                }
                
                return await response.json();
            } catch (error) {
                console.error(`[DirectDownload] Source ${sourceName} search error:`, error);
                throw error;
            }
        },
        
        // Get available sources
        getSources: async function() {
            try {
                const response = await fetch(`${this.baseUrl}/sources`);
                
                if (!response.ok) {
                    throw new Error(`Failed to get sources with status: ${response.status}`);
                }
                
                return await response.json();
            } catch (error) {
                console.error('[DirectDownload] Get sources error:', error);
                throw error;
            }
        },
        
        // Test source availability
        testSource: async function(sourceName) {
            try {
                const response = await fetch(`${this.baseUrl}/test/${encodeURIComponent(sourceName)}`);
                
                if (!response.ok) {
                    return false;
                }
                
                return await response.json();
            } catch (error) {
                console.error(`[DirectDownload] Test source ${sourceName} error:`, error);
                return false;
            }
        },
        
        // Test all sources
        testAllSources: async function() {
            try {
                const sources = await this.getSources();
                const testPromises = sources.map(source => 
                    this.testSource(source.Name).then(isWorking => ({
                        name: source.Name,
                        working: isWorking,
                        enabled: source.IsEnabled
                    }))
                );
                
                return await Promise.all(testPromises);
            } catch (error) {
                console.error('[DirectDownload] Test all sources error:', error);
                throw error;
            }
        }
    };
    
})(window.DirectDownload || (window.DirectDownload = {}));
