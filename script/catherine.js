$.urlParam = function (name) {
  var results = new RegExp("[?&]" + name + "=([^&#]*)").exec(
    window.location.href
  );
  if (results == null) {
    return null;
  }
  return decodeURI(results[1]) || 0;
};

var infoWindow,
  map,
  map_mini,
  selected_plot = null,
  precinct_shapes = [],
  plot_shapes = [],
  unavailable_shapes = [],
  custom_areas_shapes = [],
  plot_types_shapes = [],
  available_counts,
  plot_info = [],
  sold_markers = [],
  deposit_markers = [],
  house_markers = [],
  logging = false;

var data_url = "/",
  details_url = "/",
  modal_url = "/",
  enquiry_url = "/",
  custom_area_url = "/";

var precincts = [],
  releases = [],
  plots_available = [],
  plots = [],
  plot_info = [],
  unavailable = [],
  plot_types = [],
  custom_areas = [];

var modal_script = "";

var stamp = new Date().getTime();

var lot_selection = "click";
var custom_area_selection = "click";

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

var str = window.location.search;
var mapInfoKeyVar = str.split("?show-available=");
if (mapInfoKeyVar.length > 1) {
  var keyVar = $.urlParam("show-available");
  var displayLotsURL;
  $.ajax({
    type: "GET",
    url: "/getLots.php?key=" + keyVar,
    datatype: "json",
    async: false,
    success: function (data) {
      displayLotsURL = "?displayLots=" + data;
      //console.log(data);
    },
  });
  var res = displayLotsURL.split("?displayLots=");
}

if (!res) var res = str.split("?displayLots=");

if (res.length > 1) {
  var myActivelots = res[1];
  var result = myActivelots.split(",");
  //console.log(result);
  greying(result);
  //console.log("CP - "  + result);
  var nonactiveColour = "#eee";
  if (keyVar == "land") {
    var selectedColor = "#dfb683";
  } else if (keyVar == "completed-home") {
    var selectedColor = "#2DAFCE";
  } else if (keyVar == "home-land") {
    var selectedColor = "#F7B231";
  }
  var plot_styles = {
    active: { color: "#90CF5E", opacity: 0.3 },
    inactive: { color: "#8fc740", opacity: 0.3 },
    hover: { color: "#EEEEEE", opacity: 0 },
    available: { color: nonactiveColour, opacity: 1 },
    unavailable: { color: nonactiveColour, opacity: 1 },
    pending: { color: nonactiveColour, opacity: 1 },
    sold: { color: nonactiveColour, opacity: 1 },
    townhouse: { color: nonactiveColour, opacity: 1 },
    completedHome: { color: nonactiveColour, opacity: 1 },
    homeLandPackage: { color: nonactiveColour, opacity: 1 },
    villa: { color: nonactiveColour, opacity: 1 },
    garden: { color: nonactiveColour, opacity: 1 },
    courtyard: { color: nonactiveColour, opacity: 1 },
    terrace: { color: nonactiveColour, opacity: 1 },
    selected: { color: selectedColor, opacity: 0.3 },
    custom_areas: { color: "#FF0000", opacity: 0 },
  };

  var plot_styles2 = {
    active: { color: "#90CF5E", opacity: 0.3 },
    inactive: { color: "#8fc740", opacity: 0 },
    hover: { color: "#EEEEEE", opacity: 0 },
    available: { color: "#934700", opacity: 0.3 },
    unavailable: { color: "#ffe4b9", opacity: 1 },
    pending: { color: "#ff8b00", opacity: 0 },
    sold: { color: "#ff8b00", opacity: 0 },
    townhouse: { color: "#87C849", opacity: 0.3 },
    completedHome: { color: "#2DAFCE", opacity: 0.3 },
    homeLandPackage: { color: "#F7B231", opacity: 0.3 },
    villa: { color: "#ff7c7c", opacity: 0.3 },
    garden: { color: "#041df4", opacity: 0.3 },
    courtyard: { color: "#F7B231", opacity: 0.3 },
    terrace: { color: "#2DAFCE", opacity: 0.3 },
    custom_areas: { color: "#FF0000", opacity: 0 },
  };
} else {
  var plot_styles = {
    active: { color: "#90CF5E", opacity: 0.3 },
    inactive: { color: "#8fc740", opacity: 0 },
    hover: { color: "#EEEEEE", opacity: 0 },
    available: { color: "#934700", opacity: 0.3 },
    unavailable: { color: "#ffe4b9", opacity: 1 },
    pending: { color: "#ff8b00", opacity: 0 },
    sold: { color: "#ff8b00", opacity: 0 },
    townhouse: { color: "#87C849", opacity: 0.3 },
    completedHome: { color: "#2DAFCE", opacity: 0.3 },
    homeLandPackage: { color: "#F7B231", opacity: 0.3 },
    villa: { color: "#ff7c7c", opacity: 0.3 },
    garden: { color: "#041df4", opacity: 0.3 },
    courtyard: { color: "#F7B231", opacity: 0.3 },
    terrace: { color: "#2DAFCE", opacity: 0.3 },
    custom_areas: { color: "#FF0000", opacity: 0 },
  };
}
/*
var plot_styles = {
    "active": {color:"#8fc740", opacity: '0'},
    "inactive": {color:"#8fc740", opacity: '0'},
    "hover": {color:"#FF0000", opacity: '0.4'},
    "available": {color:"#00FF00", opacity: '0.4'},
    "pending": {color:"#EEEEEE", opacity: '0.8'},
    "sold": {color:"#EEEEEE", opacity: '0.8'},
    "unavailable": {color:"#EEEEEE", opacity: '1'},
    "townhouse": {color:"#000000", opacity: 0.3},
    "villa": {color:"#FF0000", opacity: 0.3},
    "custom_areas": {color:"#EEEEEE", opacity: '0'}
};
*/

if (mapInfoKeyVar.length > 1) {
  var show_status_markers = false;
} else {
  var show_status_markers = true;
}
var show_status_color = true;
var sold_view_details = true;

var sold_images_data = {
  "1": [1, 1],
  "2": [1, 1],
  "3": [1, 1],
  "4": [1, 1],
  "5": [1, 1],
  "6": [4, 4],
  "7": [10, 10],
  "8": [32, 13],
  "9": [59, 27],
  "10": [59, 25],
};
var sold_images = {};

var deposit_images_data = {
  "1": [1, 1],
  "2": [1, 1],
  "3": [1, 1],
  "4": [1, 1],
  "5": [1, 1],
  "6": [4, 4],
  "7": [10, 10],
  "8": [32, 12],
  "9": [59, 25],
  "10": [59, 25],
};
var deposit_images = {};

var house_images_data = {
  "1": [1, 1],
  "2": [1, 1],
  "3": [1, 1],
  "4": [1, 1],
  "5": [1, 1],
  "6": [4, 4],
  "7": [10, 10],
  "8": [32, 12],
  "9": [59, 25],
  "10": [59, 25],
};
var house_images = {};

var mapTypeOptions = {
  getTileUrl: function (coord, zoom) {
    var img_url =
      "./images/slices/" + zoom + "_" + coord.x + "_" + coord.y + ".gif";
    return img_url;
  },
  tileSize: new google.maps.Size(defaults.tile_size, defaults.tile_size),
  maxZoom: defaults.max_zoom,
  minZoom: defaults.min_zoom,
  name: defaults.name,
};

var imageMapType;

function load() {
  mapTypeOptions["maxZoom"] = defaults["max_zoom"];
  mapTypeOptions["minZoom"] = defaults["min_zoom"];

  imageMapType = new google.maps.ImageMapType(mapTypeOptions);

  $.ajaxSetup({
    async: false,
  });
  initialize();
}

function initialize() {
  logIt("Initializing Map");
  createMap();
  setupPlots();
  setupUnavailable();
  setupCustomAreas();
  createOptions();
  plotTypes();
  setMenuExtras();
  loadPlotInfo();
}

function createMap() {
  logIt("Creating Map");
  // Set start coordinates
  var myLatlng = new google.maps.LatLng(defaults.center[0], defaults.center[1]);
  var mapOptions = {
    center: myLatlng,
    zoom: defaults.zoom,
    gestureHandling: "greedy",
    streetViewControl: false,
    mapTypeControl: false,
    zoomControlOptions: {
      position: google.maps.ControlPosition.RIGHT_TOP,
    },
  };

  var mapDiv = document.getElementById("map-canvas");
  map = new google.maps.Map(mapDiv, mapOptions);
  map.mapTypes.set("masterplanMap", imageMapType);
  map.setMapTypeId("masterplanMap");

  logIt("Map Created!");

  google.maps.event.addListener(map, "zoom_changed", function () {
    var zoomLevel = map.getZoom();
    if (zoomLevel < 7) {
      resetShapes();
      showPrecinctShapes();
    } else {
      hidePrecinctShapes();
    }
    updateMarkers();
  });
}

function updateMarkers() {
  var zoomLevel = map.getZoom();
  var i, j;
  for (i = 0, j = sold_markers.length; i < j; i++) {
    if (sold_markers[i]) {
      if (sold_markers[i]["classVal"] != "unavailable") {
        sold_markers[i].setIcon(sold_markers[i]["sold_" + zoomLevel]);
      } else {
        sold_markers[i].setMap(null);
      }
    }
  }
  for (i = 0, j = deposit_markers.length; i < j; i++) {
    if (deposit_markers[i] && deposit_markers[i]["classVal"] != "unavailable") {
      deposit_markers[i].setIcon(deposit_markers[i]["deposit_" + zoomLevel]);
    }
  }

  for (i = 0, j = house_markers.length; i < j; i++) {
    if (house_markers[i] && house_markers[i]["classVal"] != "unavailable") {
      house_markers[i].setIcon(house_markers[i]["house_" + zoomLevel]);
    }
  }
}

function showPrecinctShapes() {
  for (var x in precinct_shapes) {
    precinct_shapes[x].setMap(map);
  }
}

function hidePrecinctShapes() {
  for (var x in precinct_shapes) {
    precinct_shapes[x].setMap(null);
  }
}

function createOptions() {
  // Set up Menu
  setupMenu();
}

function setupMenu() {
  logIt("Adding Menu");
  // Create Menu container
  var menuDiv = document.createElement("div");
  $(menuDiv).attr("id", "hg-menu");

  // Set CSS for the control border.
  var controlUI = document.createElement("div");
  var center = new google.maps.LatLng(defaults.center[0], defaults.center[1]);

  $(controlUI)
    .addClass("menu-item")
    .click(function () {
      // Onclick go to the precinct and zoom to specified value
      goToPoint(center, defaults.zoom, map);
      deselectLot();
      if ($("#menu-selector:visible").length) {
        $("#hg-menu").hide();
      }
    });

  // Create the menu item div
  //controlUI.title = 'Click to view the Masterplan';
  //$(controlUI).attr('id', 'menu-masterplan');
  //menuDiv.appendChild(controlUI);

  // Create the text element.
  var controlText = document.createElement("div");
  //controlText.innerHTML = '<h2>Masterplan</h2>';
  controlUI.appendChild(controlText);

  //$('body').append('<div id="menu-selector">Map Menu</div>');

  $("#menu-selector").click(function (event) {
    if ($("#hg-menu").is(":visible")) {
      $("#hg-menu").hide();
    } else {
      var h = $(event.target).outerHeight();
      $("#hg-menu").css("top", h).show();
    }
  });

  logIt("Loading Menu");
  //console.log(releases);
  // Setup the control for each precinct
  $.each(releases, function (key, val) {
    createControl(menuDiv, val);
  });

  var controlUIEnquiry = document.createElement("div");
  /*controlUIEnquiry.title = 'Click to load enquiry form';
    $(controlUIEnquiry).attr('id', 'menu-enquiry')
                        .addClass('menu-item')
                        .click(function(){
                            loadEnquiryForm();
                        });*/

  $("#menu-enquiry").click(function () {
    loadEnquiryForm();
  });

  $("#menu-pricelist").click(function () {
    loadPriceEnquiryForm();
  });

  var controlEnquiryText = document.createElement("div");
  //controlEnquiryText.innerHTML = '<h2>Enquire</h2>';

  controlUIEnquiry.appendChild(controlEnquiryText);
  menuDiv.appendChild(controlUIEnquiry);

  // Append menu to body
  $("body").append(menuDiv);

  logIt("Menu Created");
  $("#hg-menu").appendTo(".release-menu-wrapper");
}

function createControl(controlDiv, data) {
  logIt(data.name + ": Creating Control");
  //console.log(data);

  // Set CSS for the control border.
  var controlUI = document.createElement("div");

  // if the precinct has the center set
  if (data.center) {
    // get center coords as LatLng variable
    var center = new google.maps.LatLng(data.center["lat"], data.center["lng"]);
    $(controlUI)
      .addClass("menu-item")
      .click(function () {
        //console.log('goto');
        // Onclick go to the precinct and zoom to specified value
        var zoom = data.zoom ? data.zoom : defaults.stage_zoom;

        deselectLot();
        goToPoint(center, zoom, map);
        if ($("#menu-selector:visible").length) {
          $("#hg-menu").hide();
        }
      });
    $(controlUI)
      .addClass("menu-item")
      .on("tap", function () {
        var zoom = data.zoom ? data.zoom : defaults.stage_zoom;

        deselectLot();
        goToPoint(center, zoom, map);
        if ($("#menu-selector:visible").length) {
          $("#hg-menu").hide();
        }
      });
  }
  // Create the precinct ID
  var precinct_id = data.name;
  precinct_id = precinct_id.replace(/ /g, "_", "g");
  precinct_id = precinct_id.replace(/\'/g, "");
  precinct_id = precinct_id.toLowerCase();
  // Create the menu item div
  controlUI.title = "Click to view " + data.name;
  $(controlUI)
    .attr("rel", data.name)
    .addClass(data.type)
    .attr("id", precinct_id);
  if (data.available_lots == 0) {
    //$(controlUI).addClass('sold-out');
    controlUI.title = "Sold Out! " + "\n\n" + controlUI.title;
  }
  $(controlUI).addClass(data.order);

  controlDiv.appendChild(controlUI);

  // Create the text element.
  var controlText = document.createElement("div");
  var lots_available_str =
    data.available_lots > 0
      ? '<span class="desc-text">Land Available: </span><span>' +
        data.available_lots +
        "</span>"
      : '<span class="desc-text">Homesites Available: </span><span>0</span>';
  var lots_available_homes_str =
    data.available_homes > 0
      ? '<span class="desc-text">Homes Available: </span><span>' +
        data.available_homes +
        "</span>"
      : '<span class="desc-text">Homes Available: </span><span>0</span>';
  controlText.innerHTML =
    "<h3>" +
    data.name +
    '</h3><p class="desc-text-wrap">' +
    lots_available_str +
    "<br />" +
    lots_available_homes_str +
    "</p>";

  controlUI.appendChild(controlText);

  if (data.coords) {
    logIt(data.name + ": Coords found");
    // Get the coordinates of the precinct shape
    var shapeCoords = [];
    $.each(data.coords, function (id, LatLng) {
      logIt(LatLng);
      shapeCoords.push(new google.maps.LatLng(LatLng.lat, LatLng.lng));
    });

    var shape = new google.maps.Polygon({
      paths: shapeCoords,
      strokeColor: "#000000",
      strokeWeight: 0,
      fillColor: "#FFFFFF",
      fillOpacity: 0,
      title: data.name,
      zIndex: 10,
    });
    shape.setMap(map);

    precinct_shapes[precinct_id] = shape;

    google.maps.event.addListener(shape, "click", function () {
      goToPoint(center, defaults.stage_zoom, map);
      deselectLot();
    });

    shape = null;
  }

  hidePrecinctShapes();
  if (map.getZoom() < 7) {
    showPrecinctShapes();
  }
}

function setMenuExtras() {
  for (var precinct_id in precinct_shapes) {
    $("#" + precinct_id + " > div").hover(
      function (evt) {
        var id = $(evt.target).parent().attr("id");
        if (precinct_shapes[id]) {
          precinct_shapes[id].setOptions({
            fillColor: "#8fc740",
            fillOpacity: 0.4,
          });
        }
      },
      function (evt) {
        var id = $(evt.target).parent().attr("id");
        if (precinct_shapes[id]) {
          precinct_shapes[id].setOptions({
            fillColor: "#FFFFFF",
            fillOpacity: 0,
          });
        }
      }
    );
  }
}

function goToPoint(point, zoom, map) {
  map.panTo(point);
  if (zoom) {
    map.setZoom(parseInt(zoom));
  }
}

function getPolygonData(data) {
  if ($("#shape-data").length == 0) {
    var div = document.createElement("div");
    $(div).attr("id", "shape-data");
    $("body").append(div);
  }
  $("#shape-data").text(data.name).show();
}

function createSoldMarker(lat, lng) {
  var plotLatLng = new google.maps.LatLng(lat, lng);

  var marker = new google.maps.Marker({
    position: plotLatLng,
    map: map,
    icon: sold_images[map.getZoom()],
    zIndex: 1,
    cursor: "normal",
  });

  marker.sold_5 = sold_images["5"];
  marker.sold_6 = sold_images["6"];
  marker.sold_7 = sold_images["7"];
  marker.sold_8 = sold_images["8"];
  marker.sold_9 = sold_images["9"];
  marker.sold_10 = sold_images["10"];

  sold_markers.push(marker);
}

function createDepositMarker(lat, lng) {
  var plotLatLng = new google.maps.LatLng(lat, lng);

  var marker = new google.maps.Marker({
    position: plotLatLng,
    map: map,
    icon: deposit_images[map.getZoom()],
    zIndex: 1,
    cursor: "normal",
  });

  marker.deposit_5 = deposit_images["5"];
  marker.deposit_6 = deposit_images["6"];
  marker.deposit_7 = deposit_images["7"];
  marker.deposit_8 = deposit_images["8"];
  marker.deposit_9 = deposit_images["9"];
  marker.deposit_10 = deposit_images["10"];

  deposit_markers.push(marker);
}

function createHouseMarker(lat, lng) {
  var plotLatLng = new google.maps.LatLng(lat, lng);

  var marker = new google.maps.Marker({
    position: plotLatLng,
    map: map,
    icon: house_images[map.getZoom()],
    zIndex: 1,
    cursor: "normal",
  });

  marker.house_5 = house_images["5"];
  marker.house_6 = house_images["6"];
  marker.house_7 = house_images["7"];
  marker.house_8 = house_images["8"];
  marker.house_9 = house_images["9"];
  marker.house_10 = house_images["10"];

  house_markers.push(marker);
}

function getPlotStyle(plot) {
  var plot_style;
  //console.log(plot);
  if (plot.selected == 1) {
    //console.log(plot);
    plot_style = "selected";
  } else if (plot.lotType == "Garden Home" && plot.available == 1) {
    plot_style = "garden";
  } else if (plot.lotType == "Courtyard Home" && plot.available == 1) {
    plot_style = "courtyard";
  } else if (plot.lotType == "Villa Home" && plot.available == 1) {
    plot_style = "villa";
  } else if (plot.lotType == "Terrace Home" && plot.available == 1) {
    plot_style = "terrace";
  } else if (plot.lotType == "Town Home" && plot.available == 1) {
    plot_style = "townhouse";
  } else if (plot.lotType == "Completed Home" && plot.available == 1) {
    plot_style = "completedHome";
  } else if (plot.lotType == "Home & Land Package" && plot.available == 1) {
    plot_style = "homeLandPackage";
  } else if (plot.available == 1) {
    plot_style = "available";
  } else if (plot.pending == 1) {
    plot_style = "pending";
  } else if (plot.viewable == 1) {
    plot_style = "sold";
  } else {
    plot_style = "unavailable";
  }
  return plot_style;
}

function setPlotCoords(id, coords) {
  var shapeCoords = [];
  $.each(coords, function (i, LatLng) {
    shapeCoords.push(new google.maps.LatLng(LatLng.lat, LatLng.lng));
  });

  var plot = plots[id];
  var plot_style = getPlotStyle(plot);
  if (!show_status_color && plot_style != "unavailable") {
    plot_style = "inactive";
  }
  //console.log(plot_style);
  //    var plot_style = show_status_color ? getPlotStyle(plot): 'inactive';
  if (plot_style == "selected") {
    if (plot.lotType == "Garden Home") {
      my_plot_style = "garden";
    } else if (plot.lotType == "Courtyard Home") {
      my_plot_style = "courtyard";
    } else if (plot.lotType == "Villa Home") {
      my_plot_style = "villa";
    } else if (plot.lotType == "Terrace Home") {
      my_plot_style = "terrace";
    } else if (plot.lotType == "Town Home") {
      my_plot_style = "townhouse";
    } else if (plot.lotType == "Completed Home") {
      my_plot_style = "completedHome";
    } else if (plot.lotType == "Home & Land Package") {
      my_plot_style = "homeLandPackage";
    } else {
      my_plot_style = "available";
    }

    var shape = new google.maps.Polygon({
      paths: shapeCoords,
      strokeColor: "#FF0000",
      strokeWeight: 0,
      fillColor: plot_styles2[my_plot_style]["color"],
      fillOpacity: plot_styles2[my_plot_style]["opacity"],
      zIndex: 3,
    });
  } else {
    var shape = new google.maps.Polygon({
      paths: shapeCoords,
      strokeColor: "#FF0000",
      strokeWeight: 0,
      fillColor: plot_styles[plot_style]["color"],
      fillOpacity: plot_styles[plot_style]["opacity"],
      zIndex: 3,
    });
  }
  shape.setMap(map);

  if (plot.viewable == 1) {
    google.maps.event.addListener(shape, lot_selection, function () {
      resetShapes();
      this.setOptions({
        fillColor: plot_styles.active.color,
        fillOpacity: plot_styles.active.opacity,
      });
      selected_plot = id;
      showPlotData(selected_plot);
    });

    if (lot_selection == "mouseover") {
      google.maps.event.addListener(shape, "mouseout", function () {
        resetShapes();
        selected_plot = null;
        showPlotData(selected_plot);
      });
    }
  }

  google.maps.event.addListener(map, "click", function () {
    cleanMap();
  });

  plot_shapes[id] = shape;
}

function clearMarkers() {
  for (var x in sold_markers) {
    sold_markers[x].setMap(null);
  }
  sold_markers = [];

  for (var x in deposit_markers) {
    deposit_markers[x].setMap(null);
  }
  deposit_markers = [];

  for (var x in house_markers) {
    house_markers[x].setMap(null);
  }
  house_markers = [];
}

function setupPlots() {
  logIt("Creating Plots");

  clearMarkers();

  for (var x in sold_images_data) {
    var image = {
      url: "/images/sold/" + x + ".png",
      //            ,size: new google.maps.Size(deposit_images_data[x][0],deposit_images_data[x][1])
    };
    sold_images[x] = image;
  }
  for (var x in deposit_images_data) {
    var image = {
      url: "images/deposit/" + x + ".png",
      //            ,size: new google.maps.Size(deposit_images_data[x][0],deposit_images_data[x][1])
    };
    deposit_images[x] = image;
  }

  for (var x in house_images_data) {
    var image = {
      url: "images/house/" + x + ".png",
    };
    house_images[x] = image;
  }

  $.each(plots, function (key, plot) {
    if (plot["coords"] && plot["coords"].length > 0) {
      setPlotCoords(plot["id"], plot.coords);
      //console.log(plot.lotType);
    }
    if (show_status_markers == true) {
      if (
        plot.center &&
        plot.available == 0 &&
        plot.pending == 0 &&
        plot.viewable == 1
      ) {
        createSoldMarker(plot.center["lat"], plot.center["lng"]);
      } else if (
        plot.center &&
        plot.available == 0 &&
        plot.pending == 1 &&
        plot.viewable == 1
      ) {
        createDepositMarker(plot.center["lat"], plot.center["lng"]);
      } else if (
        plot["offer_type"] == 2 &&
        plot.center &&
        plot.available == 1
      ) {
        //console.log(plot['id']);
        createHouseMarker(plot.center["lat"], plot.center["lng"]);
      }
    }
    // || keyVar == "home-land"
    if (keyVar == "completed-home") {
      if (plot["offer_type"] == 2 && plot.center && plot.available == 1) {
        createHouseMarker(plot.center["lat"], plot.center["lng"]);
      }
    }
    //}
  });
}

function removeOverlays() {}

function deselectLot() {
  if (selected_plot) {
    resetShapes();
    selected_plot = "";
    showPlotData(null);
  }
  removeOverlays();
}

function setupUnavailable() {
  logIt("Creating Unavailable Plots - " + $(unavailable).length);
  $.each(unavailable, function (key, un_set) {
    var shapeCoords = [];
    $.each(un_set.coords, function (ukey, LatLng) {
      logIt("Shape coord - " + LatLng[0] + ", " + LatLng[1]);
      shapeCoords.push(new google.maps.LatLng(LatLng.lat, LatLng.lng));
    });
    logIt(shapeCoords.length, true);

    var shape = new google.maps.Polygon({
      paths: shapeCoords,
      strokeColor: "#FF0000",
      strokeWeight: 0,
      fillColor: plot_styles.unavailable.color,
      fillOpacity: plot_styles.unavailable.opacity,
      cursor: "normal",
      zIndex: 4,
    });
    shape.setMap(map);

    $.each(sold_markers, function (i, sold_marker) {
      if (sold_marker) {
        var isUnavailable = shape.containsLatLng(sold_marker.position);
        if (isUnavailable) {
          sold_markers[i]["classVal"] = "unavailable";
        }
      }
    });

    $.each(deposit_markers, function (i, deposit_marker) {
      if (deposit_marker) {
        var isUnavailable = shape.containsLatLng(deposit_marker.position);
        if (isUnavailable) {
          deposit_markers[i]["classVal"] = "unavailable";
        }
      }
    });

    $.each(house_markers, function (i, house_marker) {
      if (house_marker) {
        var isUnavailable = shape.containsLatLng(house_marker.position);
        if (isUnavailable) {
          house_markers[i]["classVal"] = "unavailable";
        }
      }
    });

    unavailable_shapes.push(shape);
  });
}

function plotTypes() {
  /*
  logIt('Creating townhouse Plots - ' + $(plotType).length);
  var len = $(plotType).length;
  //var plot = plots[id];
  if(len > 0)
  {
    $.each(plotType, function(key, ca_set){
        var shapeCoords = [];
//------------------------------------------------Plot Town Homes------------------------------------------------//
        if(ca_set.type == "Town Home")
        {
          $.each(ca_set.coords, function(ukey, LatLng){
            if(result != undefined)
            {
              $.each( result, function( index, value ){
                  if(ca_set.lotName == value)
                  {
                    logIt('Shape coord - ' + LatLng.lat + ', ' + LatLng.lng);
                    shapeCoords.push(new google.maps.LatLng(LatLng.lat, LatLng.lng));
                  }
              });
            }
            else {
              logIt('Shape coord - ' + LatLng.lat + ', ' + LatLng.lng);
              shapeCoords.push(new google.maps.LatLng(LatLng.lat, LatLng.lng));
            }
          });
          logIt(shapeCoords.length, true)
          var shape = new google.maps.Polygon({
              paths: shapeCoords,
              strokeColor: '#FF0000',
              strokeWeight: 0,
              fillColor: plot_styles.townhouse.color,
              fillOpacity: plot_styles.townhouse.opacity,
              zIndex: 4
          });
        }
//------------------------------------------------Plot Villa Homes------------------------------------------------//
        else if (ca_set.type == "Villa Home") {
          $.each(ca_set.coords, function(ukey, LatLng){
            if(result != undefined)
            {
              $.each( result, function( index, value ){
                  if(ca_set.lotName == value)
                  {
                    logIt('Shape coord - ' + LatLng.lat + ', ' + LatLng.lng);
                    shapeCoords.push(new google.maps.LatLng(LatLng.lat, LatLng.lng));
                  }
              });
            }
            else {
              logIt('Shape coord - ' + LatLng.lat + ', ' + LatLng.lng);
              shapeCoords.push(new google.maps.LatLng(LatLng.lat, LatLng.lng));
            }
          });
          logIt(shapeCoords.length, true)
          var shape = new google.maps.Polygon({
              paths: shapeCoords,
              strokeColor: '#FF0000',
              strokeWeight: 0,
              fillColor: plot_styles.villa.color,
              fillOpacity: plot_styles.villa.opacity,
              zIndex: 4
          });
        }
//------------------------------------------------Plot Garden Homes------------------------------------------------//
        else if (ca_set.type == "Garden Home") {
          $.each(ca_set.coords, function(ukey, LatLng){
            if(result != undefined)
            {
              $.each( result, function( index, value ){
                  if(ca_set.lotName == value)
                  {
                    logIt('Shape coord - ' + LatLng.lat + ', ' + LatLng.lng);
                    shapeCoords.push(new google.maps.LatLng(LatLng.lat, LatLng.lng));
                  }
              });
            }
            else {
              logIt('Shape coord - ' + LatLng.lat + ', ' + LatLng.lng);
              shapeCoords.push(new google.maps.LatLng(LatLng.lat, LatLng.lng));
            }
          });
          logIt(shapeCoords.length, true)
          var shape = new google.maps.Polygon({
              paths: shapeCoords,
              strokeColor: '#FF0000',
              strokeWeight: 0,
              fillColor: plot_styles.garden.color,
              fillOpacity: plot_styles.garden.opacity,
              zIndex: 4
          });
        }
//------------------------------------------------Plot Courtyard Homes------------------------------------------------//
        else if (ca_set.type == "Courtyard Home") {
          $.each(ca_set.coords, function(ukey, LatLng){
            if(result != undefined)
            {
              $.each( result, function( index, value ){
                  if(ca_set.lotName == value)
                  {
                    logIt('Shape coord - ' + LatLng.lat + ', ' + LatLng.lng);
                    shapeCoords.push(new google.maps.LatLng(LatLng.lat, LatLng.lng));
                  }
              });
            }
            else {
              logIt('Shape coord - ' + LatLng.lat + ', ' + LatLng.lng);
              shapeCoords.push(new google.maps.LatLng(LatLng.lat, LatLng.lng));
            }
          });
          logIt(shapeCoords.length, true)
          var shape = new google.maps.Polygon({
              paths: shapeCoords,
              strokeColor: '#FF0000',
              strokeWeight: 0,
              fillColor: plot_styles.courtyard.color,
              fillOpacity: plot_styles.courtyard.opacity,
              zIndex: 4
          });
        }
//------------------------------------------------Plot Terrace Homes------------------------------------------------//
        else if (ca_set.type == "Terrace Home") {
          $.each(ca_set.coords, function(ukey, LatLng){
            if(result != undefined)
            {
              $.each( result, function( index, value ){
                  if(ca_set.lotName == value)
                  {
                    logIt('Shape coord - ' + LatLng.lat + ', ' + LatLng.lng);
                    shapeCoords.push(new google.maps.LatLng(LatLng.lat, LatLng.lng));
                  }
              });
            }
            else {
              logIt('Shape coord - ' + LatLng.lat + ', ' + LatLng.lng);
              shapeCoords.push(new google.maps.LatLng(LatLng.lat, LatLng.lng));
            }
          });
          logIt(shapeCoords.length, true)
          var shape = new google.maps.Polygon({
              paths: shapeCoords,
              strokeColor: '#FF0000',
              strokeWeight: 0,
              fillColor: plot_styles.terrace.color,
              fillOpacity: plot_styles.terrace.opacity,
              zIndex: 4
          });
        }

        if(shape != undefined)
        {
          var id = ca_set.lotName;
          var plot = plots[id];
          if(plot.viewable == 1) {
              google.maps.event.addListener(shape,lot_selection,function(){
                  resetShapes();
                  this.setOptions({fillColor: plot_styles.active.color, fillOpacity: plot_styles.active.opacity});
                  selected_plot = id;
                  showPlotData(selected_plot);
              });
              /*
              if (lot_selection == 'mouseover') {
                  google.maps.event.addListener(shape,"mouseout",function(){
                      resetShapes();
                      selected_plot = null;
                      showPlotData(selected_plot);
                  });
              }

          }

          google.maps.event.addListener(map,"click",function(){
            console.log('test');
              cleanMap();
          });

          shape.setMap(map);
          plot_types_shapes.push(shape);
        }
    });
  }
  */
}

function greying(values) {
  //console.log(values);
}

function setupCustomAreas() {
  logIt("Creating Custom Areas - " + $(custom_areas).length);
  $.each(custom_areas, function (key, ca_set) {
    var shapeCoords = [];
    $.each(ca_set.coords, function (cakey, LatLng) {
      shapeCoords.push(new google.maps.LatLng(LatLng.lat, LatLng.lng));
    });

    var shape = new google.maps.Polygon({
      paths: shapeCoords,
      strokeColor: "#FF0000",
      strokeWeight: 0,
      fillColor: plot_styles.custom_areas.color,
      fillOpacity: plot_styles.custom_areas.opacity,
      cursor: "normal",
      zIndex: 3,
    });
    shape.setMap(map);

    google.maps.event.addListener(shape, custom_area_selection, function (
      event
    ) {
      showCustomArea(key, event);
    });

    if (custom_area_selection == "mouseover") {
      google.maps.event.addListener(shape, "mouseout", function () {
        cleanMap();
      });
    }

    custom_areas_shapes.push(shape);
  });
}

function showCustomArea(key, event) {}
function hideCustomArea() {}

function resetShapes() {
  var plot;
  for (var x in plot_shapes) {
    plot = plots[x];
    if (plot.viewable == 1) {
      var plot_style = show_status_color ? getPlotStyle(plot) : "inactive";
      //console.log("<> " + plot_style + " " + plot_styles[plot_style].color + " " + parseFloat(plot_styles[plot_style].opacity));
      if (keyVar) {
        if (plot_style == "selected") {
          plot_shapes[x].setOptions({
            fillColor: plot_styles[plot_style].color,
            fillOpacity: parseFloat("0.3"),
          });
        } else {
          plot_shapes[x].setOptions({
            fillColor: plot_styles[plot_style].color,
            fillOpacity: parseFloat(plot_styles[plot_style].opacity),
          });
        }
      } else {
        plot_shapes[x].setOptions({
          fillColor: plot_styles[plot_style].color,
          fillOpacity: parseFloat(plot_styles[plot_style].opacity),
        });
      }
    }
  }
}

function showPlotData(plot_num) {
  $("#plot-info").fadeOut("fast", function () {
    if (plots_available && plots_available[plot_num]) {
      $("#block-stage").text(plots_available[plot_num]["stagename"]);
      $("#block-number").text(plots_available[plot_num]["lotname"]);
      $("#block-size").html(
        plots_available[plot_num]["area"] + "m<sup>2</sup>"
      );

      var price = parseInt(plots_available[plot_num]["price"]);

      var price_str = "";
      if (price == 0) {
        price_str = "N/A";
      } else {
        price_str = "$" + price.formatMoney(0);
      }
      $("#block-price").text(price_str);

      logIt(plot_info + ": " + plot_num + " = " + plot_info[plot_num]);
      togglePlotDetails(plot_num);

      $("#plot-info").fadeIn("fast");
    }
  });
}

function togglePlotDetails(plot_num) {
  if (plot_info[plot_num]) {
    $("#lot-diagram-text")
      .click(openInModal)
      .attr("rel", "./pdfs/" + plot_info[plot_num]["file"])
      .show();
  } else {
    $("#lot-diagram-text").hide().attr("rel", "");
  }
}

function loadPlotInfo() {}

function openInModal(url) {
  if (url) {
    if ($("#modal-file").length == 0) {
      $("body").append(
        '<iframe id="modal-file"></iframe><div id="modal-close" title="Close">close</div>'
      );
      $("#modal-underlay, #modal-close").click(closeAllModal);
    }
    $("#modal-file").attr("src", url).show();
    $("#modal-underlay, #modal-close").show();
  }
}

function closeModal() {
  //    $("#modal-file, #modal, #modal-simple-container").empty();
  $("#modal-underlay, #modal, #modal-file, #modal-close, #enquiry-form").hide();
}

function closeAllModal() {
  if (typeof closeModalExtra == "function") {
    closeModalExtra();
  } else {
    closeModal();
  }
}
function cleanMap() {
  deselectLot();
  hideCustomArea();
  closeModal();
}

Number.prototype.formatMoney = function (c, d, t) {
  var n = this,
    c = isNaN((c = Math.abs(c))) ? 2 : c,
    d = d == undefined ? "." : d,
    t = t == undefined ? "," : t,
    s = n < 0 ? "-" : "",
    i = parseInt((n = Math.abs(+n || 0).toFixed(c))) + "",
    j = (j = i.length) > 3 ? j % 3 : 0;
  return (
    s +
    (j ? i.substr(0, j) + t : "") +
    i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) +
    (c
      ? d +
        Math.abs(n - i)
          .toFixed(c)
          .slice(2)
      : "")
  );
};

function setToJSON() {
  var coords = $("#debug").val();
  sets = coords
    .replace(/\n/g, "")
    .replace(/\(/g, "[")
    .replace(/\)/g, "]")
    .replace(/\]\[/g, "],[");
  sets = '{"id": "","coords": [' + sets + "]}";
  $("#debug").val(sets);
}

function logIt(text, override) {
  if (logging == true || override === true) {
    //console.log(text);
  }
}

function getLotCenter(plot_num) {
  if (plot_num && plots[plot_num]) {
    return plots[plot_num].center;
  }
}

function loadLotEnquiryForm() {
  var lot_id = "";
  if ($("#modal-simple") && $("#modal-simple").attr("lot")) {
    lot_id = $("#modal-simple").attr("lot");
  }
  loadEnquiryForm(lot_id);
}

function loadEnquiryForm(lot_id) {
  if ($("#enquiry-form").length == 0) {
    $("body").append(
      '<div id="enquiry-form"><div id="enquiry-form-close"></div><iframe src=""></iframe></div>'
    );
  }
  $("#enquiry-form, #modal-underlay").show();
  $("#modal-underlay, #enquiry-form-close").click(function () {
    $("#enquiry-form, #modal-underlay").hide();
    $("#enquiry-form iframe").attr("src", "");
  });

  var url = enquiry_url;
  var url = "enquiry.php";
  if (lot_id) {
    console.log(lot_id);
    url += "?lotID=" + lot_id;
  }
  $("#enquiry-form iframe").attr("src", url);
}

function loadPriceEnquiryForm(lot_id) {
  if ($("#enquiry-form").length == 0) {
    $("body").append(
      '<div id="enquiry-form"><div id="enquiry-form-close"></div><iframe src=""></iframe></div>'
    );
  }
  $("#enquiry-form, #modal-underlay").show();
  $("#modal-underlay, #enquiry-form-close").click(function () {
    $("#enquiry-form, #modal-underlay").hide();
    $("#enquiry-form iframe").attr("src", "");
  });

  var url = enquiry_url;
  var url = "enquiry.php?pricelistrequest=1";
  if (lot_id) {
    console.log(lot_id);
    url += "?lotID=" + lot_id;
  }
  $("#enquiry-form iframe").attr("src", url);
}
