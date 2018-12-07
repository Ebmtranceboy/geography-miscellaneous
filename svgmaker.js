const d3 = require('d3');
const jsdom = require('jsdom');
const topojson = require('topojson');
const fs = require('fs');

global.fetch = require('node-fetch-polyfill');
const {window} = new jsdom.JSDOM(`<!DOCTYPE html>`);
global.document = window.document;

const graph = (lat, lng) => (us) => {
	console.log([lat,lng]);
  const projection = d3.geoOrthographic()
 	.scale (270)
	.center ([-5,47])
	.translate([300,80])
	.rotate([0,0,-7]);

  const path = d3.geoPath().projection(projection);
  const svg = d3.select(document.body).append("svg");

  svg.append("g")
    .selectAll("path")
    .data(topojson.feature(us, us.objects.countries1).features)
    .enter().append("path")
      .attr("fill", "grey")
      .attr("stroke","white")
      .attr("stroke-width","0.3px")
      .attr("d", path);

  projection.rotate([-lng,-lat,0]);
  svg.select("g").selectAll("path")
     .attr("d",d3.geoPath().projection(projection));
  

  var html = d3.select("svg")
    .attr("title", "test2")
    .attr("version", 1.1)
    .attr("xmlns", "http://www.w3.org/2000/svg")
    .node().parentNode.innerHTML;

  fs.writeFile("./pic.svg", html, err=>console.log(err));
};

const makeSVG = (lat,lng) => d3.json('https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json').then(graph(lat,lng));

module.exports.makeSVG = makeSVG;


