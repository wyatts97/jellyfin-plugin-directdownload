# Direct Download Plugin - Installation & Usage Guide

## Quick Installation

### 1. Add Plugin Repository to Jellyfin

1. Open Jellyfin web interface
2. Go to **Dashboard** → **Plugins** → **Repositories**
3. Click the **+** button
4. Enter:
   - **Repository Name**: `Direct Download Plugin`
   - **Repository URL**: `https://raw.githubusercontent.com/wyatts97/jellyfin-plugin-directdownload/master/repository.json`
5. Click **Save**

### 2. Install the Plugin

1. Go to **Dashboard** → **Plugins** → **Catalog**
2. Find **"Direct Download"** in the list
3. Click **Install**
4. **Restart Jellyfin** when prompted

### 3. Configure Library Paths (REQUIRED)

After installation, you MUST configure where downloads should go:

1. Go to **Dashboard** → **Plugins** → **Direct Download** → **Settings**
2. Or use the dedicated search page (see below)
3. Add library paths for your media:
   - Movies: `/media/movies` (or your path)
   - TV Shows: `/media/tvshows` (or your path)
   - etc.

## How to Use

### Option 1: Dedicated Search Page (Recommended)

1. Go to **Dashboard** → **Plugins** → **Direct Download**
2. Click **"Direct Download Search"** in the plugin menu
3. Enter your search query (e.g., "Avatar 2022")
4. Click **Search**
5. Browse results and click **Download to Library**
6. Select destination folder (Movies, TV Shows, etc.)
7. Download starts automatically on the server

### Option 2: Search Button on Item Pages (with JS Injector)

If you have the **JS Injector** plugin installed:

1. Install JS Injector from: `https://raw.githubusercontent.com/n00bcodr/jellyfin-plugins/main/10.11/manifest.json`
2. Go to **Dashboard** → **Plugins** → **JS Injector**
3. Add new script:
   - **Name**: `Direct Download`
   - **Script URL**: `http://your-server:8096/DirectDownload/injector/directdownload.js`
4. Save and refresh Jellyfin

Now a **"Search Downloads"** button appears on every movie/TV show detail page!

### Option 3: Direct API Access

For advanced users or automation:

```bash
# Search
curl "http://your-server:8096/DirectDownload/Search?query=avatar"

# Start download
curl -X POST "http://your-server:8096/DirectDownload/Download/start" \
  -H "Content-Type: application/json" \
  -d '{
    "Url": "https://site.com/file.mkv",
    "FileName": "Movie.2023.1080p.mkv",
    "LibraryPath": {
      "Name": "Movies",
      "Type": "Movies",
      "Path": "/media/movies"
    },
    "MediaType": "movie",
    "Quality": "1080p"
  }'
```

## Features

### Server-Side Downloads
- Files download directly to Jellyfin server (not your browser)
- Downloads go straight into library folders
- Automatic library scanning after completion
- Real-time progress tracking

### Library Integration
- Configure multiple library paths (Movies, TV Shows, 4K, etc.)
- Select destination before each download
- Files automatically organized
- Jellyfin detects new media immediately

### Search Capabilities
- Browse directory listings from direct download sites
- Recursive directory traversal (up to 3 levels)
- Smart filtering by quality, file type, date
- Support for Apache/nginx directory listings

### Download Management
- Up to 3 concurrent downloads (configurable)
- Real-time progress monitoring
- Download speed and ETA display
- Cancel downloads anytime
- Download history tracking

## Configuration

### Plugin Settings

Access via **Dashboard** → **Plugins** → **Direct Download** → **Settings**:

- **Max Results per Source**: Limit search results (default: 10)
- **Preferred Quality**: Set default quality preference
- **Search Timeout**: Max time for searches (default: 30s)
- **Enable Caching**: Cache search results (default: enabled)
- **Max Concurrent Downloads**: Simultaneous downloads (default: 3)
- **Auto Scan After Download**: Auto-scan library (default: enabled)

### Adding Direct Download Sites

Edit `Services/SearchService.cs`:

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
    // Add your site here
    new DownloadSource
    {
        Name = "YourSite",
        BaseUrl = "https://your-site.com",
        SearchEndpoint = "/",
        IsEnabled = true,
        Priority = 2
    }
};
```

## Troubleshooting

### Plugin Won't Install
- Verify repository URL is correct
- Check that repository.json is accessible in browser
- Ensure Jellyfin version is 10.8.0 or higher
- Check Jellyfin logs for errors

### No Search Results
- Verify the direct download site is accessible
- Check site uses standard directory listing format
- Increase search timeout in settings
- Check Jellyfin logs for errors

### Downloads Not Starting
- Ensure library paths are configured
- Verify Jellyfin has write permissions to library folders
- Check download controller logs
- Ensure paths are absolute (e.g., `/media/movies` not `~/movies`)

### Search Button Not Appearing
- Install JS Injector plugin
- Add the injector script URL
- Refresh Jellyfin web interface
- Check browser console for JavaScript errors

### Files Not Appearing in Library
- Verify download completed successfully
- Check file was saved to correct library path
- Manually trigger library scan if needed
- Ensure file format is supported by Jellyfin

## API Endpoints

### Search
- `GET /DirectDownload/Search?query={query}` - Search all sources
- `GET /DirectDownload/Search/{source}?query={query}` - Search specific source
- `GET /DirectDownload/Search/sources` - Get available sources
- `GET /DirectDownload/Search/test/{source}` - Test source connectivity

### Downloads
- `POST /DirectDownload/Download/start` - Start new download
- `GET /DirectDownload/Download/status/{taskId}` - Get download status
- `GET /DirectDownload/Download/active` - Get active downloads
- `GET /DirectDownload/Download/all` - Get all downloads
- `POST /DirectDownload/Download/cancel/{taskId}` - Cancel download

### Library Paths
- `GET /DirectDownload/Download/library-paths` - Get configured paths
- `POST /DirectDownload/Download/library-paths` - Add/update path
- `DELETE /DirectDownload/Download/library-paths/{name}` - Delete path

## Security Notes

- Only use HTTPS direct download sites
- Plugin does not store credentials
- Downloads happen server-side (secure)
- Users are responsible for content legality
- Rate limiting respects server limits

## Support

For issues or questions:
1. Check Jellyfin logs: **Dashboard** → **Logs**
2. Check browser console for JavaScript errors
3. Verify all prerequisites are met
4. Check GitHub issues for similar problems

## Version History

### v1.0.0 (Initial Release)
- Direct download site support with directory browsing
- Server-side downloads to library folders
- Library path selection and management
- Real-time download progress tracking
- Automatic library scanning after downloads
- Support for Apache/nginx directory listings
- Recursive directory traversal
- Modern UI with search and filtering
- JS Injector integration for seamless UI
- Dedicated dashboard search page
