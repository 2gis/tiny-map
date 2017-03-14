/**
 * Очень короткий скрипт для отображения карты.
 * С картой нельзя взаимодействовать, у неё есть только метод remove.
 * 
 * @param {HTMLElement} container HTML элемент куда вставится карта
 * @param {Object} options
 * @param {[number, number]} [options.center] Центр в координатах LngLat
 * @param {number} [options.zoom] Зум
 * @param {string} [options.tileUrl] Шаблон для урла тайлов, например, //tile{s}.maps.2gis.com/tiles?x={x}&y={y}&z={z}
 * @param {string} [options.subdomains='0123'] Поддомены, например, '0123'
 * @param {?[number, number]} [options.size] Размер контейнера карты.
 * Необязательный параметр, но, если вы не хотите вызывать дополнительный reflow, нужно указать.
 */
function MinMap(container, options) {
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
        (pixelCenter[0] - halfSize[0]) / tileSize,
        (pixelCenter[1] - halfSize[1]) / tileSize
    ].map(Math.floor);

    var maxTile = [
        (pixelCenter[0] + halfSize[0]) / tileSize,
        (pixelCenter[1] + halfSize[1]) / tileSize
    ].map(Math.ceil);

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
 * Удаляет все тайлы из контейнера карты
 */
MinMap.prototype.remove = function() {
    var tile;

    while (tile = this.container.firstChild) {
        this.container.removeChild(tile);
    }

    this._removed = true;
};

MinMap.prototype._distance = function(a, b) {
    return Math.sqrt((a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]));
};

MinMap.prototype._getUrl = function(x, y) {
    return this._tileUrl
        .replace('{s}', this._getSubdomains(x, y))
        .replace('{x}', x)
        .replace('{y}', y)
        .replace('{z}', this._zoom);
};

MinMap.prototype._getSubdomains = function(x, y) {
	return this._subdomains[Math.abs(x + y) % this._subdomains.length];
};

MinMap.prototype._lngLatToPoint = function(lngLat, zoom) {
	var point = this._project(lngLat);
	var scale = 256 * Math.pow(2, zoom);
    var k = 0.5 / (Math.PI * this._R);
	point[0] = scale * (k * point[0] + 0.5);
	point[1] = scale * (-k * point[1] + 0.5);
    return point;
};

MinMap.prototype._project = function(lngLat) {
	var d = Math.PI / 180;
    var lat = Math.max(Math.min(this._MAX_LATITUDE, lngLat[1]), -this._MAX_LATITUDE);
    var sin = Math.sin(lat * d);

	return [
		this._R * lngLat[0] * d,
		this._R * Math.log((1 + sin) / (1 - sin)) / 2
    ];
};
