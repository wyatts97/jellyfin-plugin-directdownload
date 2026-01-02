using Jellyfin.Plugin.DirectDownload.Models;

namespace Jellyfin.Plugin.DirectDownload.Services;

/// <summary>
/// Interface for managing server-side downloads.
/// </summary>
public interface IDownloadManager
{
    /// <summary>
    /// Starts a new download task.
    /// </summary>
    /// <param name="url">The download URL.</param>
    /// <param name="fileName">The file name.</param>
    /// <param name="libraryPath">The target library path.</param>
    /// <param name="mediaType">The media type.</param>
    /// <param name="quality">The quality.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The download task ID.</returns>
    Task<string> StartDownloadAsync(string url, string fileName, LibraryPath libraryPath, string mediaType, string quality, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the status of a download task.
    /// </summary>
    /// <param name="taskId">The task ID.</param>
    /// <returns>The download task.</returns>
    DownloadTask? GetDownloadStatus(string taskId);

    /// <summary>
    /// Gets all active download tasks.
    /// </summary>
    /// <returns>List of active download tasks.</returns>
    IEnumerable<DownloadTask> GetActiveDownloads();

    /// <summary>
    /// Gets all download tasks (active and completed).
    /// </summary>
    /// <returns>List of all download tasks.</returns>
    IEnumerable<DownloadTask> GetAllDownloads();

    /// <summary>
    /// Cancels a download task.
    /// </summary>
    /// <param name="taskId">The task ID.</param>
    /// <returns>True if cancelled successfully.</returns>
    Task<bool> CancelDownloadAsync(string taskId);

    /// <summary>
    /// Pauses a download task.
    /// </summary>
    /// <param name="taskId">The task ID.</param>
    /// <returns>True if paused successfully.</returns>
    Task<bool> PauseDownloadAsync(string taskId);

    /// <summary>
    /// Resumes a paused download task.
    /// </summary>
    /// <param name="taskId">The task ID.</param>
    /// <returns>True if resumed successfully.</returns>
    Task<bool> ResumeDownloadAsync(string taskId);

    /// <summary>
    /// Gets available library paths from Jellyfin.
    /// </summary>
    /// <returns>List of library paths.</returns>
    Task<IEnumerable<LibraryPath>> GetLibraryPathsAsync();

    /// <summary>
    /// Triggers a library scan after download completion.
    /// </summary>
    /// <param name="libraryPath">The library path to scan.</param>
    /// <returns>True if scan triggered successfully.</returns>
    Task<bool> TriggerLibraryScanAsync(LibraryPath libraryPath);
}
