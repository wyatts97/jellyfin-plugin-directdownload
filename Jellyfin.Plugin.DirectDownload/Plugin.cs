using MediaBrowser.Common.Plugins;
using Jellyfin.Plugin.DirectDownload.Configuration;
using Microsoft.Extensions.Logging;
using MediaBrowser.Model.Plugins;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Model.Serialization;
using System.Xml.Serialization;
using System.Collections.Generic;
using System.Text.Json;

namespace Jellyfin.Plugin.DirectDownload;

/// <summary>
/// Simple XML serializer implementation for plugin configuration.
/// </summary>
public class SimpleXmlSerializer : IXmlSerializer
{
    public void SerializeToFile(object obj, string path)
    {
        var serializer = new XmlSerializer(obj.GetType());
        using var stream = new FileStream(path, FileMode.Create);
        serializer.Serialize(stream, obj);
    }

    public object DeserializeFromFile(Type type, string path)
    {
        var serializer = new XmlSerializer(type);
        using var stream = new FileStream(path, FileMode.Open);
        return serializer.Deserialize(stream)!;
    }

    public void SerializeToStream(object obj, Stream stream)
    {
        var serializer = new XmlSerializer(obj.GetType());
        serializer.Serialize(stream, obj);
    }

    public object DeserializeFromStream(Type type, Stream stream)
    {
        var serializer = new XmlSerializer(type);
        return serializer.Deserialize(stream)!;
    }

    public object DeserializeFromBytes(Type type, byte[] buffer)
    {
        var serializer = new XmlSerializer(type);
        using var stream = new MemoryStream(buffer);
        return serializer.Deserialize(stream)!;
    }

    public T DeserializeFromString<T>(string value)
    {
        var serializer = new XmlSerializer(typeof(T));
        using var reader = new StringReader(value);
        return (T)serializer.Deserialize(reader)!;
    }

    public string SerializeToString<T>(T value)
    {
        var serializer = new XmlSerializer(typeof(T));
        using var writer = new StringWriter();
        serializer.Serialize(writer, value);
        return writer.ToString();
    }
}

/// <summary>
/// The main plugin class for Jellyfin Direct Download.
/// </summary>
public class Plugin : BasePlugin<PluginConfiguration>, IHasWebPages
{
    private readonly IApplicationPaths _applicationPaths;

    /// <summary>
    /// Initializes a new instance of the <see cref="Plugin"/> class.
    /// </summary>
    /// <param name="applicationPaths">The application paths.</param>
    public Plugin(IApplicationPaths applicationPaths) : base(applicationPaths, new SimpleXmlSerializer())
    {
        Instance = this;
        _applicationPaths = applicationPaths;
        Logger = LoggerFactory.Create(builder => builder.AddConsole()).CreateLogger<Plugin>();
        
        // Register with Plugin Pages
        RegisterWithPluginPages();
    }

    /// <summary>
    /// Registers this plugin's pages with the Plugin Pages system.
    /// </summary>
    private void RegisterWithPluginPages()
    {
        try
        {
            var configPath = Path.Combine(_applicationPaths.PluginConfigurationsPath, "Jellyfin.Plugin.PluginPages");
            Directory.CreateDirectory(configPath);
            
            var configFile = Path.Combine(configPath, "config.json");
            
            // Read existing config or create new
            var pages = new List<PluginPageConfig>();
            if (File.Exists(configFile))
            {
                var existingJson = File.ReadAllText(configFile);
                var existingConfig = JsonSerializer.Deserialize<PluginPagesConfig>(existingJson);
                if (existingConfig?.Pages != null)
                {
                    pages = existingConfig.Pages.Where(p => p.PluginId != Id.ToString()).ToList();
                }
            }
            
            // Add our page
            pages.Add(new PluginPageConfig
            {
                PluginId = Id.ToString(),
                PageId = "directdownload",
                DisplayName = "Direct Download",
                Route = "directdownload",
                Icon = "download",
                MenuSection = "media"
            });
            
            var config = new PluginPagesConfig { Pages = pages };
            var json = JsonSerializer.Serialize(config, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(configFile, json);
            
            Logger.LogInformation("Registered Direct Download page with Plugin Pages");
        }
        catch (Exception ex)
        {
            Logger.LogWarning(ex, "Could not register with Plugin Pages - this is optional");
        }
    }

    /// <summary>
    /// Gets the current plugin instance.
    /// </summary>
    public static Plugin? Instance { get; private set; }

    /// <summary>
    /// Gets the logger.
    /// </summary>
    public ILogger<Plugin> Logger { get; private set; } = null!;

    /// <inheritdoc />
    public override string Name => "Jellyfin Direct Download";

    /// <inheritdoc />
    public override string Description => "Search and download media directly from various torrent and direct download sources.";

    /// <inheritdoc />
    public override Guid Id => Guid.Parse("a1b2c3d4-e5f6-7890-abcd-ef1234567890");

    /// <inheritdoc />
    public IEnumerable<PluginPageInfo> GetPages()
    {
        return new[]
        {
            new PluginPageInfo
            {
                Name = "directdownload",
                EmbeddedResourcePath = GetType().Namespace + ".Configuration.directdownload.html",
                DisplayName = "Direct Download Search"
            }
        };
    }
}

/// <summary>
/// Plugin Pages configuration model.
/// </summary>
public class PluginPagesConfig
{
    public List<PluginPageConfig> Pages { get; set; } = new();
}

/// <summary>
/// Individual page configuration for Plugin Pages.
/// </summary>
public class PluginPageConfig
{
    public string PluginId { get; set; } = string.Empty;
    public string PageId { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Route { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string MenuSection { get; set; } = string.Empty;
}
