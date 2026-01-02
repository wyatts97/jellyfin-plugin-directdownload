using Jellyfin.Plugin.DirectDownload.Models;
using Jellyfin.Plugin.DirectDownload.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Http;
using System.Text.Json;
using MediaBrowser.Model.Plugins;

namespace Jellyfin.Plugin.DirectDownload.Services;

/// <summary>
/// Implementation of the search service for direct download sources.
/// </summary>
public class SearchService : ISearchService
{
    private readonly PluginConfiguration _config;
    private readonly ILogger<SearchService> _logger;
    private readonly HttpClient _httpClient;

    private readonly DirectoryParser _directoryParser;

    // Predefined direct download sources
    private readonly List<DownloadSource> _defaultSources = new()
    {
        new DownloadSource
        {
            Name = "111477",
            BaseUrl = "https://a.111477.xyz",
            SearchEndpoint = "/",
            IsEnabled = true,
            Priority = 1
        }
        // Add more direct download sites here as needed
    };

    public SearchService(ILogger<SearchService> logger, HttpClient httpClient, DirectoryParser directoryParser)
    {
        _logger = logger;
        _httpClient = httpClient;
        _directoryParser = directoryParser;
        _config = new PluginConfiguration(); // Default configuration
    }

    /// <inheritdoc />
    public async Task<IEnumerable<SearchResult>> SearchAsync(string query, string mediaType = "", int? year = null, CancellationToken cancellationToken = default)
    {
        var results = new List<SearchResult>();
        var enabledSources = GetAvailableSources().Where(s => s.IsEnabled);

        var searchTasks = enabledSources.Select(source => 
            SearchSourceAsync(source.Name, query, mediaType, year, cancellationToken));

        var searchResults = await Task.WhenAll(searchTasks);
        
        foreach (var sourceResults in searchResults)
        {
            results.AddRange(sourceResults);
        }

        // Sort by relevance and date
        return results
            .OrderByDescending(r => r.LastModified)
            .ThenBy(r => r.Title)
            .Take(_config.MaxResultsPerSource * enabledSources.Count());
    }

    /// <inheritdoc />
    public async Task<IEnumerable<SearchResult>> SearchSourceAsync(string sourceName, string query, string mediaType = "", int? year = null, CancellationToken cancellationToken = default)
    {
        var source = GetAvailableSources().FirstOrDefault(s => s.Name.Equals(sourceName, StringComparison.OrdinalIgnoreCase));
        if (source == null)
        {
            _logger.LogWarning("Source {SourceName} not found", sourceName);
            return Enumerable.Empty<SearchResult>();
        }

        try
        {
            // Search direct download site directories
            return await SearchDirectDownloadSiteAsync(source, query, mediaType, year, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching source {SourceName}", sourceName);
            return Enumerable.Empty<SearchResult>();
        }
    }

    /// <inheritdoc />
    public IEnumerable<DownloadSource> GetAvailableSources()
    {
        return _defaultSources;
    }

    /// <inheritdoc />
    public async Task<bool> TestSourceAsync(string sourceName, CancellationToken cancellationToken = default)
    {
        try
        {
            var source = GetAvailableSources().FirstOrDefault(s => s.Name.Equals(sourceName, StringComparison.OrdinalIgnoreCase));
            if (source == null) return false;

            var response = await _httpClient.GetAsync(source.BaseUrl, cancellationToken);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing source {SourceName}", sourceName);
            return false;
        }
    }

    private async Task<IEnumerable<SearchResult>> SearchDirectDownloadSiteAsync(DownloadSource source, string query, string mediaType, int? year, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Searching {Source} for: {Query}", source.Name, query);
        
        try
        {
            var allResults = new List<SearchResult>();
            
            // Start with root directory
            await BrowseDirectoryAsync(source, "", allResults, cancellationToken, maxDepth: 3);
            
            // Filter results by query
            var filteredResults = _directoryParser.FilterResults(allResults, query);
            
            // Apply additional filters
            if (!string.IsNullOrEmpty(mediaType))
            {
                filteredResults = filteredResults.Where(r => r.MediaType.Equals(mediaType, StringComparison.OrdinalIgnoreCase)).ToList();
            }
            
            if (year.HasValue)
            {
                filteredResults = filteredResults.Where(r => r.Year == year.Value || r.Title.Contains(year.Value.ToString())).ToList();
            }
            
            return filteredResults;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching {Source}", source.Name);
            return Enumerable.Empty<SearchResult>();
        }
    }
    
    private async Task BrowseDirectoryAsync(DownloadSource source, string path, List<SearchResult> results, CancellationToken cancellationToken, int currentDepth = 0, int maxDepth = 3)
    {
        if (currentDepth >= maxDepth)
            return;
            
        try
        {
            var url = string.IsNullOrEmpty(path) ? source.BaseUrl : $"{source.BaseUrl.TrimEnd('/')}/{path.TrimStart('/')}".TrimEnd('/');
            
            _logger.LogDebug("Browsing directory: {Url}", url);
            
            var response = await _httpClient.GetAsync(url, cancellationToken);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to browse {Url}: {StatusCode}", url, response.StatusCode);
                return;
            }
            
            var html = await response.Content.ReadAsStringAsync(cancellationToken);
            var directoryResults = _directoryParser.ParseDirectoryListing(html, source.BaseUrl, path);
            
            foreach (var result in directoryResults)
            {
                if (result.IsDirectory)
                {
                    // Recursively browse subdirectories
                    await BrowseDirectoryAsync(source, result.FilePath, results, cancellationToken, currentDepth + 1, maxDepth);
                }
                else
                {
                    // Add file to results
                    results.Add(result);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error browsing directory {Path}", path);
        }
    }
}
