// Utility functions for Direct Download plugin

(function(DirectDownload) {
    'use strict';
    
    DirectDownload.utils = {
        // Format file size
        formatFileSize: function(bytes) {
            if (bytes === 0) return '0 B';
            
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        },
        
        // Format duration
        formatDuration: function(seconds) {
            if (!seconds || seconds < 0) return 'Unknown';
            
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);
            
            if (hours > 0) {
                return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            } else {
                return `${minutes}:${secs.toString().padStart(2, '0')}`;
            }
        },
        
        // Format date
        formatDate: function(timestamp) {
            const date = new Date(timestamp);
            const now = new Date();
            const diffMs = now - date;
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            if (diffHours < 1) {
                return 'Just now';
            } else if (diffHours < 24) {
                return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
            } else if (diffDays < 7) {
                return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
            } else {
                return date.toLocaleDateString();
            }
        },
        
        // Format number with commas
        formatNumber: function(num) {
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        },
        
        // Get quality priority
        getQualityPriority: function(quality) {
            const priorities = {
                '4K': 4,
                '2160p': 4,
                '1080p': 3,
                '720p': 2,
                '480p': 1,
                '360p': 0
            };
            
            return priorities[quality] || 0;
        },
        
        // Sort results by quality
        sortByQuality: function(results, preferredQuality = '1080p') {
            const preferredPriority = this.getQualityPriority(preferredQuality);
            
            return results.sort((a, b) => {
                const aPriority = this.getQualityPriority(a.Quality);
                const bPriority = this.getQualityPriority(b.Quality);
                
                // Sort by how close to preferred quality
                const aDiff = Math.abs(aPriority - preferredPriority);
                const bDiff = Math.abs(bPriority - preferredPriority);
                
                if (aDiff !== bDiff) {
                    return aDiff - bDiff;
                }
                
                // Then by seeders
                return (b.Seeders || 0) - (a.Seeders || 0);
            });
        },
        
        // Filter results by quality
        filterByQuality: function(results, quality) {
            if (!quality) return results;
            
            return results.filter(result => {
                const resultQuality = (result.Quality || '').toLowerCase();
                const filterQuality = quality.toLowerCase();
                
                return resultQuality === filterQuality || 
                       resultQuality.includes(filterQuality) ||
                       filterQuality.includes(resultQuality);
            });
        },
        
        // Filter results by size
        filterBySize: function(results, maxSize, minSize = 0) {
            return results.filter(result => {
                const size = result.Size || 0;
                return size >= minSize && size <= maxSize;
            });
        },
        
        // Filter results by seeders
        filterBySeeders: function(results, minSeeders = 1) {
            return results.filter(result => {
                return (result.Seeders || 0) >= minSeeders;
            });
        },
        
        // Extract IMDB ID from title
        extractImdbId: function(title) {
            const imdbMatch = title.match(/(tt\d{7,8})/);
            return imdbMatch ? imdbMatch[1] : null;
        },
        
        // Extract year from title
        extractYear: function(title) {
            const yearMatch = title.match(/\b(19|20)\d{2}\b/);
            return yearMatch ? parseInt(yearMatch[0]) : null;
        },
        
        // Clean title for better matching
        cleanTitle: function(title) {
            return title
                .replace(/\[.*?\]/g, '') // Remove brackets
                .replace(/\(.*?\)/g, '') // Remove parentheses
                .replace(/\./g, ' ') // Replace dots with spaces
                .replace(/_/g, ' ') // Replace underscores with spaces
                .replace(/\s+/g, ' ') // Multiple spaces to single
                .replace(/\b(19|20)\d{2}\b/g, '') // Remove years
                .trim();
        },
        
        // Calculate similarity between two strings
        stringSimilarity: function(str1, str2) {
            const longer = str1.length > str2.length ? str1 : str2;
            const shorter = str1.length > str2.length ? str2 : str1;
            
            if (longer.length === 0) return 1.0;
            
            const editDistance = this.levenshteinDistance(longer, shorter);
            return (longer.length - editDistance) / longer.length;
        },
        
        // Levenshtein distance algorithm
        levenshteinDistance: function(str1, str2) {
            const matrix = [];
            
            for (let i = 0; i <= str2.length; i++) {
                matrix[i] = [i];
            }
            
            for (let j = 0; j <= str1.length; j++) {
                matrix[0][j] = j;
            }
            
            for (let i = 1; i <= str2.length; i++) {
                for (let j = 1; j <= str1.length; j++) {
                    if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                        matrix[i][j] = matrix[i - 1][j - 1];
                    } else {
                        matrix[i][j] = Math.min(
                            matrix[i - 1][j - 1] + 1,
                            matrix[i][j - 1] + 1,
                            matrix[i - 1][j] + 1
                        );
                    }
                }
            }
            
            return matrix[str2.length][str1.length];
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
        },
        
        // Throttle function
        throttle: function(func, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },
        
        // Escape HTML
        escapeHtml: function(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },
        
        // Unescape HTML
        unescapeHtml: function(html) {
            const div = document.createElement('div');
            div.innerHTML = html;
            return div.textContent || div.innerText || '';
        },
        
        // Generate random ID
        generateId: function(prefix = 'id') {
            return prefix + '_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        },
        
        // Check if element is in viewport
        isInViewport: function(element) {
            const rect = element.getBoundingClientRect();
            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
        },
        
        // Scroll element into view
        scrollIntoView: function(element, options = {}) {
            const defaultOptions = {
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
            };
            
            element.scrollIntoView({ ...defaultOptions, ...options });
        },
        
        // Get URL parameters
        getUrlParams: function(url = window.location.href) {
            const params = {};
            const urlObj = new URL(url);
            urlObj.searchParams.forEach((value, key) => {
                params[key] = value;
            });
            return params;
        },
        
        // Set URL parameter
        setUrlParam: function(key, value, url = window.location.href) {
            const urlObj = new URL(url);
            urlObj.searchParams.set(key, value);
            return urlObj.toString();
        },
        
        // Copy to clipboard
        copyToClipboard: async function(text) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (error) {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                try {
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    return true;
                } catch (fallbackError) {
                    document.body.removeChild(textArea);
                    return false;
                }
            }
        },
        
        // Download file
        downloadFile: function(url, filename) {
            const link = document.createElement('a');
            link.href = url;
            link.download = filename || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },
        
        // Parse magnet link
        parseMagnetLink: function(magnetUri) {
            const params = this.getUrlParams(magnetUri);
            
            return {
                xt: params.xt || '',
                dn: params.dn || '',
                tr: params.tr ? (Array.isArray(params.tr) ? params.tr : [params.tr]) : [],
                xl: params.xl ? parseInt(params.xl) : null,
                infoHash: params.xt ? params.xt.replace('urn:btih:', '') : ''
            };
        },
        
        // Validate magnet link
        isValidMagnetLink: function(uri) {
            return uri.startsWith('magnet:') && uri.includes('xt=urn:btih:');
        },
        
        // Get file extension
        getFileExtension: function(filename) {
            return filename.split('.').pop().toLowerCase();
        },
        
        // Check if video file
        isVideoFile: function(filename) {
            const videoExtensions = ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v'];
            const extension = this.getFileExtension(filename);
            return videoExtensions.includes(extension);
        },
        
        // Check if audio file
        isAudioFile: function(filename) {
            const audioExtensions = ['mp3', 'flac', 'wav', 'aac', 'ogg', 'm4a', 'wma'];
            const extension = this.getFileExtension(filename);
            return audioExtensions.includes(extension);
        },
        
        // Local storage helpers
        storage: {
            set: function(key, value) {
                try {
                    localStorage.setItem(key, JSON.stringify(value));
                    return true;
                } catch (error) {
                    console.error('Storage set error:', error);
                    return false;
                }
            },
            
            get: function(key, defaultValue = null) {
                try {
                    const item = localStorage.getItem(key);
                    return item ? JSON.parse(item) : defaultValue;
                } catch (error) {
                    console.error('Storage get error:', error);
                    return defaultValue;
                }
            },
            
            remove: function(key) {
                try {
                    localStorage.removeItem(key);
                    return true;
                } catch (error) {
                    console.error('Storage remove error:', error);
                    return false;
                }
            },
            
            clear: function() {
                try {
                    localStorage.clear();
                    return true;
                } catch (error) {
                    console.error('Storage clear error:', error);
                    return false;
                }
            }
        }
    };
    
})(window.DirectDownload || (window.DirectDownload = {}));
