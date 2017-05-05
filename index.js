/**
 * A tiny script for displaying a static map with tiles.
 * You can't interact with the map, it has only remove method.
 * 
 * @param {HTMLElement} container HTML Element that will be contains the map
 * @param {Object} options
 * @param {number[]} [options.center] Geographical center of the map, contains two numbers: [longitude, latitude]
 * @param {number} [options.zoom] Zoom of the map
 * @param {string} [options.tileUrl] URL template for tiles, e.g. //tile{s}.maps.2gis.com/tiles?x={x}&y={y}&z={z}
 * @param {string} [options.subdomains='0123'] Subdomains of the tile server, e.g. '0123'
 * @param {?number} [options.size] Size of the map container. This is optional parameter, but set it, if you won't cause
 * additional reflow.
 */
function TinyMap(container, options) {
    this._center = options.center;
    this._zoom = options.zoom;
    this._tileUrl = options.tileUrl;
    this._subdomains = options.subdomains || '0123';
    this._size = options.size || [container.offsetWidth, container.offsetHeight];

    container.style.position = 'relative';
    container.style.overflow = 'hidden';

    this._R = 6378137;
    this._MAX_LATITUDE = 85.0511287798;

    this.container = container;
    this._removed = false;

	var tileSize = 256;
    var pixelCenter = this._lngLatToPoint(this._center, this._zoom);

	var halfSize = [this._size[0] / 2, this._size[1] / 2];
    var minTile = [
        Math.floor((pixelCenter[0] - halfSize[0]) / tileSize),
        Math.floor((pixelCenter[1] - halfSize[1]) / tileSize)
    ];

    var maxTile = [
        Math.ceil((pixelCenter[0] + halfSize[0]) / tileSize),
        Math.ceil((pixelCenter[1] + halfSize[1]) / tileSize)
    ];

    var centerTile = [
        minTile[0] + Math.floor((maxTile[0] - 1 - minTile[0]) / 2),
        minTile[1] + Math.floor((maxTile[1] - 1 - minTile[1]) / 2)
    ];

    var queue = [];

    for (var y = minTile[1]; y < maxTile[1]; y++) {
        for (var x = minTile[0]; x < maxTile[0]; x++) {
            queue.push([x, y]);
        }
    }

    const distance = this._distance;
    queue.sort(function(a, b) {
        return distance(a, centerTile) - distance(b, centerTile);
    });

    queue.forEach(function(p) {
        var _this = this;
        var tile = document.createElement('img');
        tile.style.position = 'absolute';
        tile.style.left = Math.floor(halfSize[0] + p[0] * tileSize - pixelCenter[0]) + 'px';
        tile.style.top = Math.floor(halfSize[1] + p[1] * tileSize - pixelCenter[1]) + 'px';
        tile.style.width = tileSize + 'px';
        tile.style.height = tileSize + 'px';
        tile.onload = function() {
            if (!_this._removed) {
                container.appendChild(tile);
            }
        };
        tile.src = this._getUrl(p[0], p[1]);
    }, this);
}

/**
 * Removes the map
 */
TinyMap.prototype.remove = function() {
    var tile;

    while (tile = this.container.firstChild) {
        this.container.removeChild(tile);
    }

    this._removed = true;
};

TinyMap.prototype._distance = function(a, b) {
    return Math.sqrt((a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]));
};

TinyMap.prototype._getUrl = function(x, y) {
    return this._tileUrl
        .replace('{s}', this._getSubdomains(x, y))
        .replace('{x}', x)
        .replace('{y}', y)
        .replace('{z}', this._zoom);
};

TinyMap.prototype._getSubdomains = function(x, y) {
	return this._subdomains[Math.abs(x + y) % this._subdomains.length];
};

TinyMap.prototype._lngLatToPoint = function(lngLat, zoom) {
	var point = this._project(lngLat);
	var scale = 256 * Math.pow(2, zoom);
    var k = 0.5 / (Math.PI * this._R);
	point[0] = scale * (k * point[0] + 0.5);
	point[1] = scale * (-k * point[1] + 0.5);
    return point;
};

TinyMap.prototype._project = function(lngLat) {
	var d = Math.PI / 180;
    var lat = Math.max(Math.min(this._MAX_LATITUDE, lngLat[1]), -this._MAX_LATITUDE);
    var sin = Math.sin(lat * d);

	return [
		this._R * lngLat[0] * d,
		this._R * Math.log((1 + sin) / (1 - sin)) / 2
    ];
};
