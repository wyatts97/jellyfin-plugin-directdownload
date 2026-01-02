using Jellyfin.Plugin.DirectDownload.Models;

namespace Jellyfin.Plugin.DirectDownload.Services;

/// <summary>
/// Interface for searching download sources.
/// </summary>
public interface ISearchService
{
    /// <summary>
    /// Searches for media across all enabled sources.
    /// </summary>
    /// <param name="query">The search query.</param>
    /// <param name="mediaType">The media type (movie, series, etc.).</param>
    /// <param name="year">Optional year filter.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A list of search results.</returns>
    Task<IEnumerable<SearchResult>> SearchAsync(string query, string mediaType = "", int? year = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Searches a specific source for media.
    /// </summary>
    /// <param name="sourceName">The name of the source to search.</param>
    /// <param name="query">The search query.</param>
    /// <param name="mediaType">The media type.</param>
    /// <param name="year">Optional year filter.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A list of search results from the specified source.</returns>
    Task<IEnumerable<SearchResult>> SearchSourceAsync(string sourceName, string query, string mediaType = "", int? year = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all available download sources.
    /// </summary>
    /// <returns>A list of available download sources.</returns>
    IEnumerable<DownloadSource> GetAvailableSources();

    /// <summary>
    /// Tests if a source is accessible and working.
    /// </summary>
    /// <param name="sourceName">The name of the source to test.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>True if the source is accessible, false otherwise.</returns>
    Task<bool> TestSourceAsync(string sourceName, CancellationToken cancellationToken = default);
}
