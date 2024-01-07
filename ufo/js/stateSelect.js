/**
 * @todo add tooltip that shows number of sightings per decade + the state line
 * @todo remove state from line chart
 * @todo add indicator that tells user if a line is added to a graph
 */

// const { svg } = require("d3");

/**
 * constant variables
 */

 const STATE_HEIGHT = 600;
 const STATE_WIDTH = $("body").width();
 const PADDING = 25;
 const MARGIN = {
     left: 50,
     right: 25,
     top: 100,
     bottom: 50
 };


/**
 *
 * @param {*} _data the data
 */

function StateData(_data)
{
    this.data = _data;
    this.dates = [1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010];
    this.states = [];
    this.dataByYearTotal = [];
    this.load();
}

/**
 * loads the initial visualization
 */

StateData.prototype.load = function()
{
    const self = this;

    self.svg = d3.select("#selected").append("svg")
                                     .attr("width", STATE_WIDTH)
                                     .attr("height", STATE_HEIGHT);

    const title = self.svg.append("text")
                          .attr("id", "chartTitle")
                          .attr("text-anchor", "middle")
                          .attr("x", STATE_WIDTH / 2)
                          .attr("y", 50)
                          .text("Click a state on the map to view its full UFO sighting data down below:")
                          .attr("fill", "#E2E6EA")

    self.x = d3.scaleTime()
                .domain(d3.extent(self.dates))
                .range([MARGIN.left, STATE_WIDTH - MARGIN.right]);

    self.y = d3.scaleLinear()
                .range([(STATE_HEIGHT - MARGIN.bottom) - 50, MARGIN.top]);

    self.xAxis = self.svg.append("g")
                         .attr("class", "axis x-axis")
                         .attr("transform", `translate(0, ${(STATE_HEIGHT - MARGIN.bottom) - 50})`)
                         .call(d3.axisBottom().scale(self.x).tickFormat(d3.format(".0f")));

    self.xAxis.append("text")
                .attr("class", "axisLabel")
                .attr("x", STATE_WIDTH / 2)
                .attr("y", MARGIN.bottom - 10)
                .attr("text-anchor", "middle")
                .text("The Full Timeline (in Decades)");

    self.yAxis = self.svg.append("g")
                         .attr("class", "axis y-axis")
                         .attr("transform", `translate(${MARGIN.left}, 0)`)
                         .call(d3.axisLeft().scale(self.y));

    self.yAxis.append("text")
              .attr("class", "axisLabel")
              .attr("transform", "rotate(270)")
              .attr("x", (-STATE_HEIGHT / 2) + 20)
              .attr("y", -40)
              .attr("text-anchor", "middle")
              .text("Sightings");

    self.svg.append("text")
            .attr("id", "hoverLabel")
            .attr("x", MARGIN.left + 20)
            .attr("y", MARGIN.top)
            .attr("font-size", "15pt")
            .attr("fill", "#fff");

}

/**
 * 
 * @param {Object} tooltipData the data for the tooltip
 * draws a tooltip for the line chart
 */
StateData.prototype.drawTooltip = function(tooltipData) 
{
    let text = `<div class="tooltipHeader"><h4>${tooltipData.state}</h4></div>`;
    text += `<div class="tooltipBody"><h5>${tooltipData.decade}</h5> Sightings: ${tooltipData.sightings}</div>`;

    return text;
}

/**
 * renders the tooltip
 */
StateData.prototype.renderTooltip = function()
{
    const self = this;
    return d3.tip().attr("class", "d3-tip")
                    .direction("n")
                    .offset(function()
                    {
                        return [0,0];
                    })
                    .html(function(d)
                    {
                        let data = d.target;
                        console.log("data", typeof data.getAttribute("class"));
                        tooltipData = {
                            "state": data.getAttribute("class").split(' ')[1],
                            "decade": data.getAttribute("class").split(' ')[2],
                            "sightings": data.__data__
                        }

                        return self.drawTooltip(tooltipData);
                    });
}

/**
 *
 * @param {*} stateObject the state object to add to the visualization
 * adds the given state to the visualization and updates the visualization
 */
StateData.prototype.addState = function(stateObject)
{  
    const self = this;

    let tip = self.renderTooltip();
    self.svg.call(tip);

    // add data by decade
    let stateData = self.data.filter(d => d.State === stateObject.abbv);
    for (var i = 0; i < stateData.length; i++)
    {
        let date = new Date(stateData[i].Recorded);
        let recordedYear = date.getFullYear();
        recordedYear = "" + recordedYear;
        recordedYear = recordedYear.substring(0, recordedYear.length - 1);
        recordedYear += "0";
        recordedYear = +recordedYear;
        let index = (recordedYear % 1930) / 10;
        if (index < stateObject.dataByYear.length)
        {
            stateObject.dataByYear[index]++;
        }
    }

    // make a combined array for domain purposes
    for (var j = 0; j < stateObject.dataByYear.length; j++) {
        self.dataByYearTotal.push(stateObject.dataByYear[j]);
    }

    self.y
        .domain([0, d3.max(self.dataByYearTotal)])
        .call(d3.axisLeft().scale(self.y));

    self.states.push(stateObject);

    const line = d3.line()
                   .x((d, i) => self.x(self.dates[i]))
                   .y(function(d) {
                       return self.y(d);
                   });

    // create the line for the state
    self.svg.selectAll(".stateLine")
            .data(self.states)
            .enter()
            .append("path")
            .attr("class", function(d){
                return d.name.split(" ").join("") + " stateLine"})
            .attr("fill", "none")
            .attr("stroke", "#E2E6EA")
            .attr("stroke-width", 5)
            .on("mouseover", function(e) {
                this.setAttribute("stroke", "#51FFC0");
                d3.select("#hoverLabel").text(stateObject.name);
            })
            .on("mouseout", function(e) {
                this.setAttribute("stroke", "darkgray");
                self.svg.select("#hoverLabel").text("");
            })
            .on("click", function(e){
                let sName = e.target.classList[0];
                let tag = "." + sName;
                $(tag).remove();
                self.states.pop(stateObject);
                d3.select("#hoverLabel").text("");
            });

    self.svg.selectAll(".stateLine")
            .data(self.states)
            .transition(1000)
            .attr("d", d => line(d.dataByYear));

    self.svg.selectAll(".stateLine")
            .data(self.states)
            .exit()
            .remove();

    self.svg.selectAll(".circle-group")
            .data(self.states)
            .enter()
            .append("g")
            .attr("class", function(d){
                return d.name.split(" ").join("") + " circle-group"})
            .each(function(d, i) {
                console.log("add iteratin");
                d3.select(this).selectAll("circle")
                                .data(d.dataByYear)
                                .enter()
                                .append("circle")
                                .attr("class", (data, index) => `linePoint ${d.name} ${d.decades[index]}`)
                                .attr("r", 5)
                                .on("mouseover", tip.show)
                                .on("mouseout", tip.hide);
            });

    self.svg.selectAll(".circle-group")
            .data(self.states)
            .each(function(d, i) {
                console.log("iteratin");
                d3.select(this).selectAll("circle")
                               .data(d.dataByYear)
                               .attr("cx", (data, index) => self.x(self.dates[index]))
                               .attr("cy", data => self.y(data));
            });

    self.svg.selectAll(".circle-group")
            .data(self.states)
            .each(function(d, i) {
                d3.select(this).selectAll("circle")
                                .data(d.dataByYear)
                                .exit()
                                .remove();
            })

    // self.states.forEach(state => {
    //     console.log(state);
    //     self.svg.selectAll("circle")
    //             .data(state.dataByYear)
    //             .enter()
    //             .append("circle")
    //             .attr("class", (d, i) => `linePoint ${state.name} ${state.decades[i]}`)
    //             .attr("r", 5)
    //             .on("mouseover", tip.show)
    //             .on("mouseout", tip.hide);

    //     self.svg.selectAll("circle")
    //             .data(state.dataByYear)
    //             .attr("cx", (d, i) => self.x(self.dates[i]))
    //             .attr("cy", d => self.y(d));

    //     self.svg.selectAll("circle")
    //         .data(state.dataByYear)
    //         .exit()
    //         .remove();
    // })

    self.svg.select("g.y-axis").call(d3.axisLeft().scale(self.y));
}
