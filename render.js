
var chart_width = (window.innerWidth - 360) / 2;
var chart_size = {
  "column": 40,
  "height": 40 * 3,
  "width": chart_width,
  "margin": 4,
  "zero": chart_width / 2
}

var generateScales = function(max_value) {
  return d3.scale.linear()
    .domain([0, max_value])
    .rangeRound([0, chart_size.width / 2]);
}

var x_scale = generateScales(10000);
var y_scale = d3.scale.linear()
  .domain([0, 3])
  .range([0, chart_size.height]);

var svg_x_value = function(d) {
  if (d.value >= 0) { return chart_size.zero; }
  else { return chart_size.zero + x_scale(d.value);/* - .5;*/ }
};

var svg_width_value = function(d) {
  return Math.abs(x_scale(d.value));
};

var setupChart = function(parent_el) {
  // TODO: rather hacky, yes
  var sample_data = [{ value: 0 }, { value: 0 }, { value: 0 }];
  // parent_el comes from jQuery, i.e. is a list
  var chart = d3.select(parent_el[0]).append("svg")
    .attr("class", "chart")
    .attr("width", chart_size.width)
    .attr("height", chart_size.height);
  chart.selectAll("rect")
    .data(sample_data)
  .enter().append("rect")
    .attr("x", svg_x_value)
    .attr("y", function(d, i) { return y_scale(i) + chart_size.margin; })
    .attr("width", svg_width_value)
    .attr("height", (chart_size.column - chart_size.margin * 2));
  chart.append("line")
    .attr("class", "zero")
    .attr("x1", chart_size.zero)
    .attr("x2", chart_size.zero)
    .attr("y1", 0)
    .attr("y2", chart_size.height);
  return chart;
}

var redrawChart = function(chart, new_data) {
  if (!new_data) { return false; }  // TODO: do this check outside here?

  chart.selectAll("text.label")
    .data(new_data)
  .enter().append("text")
    .attr("class", "label")
    .attr("x", function(d) {
      if (d.value > 0) { return chart_size.zero - chart_size.margin; } else { return chart_size.zero + chart_size.margin; }
    })
    .attr("text-anchor", function(d) {
      if (d.value > 0) { return "end"; } else { return "start"; }
    })
    .attr("dy", 4)
    .attr("y", function(d, i) { return y_scale(i) + chart_size.column / 2; })
    .text(function(d) { if(d.label) { return d.label; } else { return "" } });

  chart.selectAll("text.value")
    .data(new_data)
  .enter().append("text")
    .attr("class", "value")
    .attr("x", function(d) {
      if (d.value < 0) { return chart_size.zero - chart_size.margin; } else { return chart_size.zero + chart_size.margin; }
    })
    .attr("text-anchor", function(d) {
      if (d.value < 0) { return "end"; } else { return "start"; }
    })
    .attr("fill", function(d) {
      if (d.value < 0) {
        return "#0c0";
      } else {
        return "#f00";
      }
    })
    .attr("dy", 5)
    .attr("y", function(d, i) { return y_scale(i) + chart_size.column / 2; })
    .text(function(d) {
      if (d.value < 0) {
        return "-$" + Math.abs(d.value).toLocaleString();
      } else {
        return "$" + Math.abs(d.value).toLocaleString();
      }
    });

  chart.selectAll("rect")
    .data(new_data)
  .transition()
    .duration(1000)
    .attr("x", svg_x_value)
    .attr("width", svg_width_value);
}

var getSegmentData = function(segment, key) {
  if (!data[segment][key]) { return false; }

  var available_items = data[segment][key];
  var dataset = [];

  available_items.forEach(function(item) {
    var value = 0;
    if (item.spending) { value = item.spending; }
    if (item.saving) { value = 0 - item.saving; }
    if (item.revenue) { value = 0 - item.revenue; }
    dataset.push({ label: item.label, value: value });
  });

  return dataset;
}

var charts = {};

$(function() {
  $("#labor").width(chart_width);
  $("#liberal").width(chart_width);

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
        redrawChart(charts[segment].left, getSegmentData(segment, "alp"));
        redrawChart(charts[segment].right, getSegmentData(segment, "lib"));
      }
    });
  }
});
