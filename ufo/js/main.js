/**
 * @todo add label to shape filters
 * @todo add popup that tells the user if there are no ufo sightings for that year or shape
 * @todo add loading animation
 */
var mainMap;
var timeline;
var shapeArray = [];

let startingYear = 1930;
/**
 *
 * @param {String} state state we want to check
 * @param {String[]} region the region we are looping through
 *
 * Checks if the given state is located in a particular region
 */

function isInRegion(state, region) {
    let inRegion = false;
    for (var i = 0; i < region.length; i++) {
        if (state === region[i]) {
            inRegion = true;
        }
    }
    return inRegion;
}

d3.csv("data/ufo-scrubbed-geocoded-time-standardized.csv").then(data => {

    data = data.filter(d => d.Country === "us" && d.Recorded.includes('/'));
    let west = ['wa', 'or', 'ca', 'nv', 'ut', 'co', 'wy', 'id', 'mt'];
    let southwest = ['az', 'nm', 'tx', 'ok'];
    let midwest = ['nd', 'sd', 'ne', 'ks', 'mo', 'mn', 'ia', 'wi', 'il', 'mi', 'in', 'oh'];
    let southeast = ['ar', 'la', 'ms', 'al', 'ga', 'fl', 'sc', 'nc', 'tn', 'ky', 'va', 'wv'];
    let northeast = ['md', 'pa', 'de', 'nj', 'ct', 'ri', 'ma', 'nh', 'me', 'vt', 'ny'];

    let westData = data.filter(d => isInRegion(d.State, west));
    let southwestData = data.filter(d => isInRegion(d.State, southwest));
    let midwestData = data.filter(d => isInRegion(d.State, midwest));
    let southeastData = data.filter(d => isInRegion(d.State, southeast));
    let northeastData = data.filter(d => isInRegion(d.State, northeast));

    let regionData = {
        west: westData,
        southwest: southwestData,
        midwest: midwestData,
        southeast: southeastData,
        northeast: northeastData,
        full: data
    }

    fillShapeArray(data);

    mainMap = new MainMap(regionData, startingYear);
    timeline = new Timeline(startingYear);

});




function fillShapeArray(data){

	let divWidth = document.getElementById("shape_select").offsetWidth
	let inc = divWidth/13;

	data.forEach(function(d, i){
		if (!shapeArray.includes(d.Shape)){
			shapeArray.push(d.Shape)
		}
	})
	//console.log(shapeArray);

	let betterShapeArray = shapeArray.filter(d => d != "" && d != "unknown" && d != "changing" && d != "changed" && d != "other")
	betterShapeArray.push("unknown");
	betterShapeArray.push("other");
	console.log(betterShapeArray);

	let shapeSvg = d3.select("#shape_select").append("svg")
	.attr("width", divWidth).attr("height", 120);

	shapeSvg.append("text")
			.attr("id", "shapeTitle")
			.attr("x", 5)
			.attr("y", 30)
			.text("FILTER BY UFO SHAPE");

	shapeSvg.selectAll("g").data(betterShapeArray).enter()
	.append("g")
	.attr("class", "shapeButton")
	.append("rect")
  .attr("class", "shapeRect")
	.attr("x", function(d,i){
		return ((i)%13)*inc;
	})
	.attr("y", function(d,i){
		if (i < 13){return 45;}
		else{return 80;}
	})
	.attr("width", inc-5).attr("height", 30)

	shapeSvg.selectAll("g")
	.append("text")
	.attr("text-anchor", "middle")
	.attr("font-size", 12)
	.attr("x", function(d,i){
		return (((i)%13)*inc) + inc/2.1;
	})
	.attr("y", function(d,i){
		if (i < 13){return 65;}
		else{return 100;}
	})
	.text(function(d){return d});

	shapeSvg.selectAll("g")
 	.on("click", function(e, d){
 		// console.log(d); //prints the shape names
 		$(this).closest(".shapeButton").toggleClass('highlighted');
    mainMap.updateShapes(d.toString());
 	})
}
