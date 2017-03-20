// export { default as slider } from './src/slider';
import './src/slider.scss';
// import { scaleLinear } from 'd3-scale';
import { select } from 'd3-selection';
// import { format } from 'd3-format';
// import { axisBottom, axisRight } from 'd3-axis';
import slider from './src/slider';

select('#slider1').call(slider());

select('#slider2').call(slider().value([10, 25]));

select('#slider3').call(slider().axis(true).value([10, 25]).on('slide', function (value) {
  select('#slider3textmin').text(value[0]);
  select('#slider3textmax').text(value[1]);
}));

select('#slider4').call(slider().on('slide', function (value) {
  select('#slider4text').text(value);
}));

select('#slider5').call(slider().axis(true));

// var axis = d3.svg.axis().orient('top').ticks(4);
// d3.select('#slider6').call(d3.slider().axis(axis));

select('#slider7').call(slider().axis(true).min(2000).max(2100).step(5));

select('#slider8').call(slider().value(50).orientation('vertical'));

select('#slider9').call(slider().value([10, 30]).orientation('vertical'));

// d3.select('#slider10').call(d3.slider().scale(d3.time.scale().domain([new Date(1984, 1, 1), new Date(2014, 1, 1)])).axis(d3.svg.axis()));

// d3.select('#slider11').call(d3.slider().scale(d3.time.scale().domain([new Date(1984, 1, 1), new Date(2014, 1, 1)])).axis(d3.svg.axis()).snap(true).value(new Date(2000, 1, 1)));

// essai = d3.slider().scale(d3.scale.ordinal().domain(['Gecko', 'Webkit', 'Blink', 'Trident']).rangePoints([0, 1], 0.5)).axis(d3.svg.axis()).snap(true).value('Gecko');
// d3.select('#slider12').call(essai);

if (module.hot) {
  module.hot.accept();
}
