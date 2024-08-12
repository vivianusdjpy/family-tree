import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const FamilyTreeChart = ({ data }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data) return;

    const width = 1300;
    const marginTop = 10;
    const marginRight = 10;
    const marginBottom = 10;
    const marginLeft = 40;

    const root = d3.hierarchy(data);
    const dx = 50;
    const dy = (width - marginRight - marginLeft) / (1 + root.height) + 30;
    const tree = d3
      .tree()
      .nodeSize([dx, dy])
      .separation((a, b) => (a.parent === b.parent ? 1.5 : 1.8));
    const diagonal = d3
      .linkHorizontal()
      .x((d) => d.y)
      .y((d) => d.x);

    // Clear SVG before redrawing
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", [0, 0, width, 0]) // Initial height is 0, will be updated
      .style("border", "1px solid black")
      .style("font", "12px sans-serif")
      .style("user-select", "none");

    const gLink = svg
      .append("g")
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1.5);

    const gNode = svg
      .append("g")
      .attr("cursor", "pointer")
      .attr("pointer-events", "all");

    function update(event, source) {
      const duration = event?.altKey ? 2500 : 250; // hold the alt key to slow down the transition
      const nodes = root.descendants().reverse();
      const links = root.links();

      // Compute the new tree layout.
      tree(root);

      let left = root;
      let right = root;
      root.eachBefore((node) => {
        if (node.x < left.x) left = node;
        if (node.x > right.x) right = node;
      });

      const height = right.x - left.x + marginTop + marginBottom;

      const transition = svg
        .transition()
        .duration(duration)
        .attr("viewBox", [-marginLeft, left.x, width, height])
        .tween(
          "resize",
          window.ResizeObserver ? null : () => () => svg.dispatch("toggle")
        );

      // Update the nodes…
      const node = gNode.selectAll("g").data(nodes, (d) => d.id);

      // Enter any new nodes at the parent's previous position.
      const nodeEnter = node
        .enter()
        .append("g")
        .attr("transform", (d) => `translate(${source.y0},${source.x0})`)
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0)
        .on("click", (event, d) => {
          d.children = d.children ? null : d._children;
          update(event, d);
        });

      nodeEnter
        .append("circle")
        .attr("r", 30)
        .attr("fill", (d) => (d._children ? "#fff" : "#f5f5f5"))
        .attr("stroke", "#000")
        .attr("stroke-width", 1);

      nodeEnter
        .append("image")
        .attr("xlink:href", (d) => d.data.image)
        .attr("x", -30)
        .attr("y", -30)
        .attr("height", "60")
        .attr("width", "60")
        .attr("clip-path", "circle(50%)");

      nodeEnter
        .append("text")
        .attr("dy", "0.3rem")
        .attr("x", (d) => (d._children ? -6 : 6))
        .attr("text-anchor", (d) => (d._children ? "end" : "start"))
        .text((d) => d.data.name)
        .attr("stroke-linejoin", "round")
        .attr("stroke-width", 3)
        .attr("stroke", "white")
        .attr("paint-order", "stroke");

      // Transition nodes to their new position.
      const nodeUpdate = node
        .merge(nodeEnter)
        .transition(transition)
        .attr("transform", (d) => `translate(${d.y},${d.x})`)
        .attr("fill-opacity", 1)
        .attr("stroke-opacity", 1);

      // Transition exiting nodes to the parent's new position.
      const nodeExit = node
        .exit()
        .transition(transition)
        .remove()
        .attr("transform", (d) => `translate(${source.y},${source.x})`)
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0);

      // Update the links…
      const link = gLink.selectAll("path").data(links, (d) => d.target.id);

      // Enter any new links at the parent's previous position.
      const linkEnter = link
        .enter()
        .append("path")
        .attr("d", (d) => {
          const o = { x: source.x0, y: source.y0 };
          return diagonal({ source: o, target: o });
        });

      // Transition links to their new position.
      link.merge(linkEnter).transition(transition).attr("d", diagonal);

      // Transition exiting nodes to the parent's new position.
      link
        .exit()
        .transition(transition)
        .remove()
        .attr("d", (d) => {
          const o = { x: source.x, y: source.y };
          return diagonal({ source: o, target: o });
        });

      // Stash the old positions for transition.
      root.eachBefore((d) => {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }

    // Initialize the display to show a few nodes.
    root.x0 = window.innerHeight;
    root.y0 = width / 4;
    root.descendants().forEach((d, i) => {
      d.id = i;
      d._children = d.children;
      if (d.depth && d.data.name.length !== 7) d.children = null;
    });

    update(null, root);
  }, [data]); // Re-run when data changes

  return (
    <div id="container"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw"
      }}
    >
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default FamilyTreeChart;