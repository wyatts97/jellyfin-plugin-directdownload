# Jellyfin Direct Download Plugin

A Jellyfin plugin that enables searching and downloading media from direct download sites with directory browsing capabilities.

## Features

- **Direct Download Site Support**: Browse and search directory listings from direct download sites
- **Intelligent Directory Parsing**: Automatically parses Apache, nginx, and generic HTML directory listings
- **Recursive Directory Browsing**: Searches through subdirectories to find media files
- **Modern UI**: Clean, responsive interface integrated into Jellyfin
- **Smart Filtering**: Filter by quality, file type, and search terms
- **Direct Downloads**: One-click downloads without torrent clients

## Supported Sites

Currently configured for:
- **111477.xyz** (a.111477.xyz)

Additional direct download sites can be easily added (see Configuration section).

## Installation

### Prerequisites
- Jellyfin Server 10.8.x or higher
- .NET 6.0 SDK (for building)

### Building the Plugin

1. Clone or download this repository
2. Navigate to the plugin directory:
   ```bash
   cd Jellyfin.Plugin.DirectDownload
   ```

3. Build the plugin:
   ```bash
   dotnet build -c Release
   ```

4. The compiled DLL will be in `bin/Release/net6.0/`

### Installing in Jellyfin

1. Copy the compiled `Jellyfin.Plugin.DirectDownload.dll` to your Jellyfin plugins directory:
   - **Windows**: `%AppData%\Jellyfin\Server\plugins\DirectDownload\`
   - **Linux**: `/var/lib/jellyfin/plugins/DirectDownload/`
   - **Docker**: `/config/plugins/DirectDownload/`

2. Restart Jellyfin Server

3. Navigate to Dashboard → Plugins to verify installation

## Usage

### Searching for Media

1. **From Item Detail Page**: Click the "Search Downloads" button on any movie or TV show detail page
2. **From Dashboard**: Access the Direct Download menu item in the admin dashboard
3. **Enter Search Query**: Type the media title you're looking for
4. **Browse Results**: View files with size, quality, and date information
5. **Download**: Click the download button to select destination and start downloading

### Download Process

When you click the download button:

1. **Library Path Selection Modal** appears showing your configured library paths
2. **Choose Destination**: Select where the file should be downloaded:
   - Movies library
   - TV Shows library
   - Custom paths you've configured
3. **Server-Side Download**: The Jellyfin server downloads the file directly to the selected library path
4. **Progress Tracking**: Monitor download progress, speed, and status in real-time
5. **Automatic Library Scan**: Jellyfin automatically scans the library after download completes

### Key Features

- **Server-Side Downloads**: Files are downloaded by Jellyfin server, not your browser
- **Library Integration**: Files go directly into your Jellyfin library folders
- **Multiple Library Paths**: Configure separate paths for Movies, TV Shows, etc.
- **Download Queue**: Track multiple downloads with progress bars
- **Automatic Organization**: Files are placed in the correct library automatically
- **Progress Monitoring**: Real-time download speed, progress, and ETA
- **Concurrent Downloads**: Up to 3 simultaneous downloads (configurable)

### Search Features

- **Automatic Directory Browsing**: The plugin recursively searches through directories up to 3 levels deep
- **Smart Filtering**: Results are filtered by your search query and sorted by date
- **File Information**: See file size, quality (1080p, 4K, etc.), extension, and last modified date
- **Copy Links**: Copy direct download URLs to clipboard for use in download managers

## Configuration

### Plugin Settings

Access plugin settings via Dashboard → Plugins → Direct Download → Settings:

- **Maximum Results per Source**: Limit the number of results returned (default: 10)
- **Preferred Quality**: Set preferred video quality (480p, 720p, 1080p, 4K)
- **Search Timeout**: Maximum time for search requests in seconds (default: 30)
- **Enable Caching**: Cache search results for better performance (default: enabled)
- **Cache Duration**: How long to cache results in hours (default: 24)
- **Max Concurrent Downloads**: Maximum simultaneous downloads (default: 3)
- **Auto Scan After Download**: Automatically scan library after downloads complete (default: enabled)

### Configuring Library Paths

**IMPORTANT**: You must configure library paths to tell the plugin where to download files.

#### Method 1: Through the UI

1. Click any download button
2. In the library path selection modal, click "Add Custom Path"
3. Fill in:
   - **Library Name**: e.g., "Movies", "TV Shows 4K"
   - **Library Type**: Movies, TV Shows, Music, or Other
   - **File System Path**: Full path where files should be downloaded
     - Windows: `C:\Media\Movies`
     - Linux: `/media/movies`
     - Docker: `/data/movies` (or your mapped path)
   - **Set as Default**: Check if this should be the default for this type
4. Click "Save Path"

#### Method 2: Through Configuration File

Edit the plugin configuration JSON directly:

```json
{
  "LibraryPaths": [
    {
      "Name": "Movies",
      "Type": "Movies",
      "Path": "/media/movies",
      "IsDefault": true
    },
    {
      "Name": "TV Shows",
      "Type": "TV Shows",
      "Path": "/media/tvshows",
      "IsDefault": false
    },
    {
      "Name": "Movies 4K",
      "Type": "Movies",
      "Path": "/media/movies-4k",
      "IsDefault": false
    }
  ]
}
```

#### Path Requirements

- Paths must be **absolute** (full path from root)
- Jellyfin server must have **write permissions** to these directories
- Paths should point to your Jellyfin library folders
- Use forward slashes `/` even on Windows (or escaped backslashes `\\`)

### Managing Downloads

#### Viewing Active Downloads

1. After starting a download, the progress modal opens automatically
2. View real-time progress for all active downloads:
   - Download speed (MB/s)
   - Progress percentage
   - Downloaded / Total size
   - Destination library
   - Status (Queued, Downloading, Completed, Failed)

#### Cancelling Downloads

- Click the "Cancel" button on any active download
- Partial files are automatically cleaned up

#### Download History

- Access via API: `GET /DirectDownload/Download/all`
- Shows completed, failed, and cancelled downloads
- Includes completion times and error messages

### Adding More Direct Download Sites

To add additional direct download sites, edit `Services/SearchService.cs`:

```csharp
private readonly List<DownloadSource> _defaultSources = new()
{
    new DownloadSource
    {
        Name = "111477",
        BaseUrl = "https://a.111477.xyz",
        SearchEndpoint = "/",
        IsEnabled = true,
        Priority = 1
    },
    // Add your new source here:
    new DownloadSource
    {
        Name = "YourSiteName",
        BaseUrl = "https://your-site.com",
        SearchEndpoint = "/",
        IsEnabled = true,
        Priority = 2
    }
};
```

The plugin will automatically:
- Parse the directory structure
- Extract file information (name, size, date)
- Detect video quality from filenames
- Filter media files from other content

### Supported Directory Listing Formats

The plugin can parse:
- **Apache-style** directory listings
- **nginx-style** directory listings
- **Generic HTML** links to files

## Architecture

### Backend Components

- **DirectoryParser**: Parses HTML directory listings and extracts file information
- **SearchService**: Manages search operations and directory browsing
- **SearchController**: REST API endpoints for frontend communication
- **Models**: Data structures for search results and download sources

### Frontend Components

- **plugin.js**: Main entry point and UI management
- **search/api.js**: API communication layer
- **search/ui.js**: Search interface components
- **download/manager.js**: Download handling and history
- **ui/modal.js**: Reusable modal components
- **utils/formatting.js**: Utility functions

## API Endpoints

### Search Endpoints

- `GET /DirectDownload/Search?query={query}` - Search all sources
- `GET /DirectDownload/Search/{sourceName}?query={query}` - Search specific source
- `GET /DirectDownload/Search/sources` - Get available sources
- `GET /DirectDownload/Search/test/{sourceName}` - Test source availability

### Download Endpoints

- `POST /DirectDownload/Download/start` - Start a new download
  ```json
  {
    "Url": "https://site.com/file.mkv",
    "FileName": "Movie.2023.1080p.mkv",
    "LibraryPath": {
      "Name": "Movies",
      "Type": "Movies",
      "Path": "/media/movies"
    },
    "MediaType": "movie",
    "Quality": "1080p"
  }
  ```
- `GET /DirectDownload/Download/status/{taskId}` - Get download status
- `GET /DirectDownload/Download/active` - Get all active downloads
- `GET /DirectDownload/Download/all` - Get all downloads (including completed)
- `POST /DirectDownload/Download/cancel/{taskId}` - Cancel a download
- `GET /DirectDownload/Download/library-paths` - Get configured library paths
- `POST /DirectDownload/Download/library-paths` - Add/update library path
- `DELETE /DirectDownload/Download/library-paths/{name}` - Delete library path

## Troubleshooting

### Plugin Not Loading

1. Verify the DLL is in the correct plugins directory
2. Check Jellyfin logs for errors: `Dashboard → Logs`
3. Ensure .NET 6.0 runtime is installed
4. Restart Jellyfin Server

### No Search Results

1. Check if the direct download site is accessible
2. Test source connectivity: Settings → Test Sources
3. Verify the site uses standard directory listing format
4. Check search timeout settings (increase if needed)

### Downloads Not Starting

1. Ensure popup blockers are disabled
2. Check browser console for JavaScript errors
3. Verify the download URL is accessible
4. Try copying the link and using a download manager

## Security Considerations

- **HTTPS Only**: Only use HTTPS sites for security
- **Rate Limiting**: The plugin respects server rate limits
- **User Responsibility**: Users are responsible for the legality of downloaded content
- **No Authentication**: Plugin does not store or transmit credentials

## Development

### Project Structure

```
Jellyfin.Plugin.DirectDownload/
├── Configuration/          # Plugin configuration
├── Controllers/           # API controllers
├── Models/               # Data models
├── Services/             # Business logic
│   ├── DirectoryParser.cs
│   ├── ISearchService.cs
│   └── SearchService.cs
├── js/                   # Frontend JavaScript
│   ├── plugin.js
│   ├── search/
│   ├── download/
│   ├── ui/
│   └── utils/
└── Plugin.cs            # Main plugin class
```

### Building from Source

```bash
# Restore dependencies
dotnet restore

# Build
dotnet build -c Release

# Run tests (if available)
dotnet test
```

## Contributing

Contributions are welcome! To add support for new directory listing formats:

1. Update `DirectoryParser.cs` with new parsing logic
2. Add tests for the new format
3. Update documentation

## License

This plugin is provided as-is for educational and personal use.

## Disclaimer

This plugin is designed to work with legal direct download sources. Users are responsible for ensuring they have the right to download and use any content accessed through this plugin. The developers are not responsible for any misuse of this software.

## Support

For issues, questions, or feature requests, please check:
- Jellyfin plugin documentation
- Plugin logs in Jellyfin Dashboard
- Browser console for frontend errors

## Version History

### v1.0.0
- Initial release
- Support for direct download sites with directory browsing
- Apache/nginx directory listing parsing
- Modern UI with search and filtering
- Recursive directory traversal (up to 3 levels)
- File information extraction (size, quality, date)
