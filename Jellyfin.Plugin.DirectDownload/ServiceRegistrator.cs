using Jellyfin.Plugin.DirectDownload.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MediaBrowser.Common.Plugins;

namespace Jellyfin.Plugin.DirectDownload;

/// <summary>
/// Service registration for the Direct Download plugin.
/// </summary>
public class ServiceRegistrator
{
    /// <summary>
    /// Register services for the plugin.
    /// </summary>
    /// <param name="serviceCollection">The service collection.</param>
    public void RegisterServices(IServiceCollection serviceCollection)
    {
        // Register directory parser
        serviceCollection.AddSingleton<DirectoryParser>();
        
        // Register search service
        serviceCollection.AddSingleton<ISearchService, SearchService>();

        // Register download manager
        serviceCollection.AddSingleton<IDownloadManager, DownloadManager>();

        // Register HttpClient for web requests
        serviceCollection.AddHttpClient<SearchService>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(30);
            client.DefaultRequestHeaders.Add("User-Agent", "Jellyfin-DirectDownload/1.0");
        });

        // Register HttpClient for downloads
        serviceCollection.AddHttpClient<DownloadManager>(client =>
        {
            client.Timeout = TimeSpan.FromMinutes(30);
            client.DefaultRequestHeaders.Add("User-Agent", "Jellyfin-DirectDownload/1.0");
        });

        // Add logging
        serviceCollection.AddLogging(builder =>
        {
            builder.AddConsole();
            builder.AddDebug();
        });
    }
}
