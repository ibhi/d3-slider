import { scaleLinear } from 'd3-scale';
import { select, event as currentEvent } from 'd3-selection';
import { drag as d3Drag } from 'd3-drag';
import { dispatch as d3Dispatch } from 'd3-dispatch';
import { format } from 'd3-format';
import { interpolateNumber } from 'd3-interpolate';
import { axisBottom, axisRight } from 'd3-axis';
import { transition } from 'd3-transition';

export default function module() {
  'use strict';
  // Public variables width default settings
  let min = 0;
  let max = 100;
  let step = 0.01;
  let animate = false;
  let orientation = 'horizontal';
  let axis = false;
  let margin = 50;
  let value;
  let active = 1;
  let snap = false;
  let scale;

  // Private variables
  let axisScale;
  let dispatch = d3Dispatch('slide', 'slideend');
  let formatPercent = format('.2%');
  let tickFormat = format('.0');
  let handle1;
  let handle2 = null;
  let divRange;
  let sliderLength;
  // let transition = d3Tranisition();

  function slider(selection) {
    selection.each(function () {
      // Create scale if not defined by user
      if (!scale) {
        scale = scaleLinear().domain([min, max]);
      }

      // Start value
      value = value || scale.domain()[0];

      // DIV container
      var div = select(this).classed('d3-slider d3-slider-' + orientation, true);

      var drag = d3Drag();
      drag.on('end', () => {
        dispatch.call('slideend', currentEvent, value);
      });

      // Slider handle
      // if range slider, create two
      // var divRange;

      const createHandle = (number) => {
        return div.append('a')
          .classed('d3-slider-handle', true)
          .attr('xlink:href', '#')
          .attr('id', `handle-${number}`)
          .on('click', stopPropagation)
          .call(drag);
      };

      if (toType(value) === 'array' && value.length === 2) {
        handle1 = createHandle('one')
        handle2 = createHandle('two');
      } else {
        handle1 = createHandle('one');
      }

      // Horizontal slider
      if (orientation === 'horizontal') {
        div.on('click', onClickHorizontal);
        divRange = select(this).append('div').classed('d3-slider-range', true);

        if (toType(value) === 'array' && value.length === 2) {
          handle1.style('left', formatPercent(scale(value[0])));
          divRange.style('left', formatPercent(scale(value[0])));
          drag.on('drag', onDragHorizontal);

          let width = 100 - parseFloat(formatPercent(scale(value[1])));
          handle2.style('left', formatPercent(scale(value[1])));
          divRange.style('right', width + '%');
          drag.on('drag', onDragHorizontal);
        } else {
          handle1.style('left', formatPercent(scale(value)));
          let width = 100 - parseFloat(formatPercent(scale(value)));
          divRange.style('right', width + '%');

          drag.on('drag', onDragHorizontal);
        }

        sliderLength = parseInt(div.style('width'), 10);
      } else { // Vertical
        div.on('click', onClickVertical);
        drag.on('drag', onDragVertical);
        if (toType(value) === 'array' && value.length === 2) {
          divRange = select(this).append('div').classed('d3-slider-range-vertical', true);

          handle1.style('bottom', formatPercent(scale(value[0])));
          divRange.style('bottom', formatPercent(scale(value[0])));
          drag.on('drag', onDragVertical);

          var top = 100 - parseFloat(formatPercent(scale(value[1])));
          handle2.style('bottom', formatPercent(scale(value[1])));
          divRange.style('top', top + '%');
          drag.on('drag', onDragVertical);
        } else {
          handle1.style('bottom', formatPercent(scale(value)));
          drag.on('drag', onDragVertical);
        }

        sliderLength = parseInt(div.style('height'), 10);
      }

      if (axis) {
        createAxis(div);
      }

      function createAxis(dom) {
        // Create axis if not defined by user
        if (typeof axis === 'boolean') {
          if (orientation === 'horizontal') {
            axis = axisBottom()
              .ticks(Math.round(sliderLength / 100))
              .tickFormat(tickFormat);
          } else {
            axis = axisRight()
              .ticks(Math.round(sliderLength / 100))
              .tickFormat(tickFormat);
          }
        }

        // Copy slider scale to move from percentages to pixels
        axisScale = scale.ticks ? scale.copy().range([0, sliderLength]) : scale.copy().rangePoints([0, sliderLength], 0.5);
        axis.scale(axisScale);

        // Create SVG axis container
        var svg = dom.append('svg')
          .classed('d3-slider-axis d3-slider-axis-' + axis.orient(), true)
          .on('click', stopPropagation);

        var g = svg.append('g');

        // Horizontal axis
        if (orientation === 'horizontal') {
          svg.style('margin-left', -margin + 'px');

          svg.attr({
            width: sliderLength + margin * 2,
            height: margin
          });

          if (axis.orient() === 'top') {
            svg.style('top', -margin + 'px');
            g.attr('transform', 'translate(' + margin + ',' + margin + ')');
          } else { // bottom
            g.attr('transform', 'translate(' + margin + ',0)');
          }
        } else { // Vertical
          svg.style('top', -margin + 'px');

          svg.attr({
            width: margin,
            height: sliderLength + margin * 2
          });

          if (axis.orient() === 'left') {
            svg.style('left', -margin + 'px');
            g.attr('transform', 'translate(' + margin + ',' + margin + ')');
          } else { // right
            g.attr('transform', 'translate(' + 0 + ',' + margin + ')');
          }
        }
        g.call(axis);
      }

      function onClickHorizontal() {
        if (toType(value) !== 'array') {
          var pos = Math.max(0, Math.min(sliderLength, currentEvent.offsetX || currentEvent.layerX));
          moveHandle(scale.invert
            ? stepValue(scale.invert(pos / sliderLength))
            : nearestTick(pos / sliderLength)
          );
        }
      }

      function onClickVertical() {
        if (toType(value) !== 'array') {
          var pos = sliderLength - Math.max(0, Math.min(sliderLength, currentEvent.offsetY || currentEvent.layerY));
          moveHandle(scale.invert
            ? stepValue(scale.invert(pos / sliderLength))
            : nearestTick(pos / sliderLength)
          );
        }
      }

      function onDragHorizontal() {
        if (currentEvent.sourceEvent.target.id === 'handle-one') {
          active = 1;
        } else if (currentEvent.sourceEvent.target.id === 'handle-two') {
          active = 2;
        }
        var pos = Math.max(0, Math.min(sliderLength, currentEvent.x));
        moveHandle(scale.invert
          ? stepValue(scale.invert(pos / sliderLength))
          : nearestTick(pos / sliderLength)
        );
      }

      function onDragVertical() {
        if (currentEvent.sourceEvent.target.id === 'handle-one') {
          active = 1;
        } else if (currentEvent.sourceEvent.target.id === 'handle-two') {
          active = 2;
        }
        var pos = sliderLength - Math.max(0, Math.min(sliderLength, currentEvent.y))
        moveHandle(scale.invert
          ? stepValue(scale.invert(pos / sliderLength))
          : nearestTick(pos / sliderLength)
        );
      }

      function stopPropagation() {
        currentEvent.stopPropagation();
      }
    });
  }

  // Move slider handle on click/drag
  function moveHandle(newValue) {
    let currentValue = toType(value) === 'array' && value.length === 2 ? value[active - 1] : value;
    let oldPos = formatPercent(scale(stepValue(currentValue)));
    let newPos = formatPercent(scale(stepValue(newValue)));
    let position = (orientation === 'horizontal') ? 'left' : 'bottom';

    if (oldPos !== newPos) {
      if (toType(value) === 'array' && value.length === 2) {
        value[active - 1] = newValue;
        if (currentEvent) {
          dispatch.call('slide', currentEvent, value);
        };
      } else {
        if (currentEvent) {
          dispatch.call('slide', currentEvent.sourceEvent || currentEvent, value = newValue);
        };
      }

      if (value[0] >= value[1]) return;
      if (active === 1) {
        if (toType(value) === 'array' && value.length === 2) {
          (position === 'left') ? divRange.style('left', newPos) : divRange.style('bottom', newPos);
        } else {
          let width = 100 - parseFloat(newPos);
          let top = 100 - parseFloat(newPos);
          (position === 'left') ? divRange.style('right', width + '%') : divRange.style('top', top + '%');
        }

        if (animate) {
          transition(handle1)
            .transition()
            .styleTween(position, function () { return interpolateNumber(oldPos, newPos); })
            .duration((typeof animate === 'number') ? animate : 250);
          // handle1.transition()
          //   .styleTween(position, function () { return interpolateNumber(oldPos, newPos); })
          //   .duration((typeof animate === 'number') ? animate : 250);
        } else {
          handle1.style(position, newPos);
        }
      } else {
        let width = 100 - parseFloat(newPos);
        let top = 100 - parseFloat(newPos);

        (position === 'left') ? divRange.style('right', width + '%') : divRange.style('top', top + '%');

        if (animate) {
          handle2.transition()
            .styleTween(position, function () { return interpolateNumber(oldPos, newPos); })
            .duration((typeof animate === 'number') ? animate : 250);
        } else {
          handle2.style(position, newPos);
        }
      }
    }
  }

  // Calculate nearest step value
  function stepValue(val) {
    if (val === scale.domain()[0] || val === scale.domain()[1]) {
      return val;
    }

    var alignValue = val;
    if (snap) {
      alignValue = nearestTick(scale(val));
    } else {
      var valModStep = (val - scale.domain()[0]) % step;
      alignValue = val - valModStep;

      if (Math.abs(valModStep) * 2 >= step) {
        alignValue += (valModStep > 0) ? step : -step;
      }
    };

    return alignValue;
  }

  // Find the nearest tick
  function nearestTick(pos) {
    var ticks = scale.ticks ? scale.ticks() : scale.domain();
    var dist = ticks.map(function (d) { return pos - scale(d); });
    let i = -1;
    let index = 0;
    let r = scale.ticks ? scale.range()[1] : scale.rangeExtent()[1];
    do {
      i++;
      if (Math.abs(dist[i]) < r) {
        r = Math.abs(dist[i]);
        index = i;
      };
    } while (dist[i] > 0 && i < dist.length - 1);

    return ticks[index];
  };

  // Return the type of an object
  function toType(v) {
    return ({}).toString.call(v).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
  };

  // Getter/setter functions
  slider.min = function (_) {
    if (!arguments.length) return min;
    min = _;
    return slider;
  };

  slider.max = function (_) {
    if (!arguments.length) return max;
    max = _;
    return slider;
  };

  slider.step = function (_) {
    if (!arguments.length) return step;
    step = _;
    return slider;
  };

  slider.animate = function (_) {
    if (!arguments.length) return animate;
    animate = _;
    return slider;
  };

  slider.orientation = function (_) {
    if (!arguments.length) return orientation;
    orientation = _;
    return slider;
  };

  slider.axis = function (_) {
    if (!arguments.length) return axis;
    axis = _;
    return slider;
  };

  slider.margin = function (_) {
    if (!arguments.length) return margin;
    margin = _;
    return slider;
  };

  slider.value = function (_) {
    if (!arguments.length) return value;
    if (value) {
      moveHandle(stepValue(_));
    };
    value = _;
    return slider;
  };

  slider.snap = function (_) {
    if (!arguments.length) return snap;
    snap = _;
    return slider;
  };

  slider.scale = function (_) {
    if (!arguments.length) return scale;
    scale = _;
    return slider;
  };

  slider.on = function () {
    let value = dispatch.on.apply(dispatch, arguments);
    return value === dispatch ? slider : value;
  }

  // d3.rebind(slider, dispatch, 'on');

  return slider;
};
