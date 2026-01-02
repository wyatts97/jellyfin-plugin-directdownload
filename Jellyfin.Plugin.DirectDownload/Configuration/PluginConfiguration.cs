using MediaBrowser.Model.Plugins;
using Jellyfin.Plugin.DirectDownload.Models;

namespace Jellyfin.Plugin.DirectDownload.Configuration;

public class PluginConfiguration : BasePluginConfiguration
{
    /// <summary>
    /// Gets or sets the enabled download sources.
    /// </summary>
    public List<string> EnabledSources { get; set; } = new List<string>();

    /// <summary>
    /// Gets or sets the maximum number of search results per source.
    /// </summary>
    public int MaxResultsPerSource { get; set; } = 10;

    /// <summary>
    /// Gets or sets the preferred video quality.
    /// </summary>
    public string PreferredQuality { get; set; } = "1080p";

    /// <summary>
    /// Gets or sets the minimum seeders required.
    /// </summary>
    public int MinimumSeeders { get; set; } = 1;

    /// <summary>
    /// Gets or sets whether to filter by trusted uploaders only.
    /// </summary>
    public bool TrustedOnly { get; set; } = false;

    /// <summary>
    /// Gets or sets custom API keys for various sources.
    /// </summary>
    public Dictionary<string, string> ApiKeys { get; set; } = new Dictionary<string, string>();

    /// <summary>
    /// Gets or sets the search timeout in seconds.
    /// </summary>
    public int SearchTimeoutSeconds { get; set; } = 30;

    /// <summary>
    /// Gets or sets whether to enable caching of search results.
    /// </summary>
    public bool EnableCaching { get; set; } = true;

    /// <summary>
    /// Gets or sets the cache duration in hours.
    /// </summary>
    public int CacheDurationHours { get; set; } = 24;

    /// <summary>
    /// Gets or sets the configured library paths for downloads.
    /// </summary>
    public List<LibraryPath> LibraryPaths { get; set; } = new List<LibraryPath>();

    /// <summary>
    /// Gets or sets the maximum concurrent downloads.
    /// </summary>
    public int MaxConcurrentDownloads { get; set; } = 3;

    /// <summary>
    /// Gets or sets whether to automatically scan library after downloads.
    /// </summary>
    public bool AutoScanAfterDownload { get; set; } = true;
}
