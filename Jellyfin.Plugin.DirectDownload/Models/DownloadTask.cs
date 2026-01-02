using System;

namespace Jellyfin.Plugin.DirectDownload.Models;

/// <summary>
/// Represents a download task with progress tracking.
/// </summary>
public class DownloadTask
{
    /// <summary>
    /// Gets or sets the unique task ID.
    /// </summary>
    public string TaskId { get; set; } = Guid.NewGuid().ToString();

    /// <summary>
    /// Gets or sets the download URL.
    /// </summary>
    public string DownloadUrl { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the file name.
    /// </summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the destination path.
    /// </summary>
    public string DestinationPath { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the library path type (Movies, TV Shows, etc.).
    /// </summary>
    public string LibraryType { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the download status.
    /// </summary>
    public DownloadStatus Status { get; set; } = DownloadStatus.Queued;

    /// <summary>
    /// Gets or sets the progress percentage (0-100).
    /// </summary>
    public double Progress { get; set; } = 0;

    /// <summary>
    /// Gets or sets the total bytes to download.
    /// </summary>
    public long TotalBytes { get; set; } = 0;

    /// <summary>
    /// Gets or sets the downloaded bytes.
    /// </summary>
    public long DownloadedBytes { get; set; } = 0;

    /// <summary>
    /// Gets or sets the download speed in bytes per second.
    /// </summary>
    public long SpeedBytesPerSecond { get; set; } = 0;

    /// <summary>
    /// Gets or sets the start time.
    /// </summary>
    public DateTime StartTime { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Gets or sets the completion time.
    /// </summary>
    public DateTime? CompletionTime { get; set; }

    /// <summary>
    /// Gets or sets the error message if failed.
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Gets or sets the media type (movie, episode, etc.).
    /// </summary>
    public string MediaType { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the quality.
    /// </summary>
    public string Quality { get; set; } = string.Empty;
}

/// <summary>
/// Download status enumeration.
/// </summary>
public enum DownloadStatus
{
    Queued,
    Downloading,
    Completed,
    Failed,
    Cancelled,
    Paused
}

/// <summary>
/// Library path configuration.
/// </summary>
public class LibraryPath
{
    /// <summary>
    /// Gets or sets the library name.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the library type (Movies, TV Shows, Music, etc.).
    /// </summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the file system path.
    /// </summary>
    public string Path { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets whether this is the default path for this type.
    /// </summary>
    public bool IsDefault { get; set; } = false;

    /// <summary>
    /// Gets or sets the library ID in Jellyfin.
    /// </summary>
    public string? LibraryId { get; set; }
}
