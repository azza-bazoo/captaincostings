
var source   = document.getElementById("segment_template").innerHTML;
var template = Handlebars.compile(source);

var html = "<hr>";

for (var segment in data) {
  html += template(segment);
}
