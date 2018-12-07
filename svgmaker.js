const d3 = require('d3');
const jsdom = require('jsdom');
const topojson = require('topojson');
const fs = require('fs');

global.fetch = require('node-fetch-polyfill');
const {window} = new jsdom.JSDOM(`<!DOCTYPE html>`);
global.document = window.document;

let svg;
const projection = d3.geoOrthographic()
 	.scale (200)
	.center ([-5,47])
	.translate([190,80])
	.rotate([0,0,-7]);

const graph = (us) => {

  svg = d3.select(document.body).append("svg");

  const path = d3.geoPath().projection(projection);
  
  svg.append("g")
    .selectAll("path")
    .data(topojson.feature(us, us.objects.countries1).features)
    .enter().append("path")
      .attr("fill", "grey")
      .attr("stroke","white")
      .attr("stroke-width","0.3px")
      .attr("d", path);
};

const makeSVG = (lat, lng) => {   
//	console.log([lat,lng]);

  svg.selectAll("circle")
	.data([[0,0]]).enter()
	.append("circle")
	.attr("cx", d => projection(d)[0])
	.attr("cy", d => projection(d)[1])
	.attr("r","8px")
	.attr("fill","red");

  projection.rotate([-lng,-lat,0]);
  svg.select("g").selectAll("path")
     .attr("d",d3.geoPath().projection(projection));
  
  const html = d3.select("svg")
    .attr("title", "test2")
    .attr("version", 1.1)
    .attr("xmlns", "http://www.w3.org/2000/svg")
    .node().parentNode.innerHTML;

  fs.writeFile("./pic.svg", html, err=>console.log(err));
};


d3.json('https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json').then(graph);

module.exports.makeSVG = makeSVG;


