/**
 * @todo add arrows for easy scrolling
 */

/**
 * constant variables
 */

const WIDTH = $("body").width() * 4;
const HEIGHT = 80;
const POINT = 20;
const ARROW_WIDTH = 50;

function Timeline(_year) {
    this.selectedYear = _year;
    this.yearRange = [...Array(85).keys()].map(i => i + this.selectedYear);

    this.svg = d3.select("#timeline").append("svg")
                                    .attr("id", "timelineSVG")
                                    .attr("width", WIDTH)
                                    .attr("height", HEIGHT)
                                    .attr("overflow", "scroll");

    this.leftScrollSvg = d3.select("#timeline-container").append("svg")
                                               .attr("class", "timelineArrow")
                                               .attr("id", "left-arrow")
                                               .attr("width", ARROW_WIDTH)
                                               .attr("height", HEIGHT);

    this.rightScrollSvg = d3.select("#timeline-container").append("svg")
                                                .attr("class", "timelineArrow")
                                                .attr("id", "right-arrow")
                                                .attr("width", ARROW_WIDTH)
                                                .attr("height", HEIGHT);

    this.init();
}

/**
 * runs when the page has loaded
 */

/**
 * jquery code
 */

 Timeline.prototype.init = function() {
     const self = this;
    //  $(function() {
    //     $('.dropdown-item').on('click', function() {
    //         $(".highlighted").removeClass("highlighted");
    //         let $self = $(this);
    //         $('#dropdownMenuButton').html($self.html());
    //         self.update(+($self.html()));

    //         mainMap.updateMarkers(mainMap.fullData, self.selectedYear);
    //     });
    // });

  self.svg.append("line")
        .attr("class", "tLine")
        .attr("x1", 0)
        .attr("x2", WIDTH)
        .attr("y1", HEIGHT / 2)
        .attr("y2", HEIGHT / 2)
        .attr("stroke", "#E2E6EA");

  self.update(self.selectedYear);
 }




/**
 *
 * @param {Number} year the selected decade
 *
 * update the svg timeline
 */

Timeline.prototype.update = function (year) {
    const self = this;
    self.selectedYear = year;
    self.yearRange = [...Array(85).keys()].map(i => i + self.selectedYear);

    self.svg.selectAll("rect")
        .data(self.yearRange)
        .enter()
        .append("rect")
        .attr("class", "yearPoint")
        .attr("width", POINT)
        .attr("height", POINT)
        .attr("x", (d, i) => (i + 0.5) * (WIDTH / 85))
        .attr("y", (HEIGHT / 2) - (POINT / 2))
        .attr("fill", "#E2E6EA")

    self.svg.selectAll("rect")
        .attr("class", function(d){
            if (d == year){
                return "highlightedYear";
            } else {return "yearPoint";}
        });

    self.svg.selectAll("rect")
        .data(self.yearRange)
        .attr("aria-label", d => d);

    self.svg.selectAll("text")
        .data(self.yearRange)
        .enter()
        .append("text")
        .attr("class", "yearPointText")
        .attr("x", (d, i) => (i + 0.5) * (WIDTH / 85) + (POINT / 2))
        .attr("y", ((HEIGHT / 2) - (POINT / 2)) + 32)
        .attr("fill", "#E2E6EA");

    self.svg.selectAll("text")
        .data(self.yearRange)
        .text(d => d);

    self.svg.selectAll("text")
        .data(self.yearRange)
        .exit()
        .remove();

    self.svg.selectAll("rect")
        .on("click", function(e, d){
            self.svg.selectAll("rect").classed('highlightedYear', false);
            e.target.classList.add('highlightedYear');
            $(".highlighted").removeClass("highlighted");

            mainMap.updateMarkers(mainMap.fullData, d);
        })
}
