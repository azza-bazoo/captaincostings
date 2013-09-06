
var chart_width = (window.innerWidth - 255) / 2;
var chart_size = {
  "column": 40,
  "height": 40 * 3.5,
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
  .range([0, chart_size.column * 3]);

var svg_x_value = function(d) {
  if (d.value >= 0) { return chart_size.zero; }
  else { return chart_size.zero + x_scale(d.value);/* - .5;*/ }
};

var svg_width_value = function(d) {
  return Math.abs(x_scale(d.value));
};

var setupChart = function(parent_el, data) {
  // TODO: rather hacky, yes
  var sample_data = []
  if (data) {
    data.forEach(function() {
      sample_data.push({ value: 0 });
    });
  }

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
    .attr("y2", sample_data.length * chart_size.column);
  if (sample_data.length) {
    chart.append("rect")
      .attr("class", "scale")
      .attr("x", chart_size.zero - 100)
      .attr("y", chart_size.column * sample_data.length + 1)
      .attr("width", 200)
      .attr("height", 16);
    chart.append("text")
      .attr("class", "scale")
      .attr("x", chart_size.zero - 10)
      .attr("text-anchor", "end")
      .attr("dy", 11)
      .attr("stroke", "#393")
      .attr("y", chart_size.column * sample_data.length + 1)
      .text("savings ($m)");
    chart.append("text")
      .attr("class", "scale")
      .attr("x", chart_size.zero + 10)
      .attr("text-anchor", "start")
      .attr("dy", 11)
      .attr("stroke", "#d00")
      .attr("y", chart_size.column * sample_data.length + 1)
      .text("spending ($m)");

  }
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
        return "#393";
      } else {
        return "#d00";
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
  $(".labor").width(chart_width);
  $(".liberal").width(chart_width);

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
    charts[segment].left = setupChart($(".left_graph", segment_el), getSegmentData(segment, "alp"));

    // lib on right
    charts[segment].right = setupChart($(".right_graph", segment_el), getSegmentData(segment, "lib"));

    segment_el.on('inview', function(event, isInView) {
      if (isInView) {
        var segment = $(event.target).attr("rel");
        redrawChart(charts[segment].left, getSegmentData(segment, "alp"));
        redrawChart(charts[segment].right, getSegmentData(segment, "lib"));
      }
    });
  }

  $(".graph svg").on("mouseenter", function(e) {
    $(".scale", $(e.target)).stop();
    $(".scale", $(e.target)).fadeIn(200);
  });
  $(".graph svg").on("mouseleave", function(e) {
    $(".scale", $(e.target)).stop();
    $(".scale", $(e.target)).fadeOut(200);
  });

  $("img.captain").on("click", function(e) {
    var body = $("body");
    if (body.scrollTop() > 0) {
      body.animate({ scrollTop: 0 }, '500');
    }
  });

  $(window).on("scroll", function(e) {
    var top = $(window).scrollTop();

    if (top >= $("#parties .liberal img").offset().top) {
      $("#header_overlay").show();
      // $("#header_overlay .captain").fadeIn(200);
    } else {
      $("#header_overlay").fadeOut(200);
    }
  });

  $("#about_header").show();
  $("#about_header a").on("click", function(e) {
    e.preventDefault();
    $("#about").modal();
  });
});
