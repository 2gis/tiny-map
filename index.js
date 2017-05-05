/**
 * A tiny script for displaying a static map with tiles.
 * You can't interact with the map.
 * /

 /**
 * @typedef {Object} options
 * @property {number[]} center Geographical center of the map, contains two numbers: [longitude, latitude]
 * @property {number} zoom Zoom of the map
 * @property {string} tileUrl URL template for tiles, e.g. //tile{s}.maps.2gis.com/tiles?x={x}&y={y}&z={z}
 * @property {string} subdomains Subdomains of the tile server, e.g. '0123'
 * @property {?number} size Size of the map container. This is optional parameter, but set it, if you won't cause
 * additional reflow.
 */

/**
 * @param {HTMLElement} container HTML Element that will be contains the map
 * @param {options} options
 */
function tinyMap(container, options) {
    container.style.cssText = 'position:relative;overflow:hidden';

    var tileSize = 256;
    var R = 6378137;
    var maxLat = 85.0511287798;

    var math = Math;
    var optionsSubdomains = options.subdomains;
    var optionsCenter = options.center;
    var optionsZoom = options.zoom;

    var d = math.PI / 180;
    var lat = math.max(math.min(maxLat, optionsCenter[1]), -maxLat);
    var sin = math.sin(lat * d);
    var pixelCenter = [
        R * optionsCenter[0] * d,
        R * math.log((1 + sin) / (1 - sin)) / 2
    ];

    var scale = 256 * math.pow(2, optionsZoom);
    var k = 0.5 / (math.PI * R);
    pixelCenter[0] = scale * (k * pixelCenter[0] + 0.5);
    pixelCenter[1] = scale * (-k * pixelCenter[1] + 0.5);

    var size = options.size || [container.offsetWidth, container.offsetHeight];
    var halfSize = [size[0] / 2, size[1] / 2];

    var minTile = [
        (pixelCenter[0] - halfSize[0]) / tileSize | 0,
        (pixelCenter[1] - halfSize[1]) / tileSize | 0
    ];

    var maxTile = [
        (pixelCenter[0] + halfSize[0]) / tileSize + 1 | 0,
        (pixelCenter[1] + halfSize[1]) / tileSize + 1 | 0
    ];

    for (var y = minTile[1]; y < maxTile[1]; y++) {
        for (var x = minTile[0]; x < maxTile[0]; x++) {
            var tile = new Image();
            tile.style.cssText = 'position:absolute;' +
                'left:' + (halfSize[0] + x * tileSize - pixelCenter[0] | 0) + 'px;' +
                'top:' + (halfSize[1] + y * tileSize - pixelCenter[1] | 0) + 'px;' +
                'width:' + tileSize + 'px;' +
                'height:' + tileSize + 'px';
            tile.src = options.tileUrl
                .replace('{s}', optionsSubdomains[math.abs(x + y) % optionsSubdomains.length])
                .replace('{x}', x)
                .replace('{y}', y)
                .replace('{z}', optionsZoom);
            container.appendChild(tile);
        }
    }
}
