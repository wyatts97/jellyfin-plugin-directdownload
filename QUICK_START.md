# Quick Start: Publishing Your Plugin to GitHub

Follow these steps to make your plugin installable through Jellyfin's repository system.

## 1. Create GitHub Repository

```bash
# On GitHub.com, create a new PUBLIC repository named:
# jellyfin-plugin-directdownload
```

## 2. Initialize and Push

```bash
cd c:/Users/User/Desktop/JellyDirect

git init
git add .
git commit -m "Initial commit - Direct Download plugin v1.0.0"
git remote add origin https://github.com/YOUR_USERNAME/jellyfin-plugin-directdownload.git
git branch -M main
git push -u origin main
```

## 3. Update Files with Your GitHub Username

Replace `YOUR_USERNAME` in these files:
- `manifest.json` - line with `sourceUrl`
- `repository.json` - line with `sourceUrl`
- `REPOSITORY_SETUP.md` - all occurrences

## 4. Create Release Tag

```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

This triggers the GitHub Action to build and create the release automatically.

## 5. Update Checksum

After the release is created (check GitHub Actions tab):

```powershell
# Download the ZIP from releases, then:
Get-FileHash -Algorithm MD5 Jellyfin.Plugin.DirectDownload.zip
```

Update the checksum in `repository.json`, then:

```bash
git add repository.json
git commit -m "Update checksum for v1.0.0"
git push
```

## 6. Your Repository URL

Your Jellyfin repository URL will be:

```
https://raw.githubusercontent.com/YOUR_USERNAME/jellyfin-plugin-directdownload/main/repository.json
```

## 7. Add to Jellyfin

In Jellyfin web UI:
1. Dashboard → Plugins → Repositories → **+**
2. Name: `Direct Download Plugin`
3. URL: `https://raw.githubusercontent.com/YOUR_USERNAME/jellyfin-plugin-directdownload/main/repository.json`
4. Save
5. Go to Catalog → Install "Direct Download"
6. Restart Jellyfin

Done! Your plugin is now installable through Jellyfin's plugin system.

## Troubleshooting

**Build fails?** Check the Actions tab on GitHub for error logs.

**Plugin not showing?** Verify:
- Repository is public
- repository.json URL is accessible in browser
- JSON is valid (paste into jsonlint.com)
- Checksum is correct

**Need help?** See full details in `REPOSITORY_SETUP.md`
