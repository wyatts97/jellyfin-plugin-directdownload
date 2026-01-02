using MediaBrowser.Common.Plugins;
using Jellyfin.Plugin.DirectDownload.Configuration;
using Microsoft.Extensions.Logging;
using MediaBrowser.Model.Plugins;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Model.Serialization;
using System.Xml.Serialization;
using System.Collections.Generic;

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
    /// <summary>
    /// Initializes a new instance of the <see cref="Plugin"/> class.
    /// </summary>
    /// <param name="applicationPaths">The application paths.</param>
    public Plugin(IApplicationPaths applicationPaths) : base(applicationPaths, new SimpleXmlSerializer())
    {
        Instance = this;
        Logger = LoggerFactory.Create(builder => builder.AddConsole()).CreateLogger<Plugin>();
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
                Name = this.Name,
                EmbeddedResourcePath = GetType().Namespace + ".Configuration.directdownload.html"
            }
        };
    }
}
