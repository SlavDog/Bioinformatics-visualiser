import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// set the dimensions and margins of the graph
const width = 1200
const height = 1080

// append the svg object to the body of the page
const svg = d3.select("#my_dataviz")
  .append("svg")
    .attr("width", width)
    .attr("height", height)
  .append("g")
    .attr("transform", "translate(40, 0)");  // bit of margin on the left = 40

// read json data
d3.json("./public/final_tree.json").then( function(data) {

  // Create the cluster layout:
  const cluster = d3.cluster()
    .size([height, width - 200]);  // 100 is the margin I will have on the right side

  // Give the data to this cluster layout:
  const root = d3.hierarchy(data, function(d) {
      return d.children;
  });
  cluster(root);

  // Add the links between nodes:
  svg.selectAll('path')
    .data( root.descendants().filter(d => d.parent && d.parent !== root))
    .join('path')
    .attr("d", function(d) {
        return "M" + d.y + "," + d.x
                + "C" + (d.parent.y + 50) + "," + d.x
                + " " + (d.parent.y + 150) + "," + d.parent.x // 50 and 150 are coordinates of inflexion, play with it to change links shape
                + " " + d.parent.y + "," + d.parent.x;
              })
    .style("fill", 'none')
    .attr("stroke", '#ccc')


  // Add a circle for each node.
  const node = svg.selectAll("g.node")
  .data(root.descendants().slice(1))
  .join("g")
    .attr("class", "node")
    .attr("transform", d => `translate(${d.y},${d.x})`);

  // Append circle to each <g>
  node.append("circle")
      .attr("r", 7)
      .style("fill", "#69b3a2")
      .attr("stroke", "black")
      .style("stroke-width", 2);

  // Append text to each <g>
  node.append("text")
      .attr("dy", "0.35em")
      .attr("x", 10)  // adjust position
      .style("font-size", "12px")
      .text(d => d.data.code);
})
