var features, icon, selectControl, map, vehicles, rsu, lights;
var ws = null;
var testMode = false;
var workingTest = false;

var nwBoundLon, nwBoundLat, seBoundLon, seBoundLat;

var message_counter = 0;

//var host = window.location.hostname;


$( document ).ready(function() {
	$("#map").css("height",$(window).height()-50);
	$("#map").css("width",$(window).width()+20);
});

$( window ).resize(function() {
	$("#map").css("height",$(window).height()-50);
	$("#map").css("width",$(window).width());
});

/************************************************************/
//On Websocket Open
/************************************************************/

function OpenSocket(){
	
	if (ws != null){
		ws.close();
	}

    var hostname = window.location.host.split(":")[0];
    var context = window.location.pathname.split("/")[1];
    var ws_loc = "wss://" + hostname + ":443/" + context + "/websocket";
    ws = new WebSocket(ws_loc);
    
	ws.onopen = function() {
		document.getElementById("mapIndicator").className = "fa fa-cog fa-spin icon-yellow";
		document.getElementById("playApp").className = "fa fa-cog fa-spin";
		if (testMode) {
			ws.send("TEST"); // Web Socket is connected, send data
		} else {
			ws.send("SUBSCRIBE: { \"systemSubName\": \"SDC 2.3\", \"dialogID\": -1, \"resultEncoding\": \"full\" }");
		}
	};
	
    ws.onmessage = function (evt){
    	if (testMode) {
    		workingTest = true;
    	}
        try {
            var open_msg = JSON.parse(evt.data);
        } catch (e) {
            console.log("invalid json: " + e.message);
            return;
        }

        if (open_msg.hasOwnProperty('intersection')){
        	$.each(open_msg.roads, function(key, val){
        		AddLightFeature(val.long,val.lat,val.lightColor)
        	});
        } else {
        	AddCarFeature(open_msg.long,open_msg.lat,open_msg.speed,open_msg.heading,open_msg.tempId, open_msg.groupId);
        }
    };
    
    ws.onclose = function() {
	    document.getElementById("mapIndicator").className = "fa fa-circle icon-red";
	    document.getElementById("playApp").className = "fa fa-play-circle";
    	if (testMode) {
    		if(workingTest){
                alert("Successful test. Connection is closed.");
                workingTest = false;
                testMode = false;
                clearInterval(intervalHandle);
            } else {
            	testMode = false;
                alert("Failed test. Connection is closed.");
                clearInterval(intervalHandle);
            }
    	} else {
    		alert("Websocket closed.");
    		clearInterval(intervalHandle);
    	}
    	
        message_counter = 0;
        $('#legend #message_counter').text(message_counter);
    };
       
}

/************************************************************/
//Initial Page Load - Open Layers
/************************************************************/
$(function() {
    getConfig();
});

function initMap() {
    nwBoundLon = user_config.bounds.nwBoundLon;
    nwBoundLat = user_config.bounds.nwBoundLat;
    seBoundLon = user_config.bounds.seBoundLon;
    seBoundLat = user_config.bounds.seBoundLat;

    map = new OpenLayers.Map("map");
    var mapnik         = new OpenLayers.Layer.OSM();
    var fromProjection = new OpenLayers.Projection("EPSG:4326");   // Transform from WGS 1984
    var toProjection   = new OpenLayers.Projection("EPSG:900913"); // to Spherical Mercator Projection
    bounds = new OpenLayers.Bounds();
    bounds.extend(new OpenLayers.LonLat(nwBoundLon,nwBoundLat).transform( fromProjection, toProjection));
    bounds.extend(new OpenLayers.LonLat(seBoundLon,seBoundLat).transform( fromProjection, toProjection));
    bounds.toBBOX();
    
    //Vehicle Layer with popup on selection
    vehicles = new OpenLayers.Layer.Vector("Vehicles",{
        eventListeners:{
            'featureselected':function(evt){
                var feature = evt.feature;
                var popup = new OpenLayers.Popup("popup",
                    OpenLayers.LonLat.fromString(feature.geometry.toShortString()),
                    new OpenLayers.Size(150,60),
                        "<div>TempID: " + feature.attributes.tempID + "<br>groupID: " + feature.attributes.groupID + "<br>Speed: " + feature.attributes.speed +"<br>Heading: " + feature.attributes.heading+"</div>",
                    true
                );
                feature.popup = popup;
                map.addPopup(popup);
            },
            'featureunselected':function(evt){
                var feature = evt.feature;
                map.removePopup(feature.popup);
                feature.popup.destroy();
                feature.popup = null;
            }
        }
    });

    //RSU Layer which comes from KML file
    rsu = new OpenLayers.Layer.Vector("RSU",{
        strategies: [new OpenLayers.Strategy.Fixed()],
        protocol: new OpenLayers.Protocol.HTTP({
            url: user_config.paths.kml,
            format: new OpenLayers.Format.KML({
                extractStyles: true,
                extractAttributes: true,
                maxDepth: 2
            })
        })
    });
    
    //Lights Layer which appears only on zoom
    lights = new OpenLayers.Layer.Vector("Lights");
    
    var selectStyle = OpenLayers.Feature.Vector.style['select'];

    // create the select feature control
    var selector = new OpenLayers.Control.SelectFeature(vehicles,{
        hover:true,
        autoActivate:true
    });

    selector.selectStyle = selectStyle;

    map.addLayer(mapnik);
    map.zoomToExtent(bounds);
    map.addLayer(vehicles);
    map.addLayer(rsu);
    map.addLayer(lights);
    map.addControl(new OpenLayers.Control.OverviewMap());
    map.addControl(selector);
    selector.activate();
    
    //For light layer toggle
    map.events.register("zoomend", map, zoomChanged);
    
    // set the initial value for the message counter
    $('#legend #message_counter').text(message_counter);

}

/************************************************************/
// Add and remove vehicles
/************************************************************/
function AddCarFeature(lon,lat,speed,heading,tempId, groupId) {

	if (lat > 90.0 || lat < -90.0 || lon > 180.0 || lon < -180.0) {
	  return;
	}
	
    var color = "#008000";

    if (speed >= 0 && speed < 5){
    	color = "#FF0000";
     } else if (speed == 10000){
    	 color = "#000000";
     } else if (speed >= 5 && speed < 21){
    	 color = "#FDD017";
     }

    var point = new OpenLayers.Geometry.Point( lon, lat).transform(new OpenLayers.Projection("EPSG:4326"),new OpenLayers.Projection("EPSG:900913"));
    var style = OpenLayers.Util.applyDefaults({graphicName: "circle", strokeColor: color, fillColor: color, strokeWidth: 1, fillOpacity:.8},OpenLayers.Feature.Vector.style["default"]);
    var vehicle = new OpenLayers.Feature.Vector(point,null,style);
    vehicle.attributes={"timer":new Date().getTime(),"speed":speed,"heading":heading,"tempID":tempId, "groupID":groupId};
    
    setTimeout( function() {
		function destroy() {
			vehicles.removeFeatures(vehicle);
		}
    	destroy(vehicle);
    }, user_config.features.map.timers.vehicles);
    
    vehicles.addFeatures(vehicle);
    
    message_counter++;
    $('#legend #message_counter').text(message_counter);
}

/************************************************************/
//Add and remove lights
/************************************************************/
function AddLightFeature(lon,lat,rawColor) {

	if (lat > 90.0 || lat < -90.0 || lon > 180.0 || lon < -180.0) {
	  return;
	}
	
 var color = "#008000";

 switch (rawColor){
 case "red":
	 color = "#990000";
	 break;
 case "yellow":
	 color = "#CC9900";
	 break;
 case "green":
	 color = "#006600";
	 break;
 default:
	 break;
 };

 var point = new OpenLayers.Geometry.Point( lon, lat).transform(new OpenLayers.Projection("EPSG:4326"),new OpenLayers.Projection("EPSG:900913"));
 var lightStyle = OpenLayers.Util.applyDefaults({graphicName: "square", strokeColor: '#000000', fillColor: color, strokeWidth: 1, fillOpacity:1},OpenLayers.Feature.Vector.style["default"]);
 var light = new OpenLayers.Feature.Vector(point,null,lightStyle);
 light.attributes={"timer":new Date().getTime()};
 lights.addFeatures(light);
 
 setTimeout( function() {
		function destroy() {
			vehicles.removeFeatures(light);
		}
	destroy(light);
 }, user_config.features.map.timers.signals);
 
 message_counter++;
 $('#legend #message_counter').text(message_counter);
}

/** ********************************************************* */
// Show/Hide various layers
/************************************************************/

function ToggleRSU(){
    if(document.getElementById("rsuIcon").className == "fa fa-square-o"){
        rsu.setVisibility(true);
        document.getElementById("rsuIcon").className = "fa fa-check-square-o";
    } else {
        rsu.setVisibility(false);
        document.getElementById("rsuIcon").className = "fa fa-square-o";
    }
}

/************************************************************/
// Reset positions
/************************************************************/

function Reset() {
    var fromProjection = new OpenLayers.Projection("EPSG:4326");   // Transform from WGS 1984
    var toProjection   = new OpenLayers.Projection("EPSG:900913"); // to Spherical Mercator Projection
    resetBounds = new OpenLayers.Bounds();
    resetBounds.extend(new OpenLayers.LonLat(nwBoundLon,nwBoundLat).transform( fromProjection, toProjection));
    resetBounds.extend(new OpenLayers.LonLat(seBoundLon,seBoundLat).transform( fromProjection, toProjection));
    resetBounds.toBBOX();

    map.zoomToExtent(resetBounds);
}

function SidebarClick(long, lat){
    var fromProjection = new OpenLayers.Projection("EPSG:4326");   // Transform from WGS 1984
    var toProjection   = new OpenLayers.Projection("EPSG:900913"); // to Spherical Mercator Projection
    var position       = new OpenLayers.LonLat(long,lat).transform( fromProjection, toProjection);
    var zoom           = 10;

    map.setCenter(position, zoom );
}

function BoundingBoxSidebarClick(){

    var nwLat = document.getElementById('nwLat-bbox').value;
    var nwLong = document.getElementById('nwLong-bbox').value;
    var seLat = document.getElementById('seLat-bbox').value;
    var seLong = document.getElementById('seLong-bbox').value;


    var fromProjection = new OpenLayers.Projection("EPSG:4326");   // Transform from WGS 1984
    var toProjection   = new OpenLayers.Projection("EPSG:900913"); // to Spherical Mercator Projection
    userBounds = new OpenLayers.Bounds();
    userBounds.extend(new OpenLayers.LonLat(nwLong,nwLat).transform( fromProjection, toProjection));
    userBounds.extend(new OpenLayers.LonLat(seLong,seLat).transform( fromProjection, toProjection));
    userBounds.toBBOX();

    map.zoomToExtent(userBounds);
}

function CenterPointSidebarClick(){

    var centerLat = document.getElementById('centerLat').value;
    var centerLong = document.getElementById('centerLong').value;
    var zoomLevel = document.getElementById('zoomLevel').value;

    var fromProjection = new OpenLayers.Projection("EPSG:4326");   // Transform from WGS 1984
    var toProjection   = new OpenLayers.Projection("EPSG:900913"); // to Spherical Mercator Projection
    var position       = new OpenLayers.LonLat(centerLong,centerLat).transform( fromProjection, toProjection);
    var zoom           = zoomLevel;

    map.setCenter(position, zoom );
}

/************************************************************/
// Websocket Test
/************************************************************/

function WebSocketTest() {
	if ("WebSocket" in window) {
		alert("WebSocket is supported by your Browser! Test will run for 15 seconds. Three dots will appear near Novi, MI.");
		testMode = true;
		OpenSocket();
		setTimeout(function(){
			ws.close();
		},15000);

		intervalHandle = setInterval(function() {

			switch (ws.readyState) {
			case WebSocket.CONNECTING:
				console.log(ws.readyState);
				break;
			case WebSocket.OPEN:
				console.log(ws.readyState);
				break;
			case WebSocket.CLOSING:
				console.log(ws.readyState);
				break;
			case WebSocket.CLOSED:
				console.log(ws.readyState);
				break;
			default:
				break;
			};

		}, 1000);
	} else {
		alert("WebSocket NOT supported by your Browser!"); // The browser
															// doesn't support
															// WebSocket
	}
}

/** ********************************************************* */
// Run and Stop Demo
/** ********************************************************* */
var intervalHandle = null;
var timer = 0;

function RunWebsocketDemo() {
	$('#runTest').hide();
	clearInterval(intervalHandle);
	OpenSocket();
	intervalHandle = setInterval(function() {

		switch (ws.readyState) {
		case WebSocket.CONNECTING:
			console.log(ws.readyState);
			break;
		case WebSocket.OPEN:
			console.log(ws.readyState);
			break;
		case WebSocket.CLOSING:
			console.log(ws.readyState);
			break;
		case WebSocket.CLOSED:
			console.log(ws.readyState);
			break;
		default:
			break;
		};

		timer = timer + 1;
		if (timer >= 15000) {
			SendHeartBeat();
			timer = 0;
		}

	}, 1000);
}

function StopWebsocketDemo(){
	$('#runTest').show();
    ws.close();
    clearInterval(intervalHandle);
}

function SendHeartBeat(){
    ws.send("heartbeat");
}

function Clear(){
    vehicles.destroyFeatures();
    
    message_counter = 0;
    $('#legend #message_counter').text(message_counter);
}

/************************************************************/
// Legend Toggle
/************************************************************/

function LegendToggle(){

    var className = document.getElementById("legend").className;

    if (className == "shown"){
        document.getElementById("legendIcon").className = "fa fa-square-o";
        document.getElementById("legend").className = "not-shown";
        $("#legend").fadeOut("fast");
    } else if (className == "not-shown"){
        document.getElementById("legendIcon").className = "fa fa-picture-o";
        document.getElementById("legend").className = "shown";
        $("#legend").fadeIn("fast");
    }
};

$(document).ready(function() {
    $(window).resize(function() {
        if($(window).width() <= 500) {
            document.getElementById("legendIcon").className = "fa fa-square-o";
            document.getElementById("legend").className = "not-shown";
            $("#legend").hide();
        }
    })
});


/************************************************************/
// Sidebar Toggle
/************************************************************/

function toggle() {
    var divPosition = $("#sidebar").offset();
    if(divPosition.left < 0){
        $("sidebar").show();
        $("#sidebar").animate({"left":12},1000);
    } else {
        $("#sidebar").animate({"left":-800},1000);
        $("sidebar").hide();
    }
};

/************************************************************/
// Sidebar Cities
/************************************************************/

var citiesSearch = [];

$.getJSON("external/KML/CITY_LOCATIONS.geojson", function( data ) {
    $.each(data, function (key, val) {
        $("#cities-table tbody").append('<tr><td class="State">' + val.properties.STATE + '</td><td class="City"><a href="#" onclick="SidebarClick(' + val.geometry.coordinates[0] + ', ' + val.geometry.coordinates[1]+ ')">' + val.properties.NAME + '</a></td></tr>');
        citiesSearch.push({
        	State: val.properties.STATE,
            City: val.properties.NAME
        });
    });
    var options = {valueNames:["State","City"]};
    var cityList = new List('cities',options);
});

/************************************************************/
//Zoom Changed
/************************************************************/

function zoomChanged() {
  zoom = map.getZoom();
  if (zoom >= 15) {
    lights.setVisibility (true);
  }
  else if (zoom < 15) {
    lights.setVisibility (false);
  }
}

/**************************************************************
 * Configuration
 **********************/
function main()
{
    console.log(user_config);

    importFiles(user_config.paths);
    toggleFeatures(user_config.features);

    initMap();
}

function importFiles( path )
{
    if (document.createElement && document.getElementsByTagName) {
        importJs(path.js);
        importCss(path.css);
        importImg(path.img);
    } else {
        alert("Unable to import necessary css and js files.")
    }
}

function importCss( path )
{
    var link = document.createElement("link");
    link.href = path;
    link.type = "text/css";
    link.rel = "stylesheet";
    document.getElementsByTagName("head")[0].appendChild(link);
}

function importJs( path )
{
    var script = document.createElement('script');
    script.src = path;
    document.getElementsByTagName("body")[0].appendChild(script);
}

function importImg( path )
{
    $("#headerimg").attr("src", path);
}

function toggleFeatures( features )
{
    var active_tab_shown = false;

    var query = features.query.enabled;
    var subscription = features.subscription.enabled;
    var deposit = features.deposit.enabled;
    var map = features.map.enabled;
    
    if( query ) {
        $("#query-tab").addClass("active").show();
        $("#Query").addClass("active");
        active_tab_shown = true;
    } else {
        $("#query-tab").hide();
    }
    if( subscription && !active_tab_shown) {
        $("#subscription-tab").addClass("active").show();
        $("#Subscribe").addClass("active");
        active_tab_shown = true;
    } else if( subscription ) {
        $("#subscription-tab").show();
    } else if( !subscription ){
        $("#subscription-tab").hide();
    }
	if( deposit && !active_tab_shown) {
	    $("#deposit-tab").addClass("active").show();
	    $("#Deposit").addClass("active");
	    active_tab_shown = true;
	} else if( deposit ) {
	    $("#deposit-tab").show();
	} else if( !deposit ){
	    $("#deposit-tab").hide();
	}
    if( map && !active_tab_shown) {
        $("#map-tab").addClass("active").show();
        $("#mapTools").show();
        $("#Map-App").addClass("active");
        active_tab_shown = true;
    } else if( map ) {
        $("#map-tab").show();
    } else if( !map ) {
        $("#map-tab").hide();
        $("#mapTools").hide();
    }

    if( !active_tab_shown ) {
        alert("Please set at least one active feature in the configuration")
    }
}
