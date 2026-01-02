# Setting Up Your Jellyfin Plugin Repository

This guide will help you publish your Direct Download plugin so users can install it through Jellyfin's plugin repository system.

## Prerequisites

- GitHub account
- Git installed on your computer
- Your plugin code ready

## Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it: `jellyfin-plugin-directdownload` (or your preferred name)
3. Make it **Public** (required for Jellyfin plugin repositories)
4. Don't initialize with README (we already have one)

## Step 2: Push Your Code to GitHub

```bash
cd c:/Users/User/Desktop/JellyDirect

# Initialize git repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Direct Download plugin v1.0.0"

# Add your GitHub repository as remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/jellyfin-plugin-directdownload.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Update manifest.json

Before creating a release, update `manifest.json`:

1. Replace `YOUR_USERNAME` with your actual GitHub username in the `sourceUrl`
2. The URL should be: `https://github.com/YOUR_USERNAME/jellyfin-plugin-directdownload/releases/download/v1.0.0/Jellyfin.Plugin.DirectDownload.zip`

## Step 4: Create a Release

### Option A: Using GitHub Web Interface

1. Go to your repository on GitHub
2. Click "Releases" → "Create a new release"
3. Tag: `v1.0.0`
4. Title: `Direct Download Plugin v1.0.0`
5. Description: Copy from the changelog in manifest.json
6. Click "Publish release"

The GitHub Action will automatically:
- Build the plugin
- Create the ZIP file
- Upload it to the release
- Calculate the checksum

### Option B: Using Git Tags

```bash
# Create and push tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

The GitHub Action will trigger automatically.

## Step 5: Update manifest.json with Checksum

After the release is created:

1. Download the `Jellyfin.Plugin.DirectDownload.zip` from the release
2. Calculate MD5 checksum:
   - **Windows PowerShell**: `Get-FileHash -Algorithm MD5 Jellyfin.Plugin.DirectDownload.zip`
   - **Linux/Mac**: `md5sum Jellyfin.Plugin.DirectDownload.zip`
3. Update the `checksum` field in `manifest.json`
4. Commit and push:
   ```bash
   git add manifest.json
   git commit -m "Update checksum for v1.0.0"
   git push
   ```

## Step 6: Create Repository Manifest

Create a file that lists all your plugins (even if you only have one):

**File: `repository.json`** (in the root of your repo)

```json
[
  {
    "guid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Direct Download",
    "description": "Search and download media from direct download sites with directory browsing. Server-side downloads directly into your Jellyfin library folders with automatic organization.",
    "overview": "Direct Download plugin for Jellyfin - Browse directory listings, download files server-side to library folders",
    "owner": "JellyDirect",
    "category": "Metadata",
    "imageUrl": "https://raw.githubusercontent.com/YOUR_USERNAME/jellyfin-plugin-directdownload/main/logo.png",
    "versions": [
      {
        "version": "1.0.0.0",
        "changelog": "Initial release\n- Direct download site support with directory browsing\n- Server-side downloads to library folders\n- Library path selection and management\n- Real-time download progress tracking\n- Automatic library scanning after downloads\n- Support for Apache/nginx directory listings\n- Recursive directory traversal\n- Modern UI with search and filtering",
        "targetAbi": "10.8.0.0",
        "sourceUrl": "https://github.com/YOUR_USERNAME/jellyfin-plugin-directdownload/releases/download/v1.0.0/Jellyfin.Plugin.DirectDownload.zip",
        "checksum": "YOUR_MD5_CHECKSUM_HERE",
        "timestamp": "2026-01-02T04:25:00Z"
      }
    ]
  }
]
```

Commit and push this file:

```bash
git add repository.json
git commit -m "Add repository manifest"
git push
```

## Step 7: Get Your Repository URL

Your repository URL for Jellyfin will be:

```
https://raw.githubusercontent.com/YOUR_USERNAME/jellyfin-plugin-directdownload/main/repository.json
```

## Step 8: Add Repository to Jellyfin

Now users (including you) can add your plugin repository:

1. Open Jellyfin web interface
2. Go to **Dashboard** → **Plugins** → **Repositories**
3. Click the **+** button
4. Enter:
   - **Repository Name**: `Direct Download Plugin`
   - **Repository URL**: `https://raw.githubusercontent.com/YOUR_USERNAME/jellyfin-plugin-directdownload/main/repository.json`
5. Click **Save**
6. Go to **Catalog** tab
7. Find "Direct Download" and click **Install**
8. Restart Jellyfin

## Updating Your Plugin (Future Releases)

When you want to release a new version:

1. Update version in `build.yaml` and `Plugin.cs`
2. Update `manifest.json` and `repository.json` with new version entry
3. Commit changes
4. Create new tag: `git tag -a v1.1.0 -m "Release v1.1.0"`
5. Push tag: `git push origin v1.1.0`
6. GitHub Action builds and creates release automatically
7. Update checksum in `repository.json`
8. Users will see the update in Jellyfin's plugin catalog

## Optional: Add a Logo

Create a `logo.png` (256x256px recommended) and add it to your repository:

```bash
git add logo.png
git commit -m "Add plugin logo"
git push
```

Update the `imageUrl` in `repository.json` to point to it.

## Troubleshooting

### Build Fails on GitHub Actions

- Check that all file paths in the workflow are correct
- Ensure .NET 6.0 is specified correctly
- Check build logs in the Actions tab

### Plugin Doesn't Appear in Jellyfin Catalog

- Verify repository.json is accessible at the raw GitHub URL
- Check that the GUID matches between manifest.json and Plugin.cs
- Ensure targetAbi matches your Jellyfin version (10.8.0.0 or higher)
- Verify the JSON is valid (use jsonlint.com)

### Checksum Mismatch Error

- Recalculate the MD5 checksum of the actual ZIP file from the release
- Update repository.json with the correct checksum
- Commit and push the change

## Example Repository Structure

```
jellyfin-plugin-directdownload/
├── .github/
│   └── workflows/
│       └── build.yml
├── Jellyfin.Plugin.DirectDownload/
│   ├── Configuration/
│   ├── Controllers/
│   ├── Models/
│   ├── Services/
│   ├── js/
│   ├── Plugin.cs
│   └── Jellyfin.Plugin.DirectDownload.csproj
├── .gitignore
├── build.yaml
├── manifest.json
├── repository.json
├── README.md
└── logo.png (optional)
```

## Sharing Your Repository

Once set up, share your repository URL with users:

```
https://raw.githubusercontent.com/YOUR_USERNAME/jellyfin-plugin-directdownload/main/repository.json
```

Users add this URL to their Jellyfin plugin repositories and can install your plugin from the catalog!

## Notes

- Keep `repository.json` in the main branch (not in releases)
- The ZIP file goes in GitHub Releases
- Update checksums after every release
- Test installations on a fresh Jellyfin instance before announcing
- Consider creating a discussion/issues section for user support
