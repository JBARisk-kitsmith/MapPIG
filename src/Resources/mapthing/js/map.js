/**
* MapController
*
*
* Demo Geoserver URL and map layer: 
*
* http://localhost:8080/geoserver/geotiff_maps/gwc/service/wmts
* geotiff_maps:River10Q200D_cm_lzw
*/


// global namespace
var MT = MT || {};



/**
 * Register a MapController as the main instance
 */
MT._registerMap = function(mapCtrl){
    MT._mCtrl = mapCtrl;
}

MT.getMap = function(){
    return MT._mCtrl;
}

/**
* Controls creation of map, base layers and overlays
*/
MT.MapController = function (id){

    if (typeof(id)==='undefined') id = 'map';

    this.overLays = {}; // Holds any overlay layers added
    this.jcalfLayers = [];
    //var tonerLite = new L.StamenTileLayer("toner-lite");
    var jbaBasemap = L.tileLayer("https://api.mapbox.com/v4/ianmillinship.8850fe41/{z}/{x}/{y}.png256?access_token=pk.eyJ1IjoiaWFubWlsbGluc2hpcCIsImEiOiJjaWg0eWx6OGwwMHVua3JrcjU1ZnA4bjFlIn0.mcnkt1qUDw7cH0cmhxcZ8w",
                                 {
                                    attribution: "&copy; <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> &copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>"
                                 });

    var satBasemap = L.tileLayer("https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiaWFubWlsbGluc2hpcCIsImEiOiJjaWg0eWx6OGwwMHVua3JrcjU1ZnA4bjFlIn0.mcnkt1qUDw7cH0cmhxcZ8w",
                                 {
                                    attribution: "&copy; <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> &copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>"
                                 });
    var streetSatBasemap = L.tileLayer("https://api.mapbox.com/v4/mapbox.streets-satellite/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiaWFubWlsbGluc2hpcCIsImEiOiJjaWg0eWx6OGwwMHVua3JrcjU1ZnA4bjFlIn0.mcnkt1qUDw7cH0cmhxcZ8w",
                                 {
                                    attribution: "&copy; <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> &copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>"
                                 });
    this.geocoder = new google.maps.Geocoder();

    // initialise the map
    this._map = L.map(id, {
                      zoom: 13,
                      center: [53.952612,-2.090103],
                      layers: [jbaBasemap],
                      zoomControl: false,
                      attributionControl: true,
                      loadingControl: true
                    });

    // Add a zoom control
    this.zoomControl = L.control.zoom({
      position: "bottomright"
    }).addTo(this._map);

    // Add a layer control with the base layers
    var baseLayers = {
      "jba-rml": jbaBasemap,
      "satellite": satBasemap,
      "streets-satellite": streetSatBasemap,
    };


    this.sidebar = L.control.sidebar('sidebar').addTo(this._map);
    this.layerControl = L.control.layerpanel(baseLayers, this.overLays, 'sb-layers').addTo(this._map);

    this.searchControl = new L.Control.Search({
                                                  sourceData: this.googleGeocoding.bind(this),
                                                  formatData: this.formatJSON.bind(this),
                                                  markerLocation: false,
                                                  circleLocation: false,
                                                  autoType: false,
                                                  autoCollapse: true,
                                                  position: 'bottomright',
                                                  minLength: 2,
                                                  zoom: 10
                                              })
    this._map.addControl(this.searchControl);
}

/**
  * Disable all map interaction
  *
  */
MT.MapController.prototype.disable = function(){
    this._map.scrollWheelZoom.disable();
    this._map.dragging.disable();
    this._map.touchZoom.disable();
    this._map.doubleClickZoom.disable();
    this._map.boxZoom.disable();
    this._map.keyboard.disable();
}

/**
  * Enable all map interaction
  *
  */
MT.MapController.prototype.enable = function(){
    this._map.scrollWheelZoom.enable();
    this._map.dragging.enable();
    this._map.touchZoom.enable();
    this._map.doubleClickZoom.enable();
    this._map.boxZoom.enable();
    this._map.keyboard.enable();
}

/**
 * addOverlay
 *      Add an overlay WMS layer to the map
 */
MT.MapController.prototype.addWmsOverlay = function (host, layerName, format){
    // Get the values from the hazards-sidebar if they are not passed in
    if (typeof host === 'undefined')
        host = $("#hazardmaphost").val();

    if (typeof layerName === 'undefined')
        layerName = $("#layer").val();        

    if (typeof format == 'undefined')
        format = $("#format").val();

    var displayName;    
    var layer = L.tileLayer.wms(host,
        {
        maxZoom: 30,
        layers: layerName,
        format: format,
        transparent: true,
        version: '1.1.0',
        attribution: "&copy 2015 JBA Risk Management Ltd"
    });
    var layerNameParts = layerName.split(":");
    if (layerNameParts.length === 2)
    {
    displayName = layerNameParts[1];
    }
    else
    {
    displayName = layerName;
    }


    this.overLays[displayName] = layer;
    this._map.addLayer(layer);
    this.layerControl.addOverlay(layer, displayName);
}

MT.MapController.prototype.addOverlay = function (layer, name){
    this._map.addLayer(layer);
    this.layerControl.addOverlay(layer, name);
}

/**
 * Remove one of the overlays from the map via its' name
 */
MT.MapController.prototype.removeOverlay = function(displayName){
    this._map.removeLayer(this.overLays[displayName])
}

MT.MapController.prototype.googleGeocoding = function(text, callResponse){
    this.geocoder.geocode({address: text}, callResponse);
}

MT.MapController.prototype.formatJSON = function(rawjson){
    var json = {},
        key, loc, disp = [];
    for(var i in rawjson)
    {
        key = rawjson[i].formatted_address;

        loc = L.latLng( rawjson[i].geometry.location.lat(), rawjson[i].geometry.location.lng() );

        json[ key ]= loc;	//key,value format
    }
    return json;
}

MT.showMessage = function(msg, title){
    bootbox.dialog({ message: msg,
                     title: title,
                     buttons: {main: {label: "Ok",
                           className: "btn-primary"}}
                   });
}

// Icon creation function for cluster layers
function createIcon(data, category){

    return L.icon({
        iconUrl: 'mapthing/img/ffa500-marker-32.png',
        iconSize:[32,32],
        iconAnchor: [1,16],
        popupAnchor: [16,0]
    });

}

function showModal(id){
    $("#" + id).modal("show");
}

function initMap(){

    //Setup tooltips!
     $('[data-toggle="tooltip"]').tooltip();

    // Sets up the actual map
    var mapCtrl = new MT.MapController();
    MT._registerMap(mapCtrl);

    // Button events
    $(window).resize(function() {
      sizeLayerControl();
    });

    $("#db-submit").click(function() {
        var host = $("#host").val();
        var port = $("#port").val();
        var user = $("#user").val();
        var pwd = $("#pwd").val();

        var jcalflyr = new MT.DataLayer(mapCtrl);
        jcalflyr.jcalf(host, port, user, pwd)
        // connect signals from bridge
    });

    MT.Dom.addFileOpenHandler("open-file", "file-path");


    $("#choose-file").click(function(){
        BRIDGE.connectToPathField(document.getElementById("choose-file-path"));
        BRIDGE.showSaveFileDialog();

    });

    $("#csv-submit").click(function(){
        var path = $("#file-path").text();
        var csvlyr = new MT.CsvLayer(mapCtrl, path);
    });

    $("#print-submit").click(function(){
        var path = $("#choose-file-path").text();
        console.log(path);
        BRIDGE.printRequest(path);
    });

    $("#overlay-submit").click(function() {
        console.log("overlay submit");
        mapCtrl.addWmsOverlay();
    });

    $("#geocode-submit").click(function() {
        mapCtrl.geocode($("#address").val());
    });


    $("#summarize-view-btn").click(function (){

        $("#lecModal").on('shown.bs.modal',
                            function(event)
                            {
                               getResultsForRisksInView();
                            }).on('hidden.bs.modal',
                            function(event)
                            {
                            // reset canvas size
                            var modal = $(this);
                            var canvas = modal.find('.modal-body canvas');
                            canvas.attr('width','568px').attr('height','300px');
                            // destroy modal
                            lecChart.clear();
                            lecChart.destroy();
                            $(this).data('bs.modal', null);
                            });
        showModal("lecModal");
    });

    function sizeLayerControl() {
      $(".leaflet-control-layers").css("max-height", $("#map").height() - 50);
    }
}
