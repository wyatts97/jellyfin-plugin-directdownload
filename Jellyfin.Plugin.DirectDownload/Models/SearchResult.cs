using MediaBrowser.Model.Plugins;

namespace Jellyfin.Plugin.DirectDownload.Models;

/// <summary>
/// Represents a search result from a download source.
/// </summary>
public class SearchResult
{
    /// <summary>
    /// Gets or sets the title of the media.
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the source where this result was found.
    /// </summary>
    public string Source { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the download URL or magnet link.
    /// </summary>
    public string DownloadUrl { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the file size in bytes.
    /// </summary>
    public long Size { get; set; }

    /// <summary>
    /// Gets or sets the file path on the server.
    /// </summary>
    public string FilePath { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the last modified date.
    /// </summary>
    public DateTime LastModified { get; set; }

    /// <summary>
    /// Gets or sets the video quality (e.g., "1080p", "4K").
    /// </summary>
    public string Quality { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the media type (movie, series, etc.).
    /// </summary>
    public string MediaType { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the release year.
    /// </summary>
    public int Year { get; set; }

    /// <summary>
    /// Gets or sets the IMDb ID if available.
    /// </summary>
    public string? ImdbId { get; set; }

    /// <summary>
    /// Gets or sets whether this is a directory.
    /// </summary>
    public bool IsDirectory { get; set; }

    /// <summary>
    /// Gets or sets the file extension.
    /// </summary>
    public string FileExtension { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the upload date.
    /// </summary>
    public DateTime UploadDate { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Gets or sets additional metadata.
    /// </summary>
    public Dictionary<string, object> Metadata { get; set; } = new Dictionary<string, object>();
}

/// <summary>
/// Represents a download source configuration.
/// </summary>
public class DownloadSource
{
    /// <summary>
    /// Gets or sets the source name.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the base URL for the source.
    /// </summary>
    public string BaseUrl { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets whether this source is enabled.
    /// </summary>
    public bool IsEnabled { get; set; } = true;

    /// <summary>
    /// Gets or sets the API endpoint for searching.
    /// </summary>
    public string SearchEndpoint { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the API key if required.
    /// </summary>
    public string? ApiKey { get; set; }

    /// <summary>
    /// Gets or sets the rate limit in requests per minute.
    /// </summary>
    public int RateLimitPerMinute { get; set; } = 60;

    /// <summary>
    /// Gets or sets the priority of this source (lower = higher priority).
    /// </summary>
    public int Priority { get; set; } = 1;
}
