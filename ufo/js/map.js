/**
 * @todo add tooltip to map pointers
 * @todo try supercluster
 */

let decade;
let data;
let stateData;
let spottings;
let dateData;
let curDecade;
let curDecadeSights;
let newData = [];

MainMap = function(_data, _year){
    this.data = _data;
    this.year = _year;
    this.fullData = this.data.full;
    data = this.fullData;
    decade = this.year;
    this.stateData = new StateData(data);
    stateData = this.stateData;
	this.initVis();
}

var geojson;
var map;
var info;


MainMap.prototype.initVis = function(){
	var vis = this;
	map = L.map('map').setView([37.8, -96], 4);

	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	   attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
	   tileSize: 512,
       zoomOffset: -1
	}).addTo(map);

    const worker = new Worker('js/worker.js');
    let ready = false;

    function update() {
        if (!ready) return;
        const bounds = map.getBounds();
        worker.postMessage({
            bbox: [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
            zoom: map.getZoom()
        });
    }

	d3.json("data/us-states.json").then(function(data){
		L.geoJson(data).addTo(map);

		L.geoJson(data, {style: style}).addTo(map);

		geojson = L.geoJson(data, {
		    style: style,
		    onEachFeature: onEachFeature,
            pointToLayer: createClusterIcon
		}).addTo(map);
    });

    worker.onmessage = function (e) {
        if (e.data.ready) {
            ready = true;
            update();
        } else if (e.data.expansionZoom) {
            map.flyTo(e.data.center, e.data.expansionZoom);
        } else {
            geojson.clearLayers();
            geojson.addData(e.data);
        }
    };

    info = L.control();

    info.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
        this.update();
        return this._div;
    };

    // method that we will use to update the control based on feature properties passed
    info.update = function (props, sights) {
        this._div.innerHTML = '<h4>' + (curDecade ? curDecade : decade) + '</h4><h5>' + (curDecadeSights ? curDecadeSights : 0) +
            ' Total UFO Sightings</h5>' +  (props ? '<b>' + props.name + '</b>' : 'Hover over a state');
    };

    info.addTo(map);

    vis.createPopup = function(location, date, shape) {
        return `<strong>${location}</strong> <br /> Date: ${date} <br /> Shape: ${shape}`;
    }

    spottings = L.layerGroup().addTo(map);
    this.updateDecadeData(decade);
    this.updateMarkers(data, decade);
}

function createClusterIcon(feature, latlng) {
    if (!feature.properties.cluster) return L.marker(latlng);

    const count = feature.properties.point_count;
    const size =
        count < 100 ? 'small' :
        count < 500 ? 'medium' : 'large';
    const icon = L.divIcon({
        html: `<div><span>${  feature.properties.point_count_abbreviated  }</span></div>`,
        className: `marker-cluster marker-cluster-${  size}`,
        iconSize: L.point(40, 40)
    });

    return L.marker(latlng, {icon});
}



function style(feature) {
    return {
        weight: 2,
        opacity: 1,
        color:'#212729'
    };
}


function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#51FFC0',
        dashArray: '',
        fillOpacity: 0.7,
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }

    info.update(layer.feature.properties);
}

function resetHighlight(e) {
    geojson.resetStyle(e.target);

    info.update();
}


function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
    stateData.addState({name: e.target.feature.properties.name, abbv: e.target.feature.properties.state, dataByYear: [0, 0, 0, 0, 0, 0, 0, 0, 0], decades: [1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010]});

    $(document).ready(function() {
        console.log("click!");
        //TODO: somehow make popups???? ugh
    });
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}

MainMap.prototype.updateMarkers = function(decData, year){
    curDecade = year;
    var vis = this;
    var totalSights = 0;

    let beginningYear = 0;

    //TODO: RIGHT NOW THE 2000s READ AS ZERO AND THAT MESSES EVERYTHING UP.

    if (year >= 2000){beginningYear = year - 2000;} else{beginningYear  = year - 1900;}

    spottings.clearLayers();

    var tempDec = decData.filter(d => d.Recorded.split('/')[2].split(' ')[0] == beginningYear);
    tempDec.forEach(spotting => {
        spotting.City = spotting.City.toLowerCase()
        .split(' ')
        .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
        .join(' ');
        let location = spotting.City + ", " + spotting.State.toUpperCase();
        let marker = L.marker([spotting.LA, spotting.LO])
                      .bindPopup(vis.createPopup(location, spotting.Recorded, spotting.Shape));

        let icon = marker.options.icon;
        icon.options.iconSize = [25/2, 41/2];
        icon.options.iconAnchor = [25/4, 41/2];
        icon.options.shadowSize =[41/2, 41/2];
        marker.setIcon(icon);

        marker.addTo(map);

        spottings.addLayer(marker);

        totalSights += 1;
    });
    curDecadeSights = totalSights;

    info.update();
}


MainMap.prototype.updateDecadeData = function(y){
  let start = 0;
  if (y >= 2000){
    start = y - 2000;
  }
  else {
    start  = y - 1900;
  }
  dateData = data.filter(d => d.Recorded.split('/')[2].split(' ')[0] == start);
}

MainMap.prototype.updateShapes = function(shape){
  this.updateDecadeData(curDecade);
  var ifRemove = false; var i = 0;
  while (i < newData.length){
    if (newData[i].Shape === shape.toString()){
      newData.splice(i, 1);
      ifRemove = true;
    }
    else { i++; }
  }
  if (!ifRemove){
    let shapeData = dateData.filter(function(d){
      return d.Shape === shape.toString()
    });
    newData = newData.concat(shapeData);
  }
  if(!$('.shapeButton').hasClass('highlighted')){
    this.updateMarkers(dateData, curDecade);
    console.log("nothing!");
  }
  else {
    this.updateMarkers(newData, curDecade);
  }
}
