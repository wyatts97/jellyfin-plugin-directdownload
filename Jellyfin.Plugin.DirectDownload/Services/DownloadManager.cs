using Jellyfin.Plugin.DirectDownload.Models;
using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;
using System.Net.Http;

namespace Jellyfin.Plugin.DirectDownload.Services;

/// <summary>
/// Manages server-side downloads with progress tracking and library integration.
/// </summary>
public class DownloadManager : IDownloadManager
{
    private readonly ILogger<DownloadManager> _logger;
    private readonly HttpClient _httpClient;
    private readonly ConcurrentDictionary<string, DownloadTask> _downloadTasks;
    private readonly ConcurrentDictionary<string, CancellationTokenSource> _cancellationTokens;
    private readonly SemaphoreSlim _downloadSemaphore;

    public DownloadManager(ILogger<DownloadManager> logger, HttpClient httpClient)
    {
        _logger = logger;
        _httpClient = httpClient;
        _downloadTasks = new ConcurrentDictionary<string, DownloadTask>();
        _cancellationTokens = new ConcurrentDictionary<string, CancellationTokenSource>();
        _downloadSemaphore = new SemaphoreSlim(3); // Max 3 concurrent downloads
    }

    /// <inheritdoc />
    public Task<string> StartDownloadAsync(string url, string fileName, LibraryPath libraryPath, string mediaType, string quality, CancellationToken cancellationToken = default)
    {
        var task = new DownloadTask
        {
            DownloadUrl = url,
            FileName = fileName,
            DestinationPath = Path.Combine(libraryPath.Path, fileName),
            LibraryType = libraryPath.Type,
            MediaType = mediaType,
            Quality = quality,
            Status = DownloadStatus.Queued
        };

        _downloadTasks[task.TaskId] = task;
        _logger.LogInformation("Queued download: {FileName} to {Path}", fileName, task.DestinationPath);

        // Start download in background
        _ = Task.Run(async () => await PerformDownloadAsync(task), cancellationToken);

        return Task.FromResult(task.TaskId);
    }

    private async Task PerformDownloadAsync(DownloadTask task)
    {
        var cts = new CancellationTokenSource();
        _cancellationTokens[task.TaskId] = cts;

        try
        {
            await _downloadSemaphore.WaitAsync(cts.Token);

            task.Status = DownloadStatus.Downloading;
            task.StartTime = DateTime.UtcNow;

            _logger.LogInformation("Starting download: {FileName}", task.FileName);

            // Ensure directory exists
            var directory = Path.GetDirectoryName(task.DestinationPath);
            if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory);
            }

            // Download with progress tracking
            using var response = await _httpClient.GetAsync(task.DownloadUrl, HttpCompletionOption.ResponseHeadersRead, cts.Token);
            response.EnsureSuccessStatusCode();

            task.TotalBytes = response.Content.Headers.ContentLength ?? 0;

            using var contentStream = await response.Content.ReadAsStreamAsync(cts.Token);
            using var fileStream = new FileStream(task.DestinationPath, FileMode.Create, FileAccess.Write, FileShare.None, 8192, true);

            var buffer = new byte[8192];
            var totalBytesRead = 0L;
            var lastProgressUpdate = DateTime.UtcNow;
            var bytesReadSinceLastUpdate = 0L;

            int bytesRead;
            while ((bytesRead = await contentStream.ReadAsync(buffer, 0, buffer.Length, cts.Token)) > 0)
            {
                await fileStream.WriteAsync(buffer, 0, bytesRead, cts.Token);
                totalBytesRead += bytesRead;
                bytesReadSinceLastUpdate += bytesRead;
                task.DownloadedBytes = totalBytesRead;

                // Update progress every second
                var now = DateTime.UtcNow;
                if ((now - lastProgressUpdate).TotalSeconds >= 1)
                {
                    task.Progress = task.TotalBytes > 0 ? (double)totalBytesRead / task.TotalBytes * 100 : 0;
                    task.SpeedBytesPerSecond = (long)(bytesReadSinceLastUpdate / (now - lastProgressUpdate).TotalSeconds);
                    
                    _logger.LogDebug("Download progress: {FileName} - {Progress:F2}% ({Speed} KB/s)", 
                        task.FileName, task.Progress, task.SpeedBytesPerSecond / 1024);

                    lastProgressUpdate = now;
                    bytesReadSinceLastUpdate = 0;
                }
            }

            task.Status = DownloadStatus.Completed;
            task.Progress = 100;
            task.CompletionTime = DateTime.UtcNow;

            _logger.LogInformation("Download completed: {FileName}", task.FileName);

            // Trigger library scan
            var libraryPath = new LibraryPath
            {
                Path = Path.GetDirectoryName(task.DestinationPath) ?? string.Empty,
                Type = task.LibraryType
            };
            await TriggerLibraryScanAsync(libraryPath);
        }
        catch (OperationCanceledException)
        {
            task.Status = DownloadStatus.Cancelled;
            task.ErrorMessage = "Download was cancelled";
            _logger.LogInformation("Download cancelled: {FileName}", task.FileName);

            // Clean up partial file
            if (File.Exists(task.DestinationPath))
            {
                try
                {
                    File.Delete(task.DestinationPath);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to delete partial file: {Path}", task.DestinationPath);
                }
            }
        }
        catch (Exception ex)
        {
            task.Status = DownloadStatus.Failed;
            task.ErrorMessage = ex.Message;
            _logger.LogError(ex, "Download failed: {FileName}", task.FileName);
        }
        finally
        {
            _downloadSemaphore.Release();
            _cancellationTokens.TryRemove(task.TaskId, out _);
        }
    }

    /// <inheritdoc />
    public DownloadTask? GetDownloadStatus(string taskId)
    {
        return _downloadTasks.TryGetValue(taskId, out var task) ? task : null;
    }

    /// <inheritdoc />
    public IEnumerable<DownloadTask> GetActiveDownloads()
    {
        return _downloadTasks.Values.Where(t => 
            t.Status == DownloadStatus.Queued || 
            t.Status == DownloadStatus.Downloading || 
            t.Status == DownloadStatus.Paused);
    }

    /// <inheritdoc />
    public IEnumerable<DownloadTask> GetAllDownloads()
    {
        return _downloadTasks.Values.OrderByDescending(t => t.StartTime);
    }

    /// <inheritdoc />
    public Task<bool> CancelDownloadAsync(string taskId)
    {
        if (_cancellationTokens.TryGetValue(taskId, out var cts))
        {
            cts.Cancel();
            _logger.LogInformation("Cancelling download: {TaskId}", taskId);
            return Task.FromResult(true);
        }

        return Task.FromResult(false);
    }

    /// <inheritdoc />
    public Task<bool> PauseDownloadAsync(string taskId)
    {
        // Pausing would require more complex implementation with resumable downloads
        // For now, we'll just cancel and allow re-download
        _logger.LogWarning("Pause not fully implemented, use cancel instead");
        return Task.FromResult(false);
    }

    /// <inheritdoc />
    public Task<bool> ResumeDownloadAsync(string taskId)
    {
        // Resume would require HTTP range requests support
        _logger.LogWarning("Resume not fully implemented");
        return Task.FromResult(false);
    }

    /// <inheritdoc />
    public Task<IEnumerable<LibraryPath>> GetLibraryPathsAsync()
    {
        // This would integrate with Jellyfin's library manager
        // For now, return common library paths from configuration
        var paths = new List<LibraryPath>();

        try
        {
            var config = Plugin.Instance?.Configuration;
            if (config?.LibraryPaths != null && config.LibraryPaths.Any())
            {
                paths.AddRange(config.LibraryPaths);
            }
            else
            {
                // Provide default paths if none configured
                paths.Add(new LibraryPath
                {
                    Name = "Movies",
                    Type = "Movies",
                    Path = "/media/movies",
                    IsDefault = true
                });
                paths.Add(new LibraryPath
                {
                    Name = "TV Shows",
                    Type = "TV Shows",
                    Path = "/media/tvshows",
                    IsDefault = false
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting library paths");
        }

        return Task.FromResult<IEnumerable<LibraryPath>>(paths);
    }

    /// <inheritdoc />
    public Task<bool> TriggerLibraryScanAsync(LibraryPath libraryPath)
    {
        try
        {
            _logger.LogInformation("Triggering library scan for: {Path}", libraryPath.Path);
            
            // This would integrate with Jellyfin's ILibraryManager
            // For now, just log the action
            // In a full implementation, you would call:
            // await _libraryManager.ValidateMediaLibrary(new Progress<double>(), cancellationToken);
            
            return Task.FromResult(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error triggering library scan");
            return Task.FromResult(false);
        }
    }

    /// <summary>
    /// Cleans up old completed/failed downloads from memory.
    /// </summary>
    public void CleanupOldDownloads(TimeSpan olderThan)
    {
        var cutoffTime = DateTime.UtcNow - olderThan;
        var oldTasks = _downloadTasks.Values
            .Where(t => (t.Status == DownloadStatus.Completed || t.Status == DownloadStatus.Failed) 
                        && t.StartTime < cutoffTime)
            .Select(t => t.TaskId)
            .ToList();

        foreach (var taskId in oldTasks)
        {
            _downloadTasks.TryRemove(taskId, out _);
        }

        if (oldTasks.Any())
        {
            _logger.LogInformation("Cleaned up {Count} old download tasks", oldTasks.Count);
        }
    }
}
