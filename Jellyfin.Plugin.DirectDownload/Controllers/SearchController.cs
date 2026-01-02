using Jellyfin.Plugin.DirectDownload.Models;
using Jellyfin.Plugin.DirectDownload.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.DirectDownload.Controllers;

/// <summary>
/// Controller for handling search requests.
/// </summary>
[ApiController]
[Route("DirectDownload/[controller]")]
public class SearchController : ControllerBase
{
    private readonly ISearchService _searchService;
    private readonly ILogger<SearchController> _logger;

    public SearchController(ISearchService searchService, ILogger<SearchController> logger)
    {
        _searchService = searchService;
        _logger = logger;
    }

    /// <summary>
    /// Searches for media across all enabled sources.
    /// </summary>
    /// <param name="query">The search query.</param>
    /// <param name="mediaType">The media type (movie, series, etc.).</param>
    /// <param name="year">Optional year filter.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A list of search results.</returns>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<SearchResult>>> Search(
        [FromQuery] string query,
        [FromQuery] string mediaType = "",
        [FromQuery] int? year = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return BadRequest("Query parameter is required");
        }

        try
        {
            var results = await _searchService.SearchAsync(query, mediaType, year, cancellationToken);
            return Ok(results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during search for query: {Query}", query);
            return StatusCode(500, "Internal server error during search");
        }
    }

    /// <summary>
    /// Searches a specific source for media.
    /// </summary>
    /// <param name="sourceName">The name of the source to search.</param>
    /// <param name="query">The search query.</param>
    /// <param name="mediaType">The media type.</param>
    /// <param name="year">Optional year filter.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A list of search results from the specified source.</returns>
    [HttpGet("{sourceName}")]
    public async Task<ActionResult<IEnumerable<SearchResult>>> SearchSource(
        string sourceName,
        [FromQuery] string query,
        [FromQuery] string mediaType = "",
        [FromQuery] int? year = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return BadRequest("Query parameter is required");
        }

        try
        {
            var results = await _searchService.SearchSourceAsync(sourceName, query, mediaType, year, cancellationToken);
            return Ok(results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during search for source {SourceName} with query: {Query}", sourceName, query);
            return StatusCode(500, $"Internal server error during search for source {sourceName}");
        }
    }

    /// <summary>
    /// Gets all available download sources.
    /// </summary>
    /// <returns>A list of available download sources.</returns>
    [HttpGet("sources")]
    public ActionResult<IEnumerable<DownloadSource>> GetSources()
    {
        try
        {
            var sources = _searchService.GetAvailableSources();
            return Ok(sources);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting available sources");
            return StatusCode(500, "Internal server error while getting sources");
        }
    }

    /// <summary>
    /// Tests if a source is accessible and working.
    /// </summary>
    /// <param name="sourceName">The name of the source to test.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>True if the source is accessible, false otherwise.</returns>
    [HttpGet("test/{sourceName}")]
    public async Task<ActionResult<bool>> TestSource(string sourceName, CancellationToken cancellationToken = default)
    {
        try
        {
            var isWorking = await _searchService.TestSourceAsync(sourceName, cancellationToken);
            return Ok(isWorking);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing source {SourceName}", sourceName);
            return StatusCode(500, $"Internal server error while testing source {sourceName}");
        }
    }
}
