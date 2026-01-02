using Jellyfin.Plugin.DirectDownload.Services;
using MediaBrowser.Common.Plugins;
using Microsoft.Extensions.DependencyInjection;

namespace Jellyfin.Plugin.DirectDownload;

/// <summary>
/// Service registration for the Direct Download plugin.
/// </summary>
public class ServiceRegistrator : IPluginServiceRegistrator
{
    /// <inheritdoc />
    public void RegisterServices(IServiceCollection serviceCollection)
    {
        // Register directory parser
        serviceCollection.AddSingleton<DirectoryParser>();
        
        // Register search service
        serviceCollection.AddSingleton<ISearchService, SearchService>();

        // Register download manager
        serviceCollection.AddSingleton<IDownloadManager, DownloadManager>();

        // Register HttpClient for services
        serviceCollection.AddHttpClient<SearchService>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(30);
            client.DefaultRequestHeaders.Add("User-Agent", "Jellyfin-DirectDownload/1.0");
        });

        serviceCollection.AddHttpClient<DownloadManager>(client =>
        {
            client.Timeout = TimeSpan.FromMinutes(30);
            client.DefaultRequestHeaders.Add("User-Agent", "Jellyfin-DirectDownload/1.0");
        });
    }
}
