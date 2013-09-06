

var chart_size = {
  "height": 40,
  "width": 400,
  "margin": 4,
  "zero": 400/2
}

var generateScales = function(max_value) {
  return d3.scale.linear()
    .domain([0, max_value])
    .rangeRound([0, chart_size.width]);
}

var x_scale = generateScales(10000);

var svg_x_value = function(d) {
  if (d >= 0) { return chart_size.zero; }
  else { return chart_size.zero + x_scale(d);/* - .5;*/ }
};

var svg_width_value = function(d) {
  return Math.abs(x_scale(d));
};

var setupChart = function(parent_el) {
  var y_scale = d3.scale.linear()
    .domain([0, 1])
    .range([0, chart_size.height]);
  // parent_el comes from jQuery, i.e. is a list
  var chart = d3.select(parent_el[0]).append("svg")
    .attr("class", "chart")
    .attr("width", chart_size.width)
    .attr("height", chart_size.height);
  chart.selectAll("rect")
    .data([ 0 ])
  .enter().append("rect")
    .attr("x", svg_x_value)
    .attr("y", function(d, i) { return y_scale(i) + chart_size.margin; })
    .attr("width", svg_width_value)
    .attr("height", (chart_size.height - chart_size.margin * 2));
  chart.append("line")
    .attr("class", "zero")
    .attr("x1", chart_size.zero)
    .attr("x2", chart_size.zero)
    .attr("y1", 0)
    .attr("y2", chart_size.height);
  return chart;
}

var redrawChart = function(chart, new_data) {
  chart.selectAll("rect")
    .data(new_data)
  .transition()
    .duration(1000)
    .attr("x", svg_x_value)
    .attr("width", svg_width_value);
}

var charts = {};

$(function() {
  var source   = $("#segment_template").html();
  var template = Handlebars.compile(source);

  var html = "<hr>";

  for (var segment in data) {
    data[segment].segment = segment;  // hacky way to pass in name
    html += template(data[segment]);
  }

  $("#main").html(html);

  for (var segment in data) {
    var segment_el = $(".segment[rel=" + segment + "]");
    charts[segment] = {};

    // alp on left
    charts[segment].left = setupChart($(".left_graph", segment_el));

    // lib on right
    charts[segment].right = setupChart($(".right_graph", segment_el));

    segment_el.on('inview', function(event, isInView) {
      if (isInView) {
        var segment = $(event.target).attr("rel");
        redrawChart(charts[segment].left, [5000]);
        redrawChart(charts[segment].right, [-5000]);
      }
    });
  }
});
