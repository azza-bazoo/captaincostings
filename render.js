$(function() {
  var source   = $("#segment_template").html();
  var template = Handlebars.compile(source);

  var html = "<hr>";

  for (var segment in data) {
    html += template(data[segment]);
  }

  $("#main").html(html);
});
