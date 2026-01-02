using Jellyfin.Plugin.DirectDownload.Models;
using Jellyfin.Plugin.DirectDownload.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.DirectDownload.Controllers;

/// <summary>
/// Controller for handling download operations.
/// </summary>
[ApiController]
[Route("DirectDownload/[controller]")]
public class DownloadController : ControllerBase
{
    private readonly IDownloadManager _downloadManager;
    private readonly ILogger<DownloadController> _logger;

    public DownloadController(IDownloadManager downloadManager, ILogger<DownloadController> logger)
    {
        _downloadManager = downloadManager;
        _logger = logger;
    }

    /// <summary>
    /// Starts a new download.
    /// </summary>
    [HttpPost("start")]
    public async Task<ActionResult<string>> StartDownload([FromBody] StartDownloadRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Url))
        {
            return BadRequest("Download URL is required");
        }

        if (string.IsNullOrWhiteSpace(request.FileName))
        {
            return BadRequest("File name is required");
        }

        if (request.LibraryPath == null)
        {
            return BadRequest("Library path is required");
        }

        try
        {
            var taskId = await _downloadManager.StartDownloadAsync(
                request.Url,
                request.FileName,
                request.LibraryPath,
                request.MediaType ?? "unknown",
                request.Quality ?? "unknown",
                cancellationToken
            );

            return Ok(new { taskId, message = "Download started successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting download for {FileName}", request.FileName);
            return StatusCode(500, "Failed to start download");
        }
    }

    /// <summary>
    /// Gets the status of a download.
    /// </summary>
    [HttpGet("status/{taskId}")]
    public ActionResult<DownloadTask> GetDownloadStatus(string taskId)
    {
        var task = _downloadManager.GetDownloadStatus(taskId);
        if (task == null)
        {
            return NotFound($"Download task {taskId} not found");
        }

        return Ok(task);
    }

    /// <summary>
    /// Gets all active downloads.
    /// </summary>
    [HttpGet("active")]
    public ActionResult<IEnumerable<DownloadTask>> GetActiveDownloads()
    {
        try
        {
            var downloads = _downloadManager.GetActiveDownloads();
            return Ok(downloads);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting active downloads");
            return StatusCode(500, "Failed to get active downloads");
        }
    }

    /// <summary>
    /// Gets all downloads (active and completed).
    /// </summary>
    [HttpGet("all")]
    public ActionResult<IEnumerable<DownloadTask>> GetAllDownloads()
    {
        try
        {
            var downloads = _downloadManager.GetAllDownloads();
            return Ok(downloads);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all downloads");
            return StatusCode(500, "Failed to get downloads");
        }
    }

    /// <summary>
    /// Cancels a download.
    /// </summary>
    [HttpPost("cancel/{taskId}")]
    public async Task<ActionResult> CancelDownload(string taskId)
    {
        try
        {
            var success = await _downloadManager.CancelDownloadAsync(taskId);
            if (success)
            {
                return Ok(new { message = "Download cancelled successfully" });
            }

            return NotFound($"Download task {taskId} not found or already completed");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling download {TaskId}", taskId);
            return StatusCode(500, "Failed to cancel download");
        }
    }

    /// <summary>
    /// Gets available library paths.
    /// </summary>
    [HttpGet("library-paths")]
    public async Task<ActionResult<IEnumerable<LibraryPath>>> GetLibraryPaths()
    {
        try
        {
            var paths = await _downloadManager.GetLibraryPathsAsync();
            return Ok(paths);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting library paths");
            return StatusCode(500, "Failed to get library paths");
        }
    }

    /// <summary>
    /// Adds or updates a library path configuration.
    /// </summary>
    [HttpPost("library-paths")]
    public ActionResult AddLibraryPath([FromBody] LibraryPath libraryPath)
    {
        if (string.IsNullOrWhiteSpace(libraryPath.Name))
        {
            return BadRequest("Library name is required");
        }

        if (string.IsNullOrWhiteSpace(libraryPath.Path))
        {
            return BadRequest("Library path is required");
        }

        try
        {
            var config = Plugin.Instance?.Configuration;
            if (config == null)
            {
                return StatusCode(500, "Plugin configuration not available");
            }

            // Check if path already exists
            var existing = config.LibraryPaths.FirstOrDefault(p => p.Name == libraryPath.Name);
            if (existing != null)
            {
                // Update existing
                existing.Path = libraryPath.Path;
                existing.Type = libraryPath.Type;
                existing.IsDefault = libraryPath.IsDefault;
            }
            else
            {
                // Add new
                config.LibraryPaths.Add(libraryPath);
            }

            Plugin.Instance.SaveConfiguration();

            return Ok(new { message = "Library path saved successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving library path");
            return StatusCode(500, "Failed to save library path");
        }
    }

    /// <summary>
    /// Deletes a library path configuration.
    /// </summary>
    [HttpDelete("library-paths/{name}")]
    public ActionResult DeleteLibraryPath(string name)
    {
        try
        {
            var config = Plugin.Instance?.Configuration;
            if (config == null)
            {
                return StatusCode(500, "Plugin configuration not available");
            }

            var path = config.LibraryPaths.FirstOrDefault(p => p.Name == name);
            if (path == null)
            {
                return NotFound($"Library path {name} not found");
            }

            config.LibraryPaths.Remove(path);
            Plugin.Instance.SaveConfiguration();

            return Ok(new { message = "Library path deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting library path");
            return StatusCode(500, "Failed to delete library path");
        }
    }
}

/// <summary>
/// Request model for starting a download.
/// </summary>
public class StartDownloadRequest
{
    public string Url { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public LibraryPath LibraryPath { get; set; } = null!;
    public string? MediaType { get; set; }
    public string? Quality { get; set; }
}
