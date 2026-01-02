using Jellyfin.Plugin.DirectDownload.Models;
using Microsoft.Extensions.Logging;
using System.Text.RegularExpressions;

namespace Jellyfin.Plugin.DirectDownload.Services;

/// <summary>
/// Parser for HTML directory listings from direct download sites.
/// </summary>
public class DirectoryParser
{
    private readonly ILogger<DirectoryParser> _logger;

    public DirectoryParser(ILogger<DirectoryParser> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Parses an HTML directory listing and extracts file information.
    /// </summary>
    public List<SearchResult> ParseDirectoryListing(string html, string baseUrl, string currentPath = "")
    {
        var results = new List<SearchResult>();

        try
        {
            // Parse Apache-style directory listings
            results.AddRange(ParseApacheStyle(html, baseUrl, currentPath));

            // Parse nginx-style directory listings
            if (results.Count == 0)
            {
                results.AddRange(ParseNginxStyle(html, baseUrl, currentPath));
            }

            // Parse generic HTML links
            if (results.Count == 0)
            {
                results.AddRange(ParseGenericLinks(html, baseUrl, currentPath));
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing directory listing");
        }

        return results;
    }

    private List<SearchResult> ParseApacheStyle(string html, string baseUrl, string currentPath)
    {
        var results = new List<SearchResult>();

        // Apache directory listing pattern: <a href="filename">filename</a>  date  size
        var pattern = @"<a\s+href=""([^""]+)"">([^<]+)</a>\s+(\d{2}-\w{3}-\d{4}\s+\d{2}:\d{2})\s+(-|\d+[KMG]?)";
        var matches = Regex.Matches(html, pattern, RegexOptions.IgnoreCase);

        foreach (Match match in matches)
        {
            var href = match.Groups[1].Value;
            var name = match.Groups[2].Value;
            var dateStr = match.Groups[3].Value;
            var sizeStr = match.Groups[4].Value;

            // Skip parent directory
            if (href == "../" || name == "Parent Directory")
                continue;

            var isDirectory = href.EndsWith("/");
            var fullUrl = CombineUrl(baseUrl, currentPath, href);

            var result = new SearchResult
            {
                Title = name.TrimEnd('/'),
                Source = new Uri(baseUrl).Host,
                DownloadUrl = fullUrl,
                FilePath = CombinePath(currentPath, href),
                IsDirectory = isDirectory,
                Size = ParseSize(sizeStr),
                LastModified = ParseDate(dateStr),
                FileExtension = isDirectory ? "" : Path.GetExtension(name),
                Quality = ExtractQuality(name),
                MediaType = DetermineMediaType(name)
            };

            results.Add(result);
        }

        return results;
    }

    private List<SearchResult> ParseNginxStyle(string html, string baseUrl, string currentPath)
    {
        var results = new List<SearchResult>();

        // nginx directory listing pattern
        var pattern = @"<a\s+href=""([^""]+)"">([^<]+)</a>\s+(\d{2}-\w{3}-\d{4}\s+\d{2}:\d{2})\s+(-|\d+)";
        var matches = Regex.Matches(html, pattern, RegexOptions.IgnoreCase);

        foreach (Match match in matches)
        {
            var href = match.Groups[1].Value;
            var name = match.Groups[2].Value;
            var dateStr = match.Groups[3].Value;
            var sizeStr = match.Groups[4].Value;

            if (href == "../")
                continue;

            var isDirectory = href.EndsWith("/");
            var fullUrl = CombineUrl(baseUrl, currentPath, href);

            var result = new SearchResult
            {
                Title = name.TrimEnd('/'),
                Source = new Uri(baseUrl).Host,
                DownloadUrl = fullUrl,
                FilePath = CombinePath(currentPath, href),
                IsDirectory = isDirectory,
                Size = long.TryParse(sizeStr, out var size) ? size : 0,
                LastModified = ParseDate(dateStr),
                FileExtension = isDirectory ? "" : Path.GetExtension(name),
                Quality = ExtractQuality(name),
                MediaType = DetermineMediaType(name)
            };

            results.Add(result);
        }

        return results;
    }

    private List<SearchResult> ParseGenericLinks(string html, string baseUrl, string currentPath)
    {
        var results = new List<SearchResult>();

        // Generic link pattern
        var pattern = @"<a\s+href=""([^""]+)""[^>]*>([^<]+)</a>";
        var matches = Regex.Matches(html, pattern, RegexOptions.IgnoreCase);

        foreach (Match match in matches)
        {
            var href = match.Groups[1].Value;
            var name = match.Groups[2].Value;

            // Skip navigation links
            if (href.StartsWith("http://") || href.StartsWith("https://") || 
                href.StartsWith("../") || href == "/" || href.StartsWith("?"))
                continue;

            // Skip non-media files
            if (!IsMediaFile(href) && !href.EndsWith("/"))
                continue;

            var isDirectory = href.EndsWith("/");
            var fullUrl = CombineUrl(baseUrl, currentPath, href);

            var result = new SearchResult
            {
                Title = name.TrimEnd('/'),
                Source = new Uri(baseUrl).Host,
                DownloadUrl = fullUrl,
                FilePath = CombinePath(currentPath, href),
                IsDirectory = isDirectory,
                Size = 0,
                LastModified = DateTime.UtcNow,
                FileExtension = isDirectory ? "" : Path.GetExtension(name),
                Quality = ExtractQuality(name),
                MediaType = DetermineMediaType(name)
            };

            results.Add(result);
        }

        return results;
    }

    private string CombineUrl(string baseUrl, string currentPath, string href)
    {
        baseUrl = baseUrl.TrimEnd('/');
        currentPath = currentPath.Trim('/');
        href = href.TrimStart('/');

        if (string.IsNullOrEmpty(currentPath))
            return $"{baseUrl}/{href}";

        return $"{baseUrl}/{currentPath}/{href}";
    }

    private string CombinePath(string currentPath, string href)
    {
        currentPath = currentPath.Trim('/');
        href = href.TrimStart('/');

        if (string.IsNullOrEmpty(currentPath))
            return href;

        return $"{currentPath}/{href}";
    }

    private long ParseSize(string sizeStr)
    {
        if (sizeStr == "-" || string.IsNullOrEmpty(sizeStr))
            return 0;

        var match = Regex.Match(sizeStr, @"([\d.]+)([KMGT]?)", RegexOptions.IgnoreCase);
        if (!match.Success)
            return 0;

        if (!double.TryParse(match.Groups[1].Value, out var value))
            return 0;

        var unit = match.Groups[2].Value.ToUpper();
        return unit switch
        {
            "K" => (long)(value * 1024),
            "M" => (long)(value * 1024 * 1024),
            "G" => (long)(value * 1024 * 1024 * 1024),
            "T" => (long)(value * 1024L * 1024 * 1024 * 1024),
            _ => (long)value
        };
    }

    private DateTime ParseDate(string dateStr)
    {
        if (DateTime.TryParse(dateStr, out var date))
            return date;

        return DateTime.UtcNow;
    }

    private string ExtractQuality(string filename)
    {
        var qualityPatterns = new Dictionary<string, string>
        {
            { @"2160p|4K|UHD", "4K" },
            { @"1080p|FHD", "1080p" },
            { @"720p|HD", "720p" },
            { @"480p|SD", "480p" }
        };

        foreach (var pattern in qualityPatterns)
        {
            if (Regex.IsMatch(filename, pattern.Key, RegexOptions.IgnoreCase))
                return pattern.Value;
        }

        return "Unknown";
    }

    private string DetermineMediaType(string filename)
    {
        var videoExtensions = new[] { ".mp4", ".mkv", ".avi", ".mov", ".wmv", ".flv", ".webm", ".m4v" };
        var extension = Path.GetExtension(filename).ToLower();

        if (videoExtensions.Contains(extension))
            return "video";

        return "unknown";
    }

    private bool IsMediaFile(string filename)
    {
        var mediaExtensions = new[] { ".mp4", ".mkv", ".avi", ".mov", ".wmv", ".flv", ".webm", ".m4v", ".mp3", ".flac", ".wav" };
        var extension = Path.GetExtension(filename).ToLower();
        return mediaExtensions.Contains(extension);
    }

    /// <summary>
    /// Searches directory results for a specific query.
    /// </summary>
    public List<SearchResult> FilterResults(List<SearchResult> results, string query)
    {
        if (string.IsNullOrWhiteSpace(query))
            return results;

        var queryLower = query.ToLower();
        return results.Where(r => 
            r.Title.ToLower().Contains(queryLower) ||
            r.FilePath.ToLower().Contains(queryLower)
        ).ToList();
    }
}
