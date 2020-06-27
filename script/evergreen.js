var defaults = {
  center: [0, 0],
  zoom: 6,
  gestureHandling: "greedy",
  min_zoom: 5,
  max_zoom: 9,
  tile_size: 256,
  stage_zoom: 8,
  name: "Masterplan",
};

var imageMapType;
var mapTypeOptions;

function load() {
  mapTypeOptions = {
    getTileUrl: function (coord, zoom) {
      var img_url = `./images/slices/${zoom}_${coord.x}_${coord.y}.gif`;

      return img_url;
    },
    tileSize: new google.maps.Size(defaults.tile_size, defaults.tile_size),
    maxZoom: defaults.max_zoom,
    minZoom: defaults.min_zoom,
    name: defaults.name,
  };

  mapTypeOptions["maxZoom"] = defaults.max_zoom;
  mapTypeOptions["minZoom"] = defaults.min_zoom;

  imageMapType = new google.maps.ImageMapType(mapTypeOptions);

  $.ajaxSetup({
    async: false,
  });

  initialize();
}

function initialize() {
  createMap();
}

function createMap() {
  var myLatLng = new google.maps.LatLng(defaults.center[0], defaults.center[1]);
  var mapOptions = {
    center: myLatLng,
    zoom: defaults.zoom,
    gestureHandling: defaults.gestureHandling,
    streetViewControl: false,
    mapTypeControl: false,
    zoomControlOptions: {
      position: google.maps.ControlPosition.RIGHT_TOP,
    },
  };

  var mapDiv = document.getElementById("map");
  var map = new google.maps.Map(mapDiv, mapOptions);
  map.mapTypes.set("masterplanMap", imageMapType);
  map.setMapTypeId("masterplanMap");
}
