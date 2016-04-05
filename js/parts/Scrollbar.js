
/**
 * The Scrollbar class 
 * @param {Object} renderer
 * @param {Object} options
 * @param {Object} chart
 */
function Scrollbar(renderer, options, chart) {
	this.scrollbarButtons = [];

	this.renderer = renderer;

	this.options = options;
	this.chart = chart;

	this.step = pick(options.step, 0.2); // docs

	// Init
	this.render();
	this.initEvents();
	this.addEvents();
}

Scrollbar.prototype = {
	render: function () {
		var scroller = this,
			renderer = scroller.renderer,
			options = scroller.options,
			strokeWidth = options.trackBorderWidth,
			scrollbarStrokeWidth = options.barBorderWidth,
			size = pick(options.height, 14), // when initializing scrollbar, size may not be defined yet
			group;

		scroller.size = size;

		// Draw the scrollbar group:
		scroller.group = group = renderer.g(PREFIX + 'scrollbar').attr({
			zIndex: 3
		}).add();

		// Draw the scrollbar track:
		scroller.track = renderer.rect().attr({
			height: size,
			width: size,
			y: -strokeWidth % 2 / 2,
			x: -strokeWidth % 2 / 2,
			'stroke-width': strokeWidth,
			fill: options.trackBackgroundColor,
			stroke: options.trackBorderColor,
			r: options.trackBorderRadius || 0
		}).add(group);

		// Draw the scrollbar itself:
		scroller.scrollbarGroup = renderer.g().add(group);

		scroller.scrollbar = renderer.rect().attr({
			height: size,
			width: size,
			y: -scrollbarStrokeWidth % 2 / 2,
			x: -scrollbarStrokeWidth % 2 / 2,
			'stroke-width': scrollbarStrokeWidth,
			fill: options.barBackgroundColor,
			stroke: options.barBorderColor,
			r: options.barBorderRadius || 0
		}).add(scroller.scrollbarGroup);

		// Draw the scrollbat rifles:
		scroller.scrollbarRifles = renderer.path(scroller.swapXY([
			M,
			-2.5, size / 4,
			L,
			-2.5, 2 * size / 3,
			M,
			0.5, size / 4,
			L,
			0.5, 2 * size / 3,
			M,
			3.5, size / 4,
			L,
			3.5, 2 * size / 3
		], options.vertical)).attr({
			stroke: options.rifleColor,
			'stroke-width': 1
		}).add(scroller.scrollbarGroup);

		// Draw the buttons:
		scroller.drawScrollbarButton(0);
		scroller.drawScrollbarButton(1);
	},

	/**
	 * Position the scrollbar:
	 */
	position: function (x, y, width, height) {
		var scroller = this,
			options = scroller.options,
			vertical = options.vertical,
			xOffset = height,
			yOffset = 0;

		scroller.x = x;
		scroller.y = y;
		scroller.width = width; // width w/ buttons
		scroller.barWidth = width - height * 2; // width w/o buttons
		scroller.height = height;
		scroller.xOffset = xOffset;
		scroller.yOffset = yOffset;

		// If Scrollbar is vertical type, swap options:
		if (vertical) {
			scroller.width = scroller.yOffset = width = yOffset = options.height;
			scroller.xOffset = xOffset = 0;
			scroller.barWidth = height - width * 2;
		}

		// Set general position for a group:
		scroller.group.attr({
			translateX: x,
			translateY: y
		});

		// Resize background/track:
		scroller.track.attr({
			width: width - 2 * xOffset,
			height: height - 2 * yOffset,
			x: xOffset - options.trackBorderWidth % 2 / 2,
			y: yOffset - options.trackBorderWidth % 2 / 2
		});

		// Move right/bottom button ot it's place:
		scroller.scrollbarButtons[1].attr({
			translateX: vertical ? 0 : width - xOffset,
			translateY: vertical ? height - yOffset : 0
		});
	},

	/**
	 * Draw the scrollbar buttons with arrows
	 * @param {Number} index 0 is left, 1 is right
	 */
	drawScrollbarButton: function (index) {
		var scroller = this,
			renderer = scroller.renderer,
			scrollbarButtons = scroller.scrollbarButtons,
			options = scroller.options,
			height = options.height,
			group;

		group = renderer.g().add(scroller.group);
		scrollbarButtons.push(group);

		// Button rect:
		renderer.rect(
			-0.5, 
			-0.5, 
			height + 1,  // +1 to compensate for crispifying in rect method
			height + 1,
			options.buttonBorderRadius,
			options.buttonBorderWidth
		).attr({
			stroke: options.buttonBorderColor,
			'stroke-width': options.buttonBorderWidth,
			fill: options.buttonBackgroundColor
		}).add(group);

		// Button arrow:
		renderer.path(scroller.swapXY([
            'M',
            height / 2 + (index ? -1 : 1), 
            height / 2 - 3,
            'L',
            height / 2 + (index ? -1 : 1), 
            height / 2 + 3,
            'L',
            height / 2 + (index ? 2 : -2), 
            height / 2
        ], options.vertical)).attr({
			fill: options.buttonArrowColor
		}).add(group);
	},

	/**
	* When we have vertical scrollbar, rifles are rotated, the same for arrow in buttons:
	*/
	swapXY: function (path, vertical) {
		var i = 0,
			len = path.length,
			temp;

		if (vertical) {
			for ( ; i < len; i += 3) {
				temp = path[i + 1];
				path[i + 1] = path[i + 2];
				path[i + 2] = temp;
			}
		}

		return path;
 	},

 	/**
 	* Set scrollbar size, with a given scale. From and to should be in 0-1 scale.
 	*/
 	setRange: function (from, to) {
 		var scroller = this,
 			options = scroller.options,
 			vertical = options.vertical,
			fromPX,
			toPX,
			newPos,
			newSize,
			newRiflesPos;

 		if (!defined(scroller.barWidth)) {
 			return;
 		}

		fromPX = scroller.barWidth * Math.max(from, 0);
		toPX = scroller.barWidth * Math.min(to, 1);
		newSize = Math.max(correctFloat(toPX - fromPX), 1);
		newPos = Math.floor(fromPX + scroller.xOffset + scroller.yOffset);
		newRiflesPos = Math.floor(newSize / 2);

 		// Store current position:
 		scroller.from = from;
 		scroller.to = to;

 		if (!vertical) {
 			scroller.scrollbarGroup.attr({
	 			translateX: newPos
 			});
	 		scroller.scrollbar.attr({
	 			width: newSize
	 		});
	 		scroller.scrollbarRifles.attr({
	 			translateX: newRiflesPos
	 		});
	 		scroller.scrollbarLeft = newPos;
	 		scroller.scrollbarTop = 0;
 		} else {
 			scroller.scrollbarGroup.attr({
	 			translateY: newPos
 			});
	 		scroller.scrollbar.attr({
	 			height: newSize
	 		});
	 		scroller.scrollbarRifles.attr({
	 			translateY: newRiflesPos
	 		});
	 		scroller.scrollbarTop = newPos;
	 		scroller.scrollbarLeft = 0;
 		}

 		if (newSize <= 20) {
 			scroller.scrollbarRifles.hide();
 		} else {
 			scroller.scrollbarRifles.show();
 		}
 	},

 	/**
 	* Init events methods, so we have an access to the Scrollbar itself
 	*/
 	initEvents: function () {
 		var scroller = this;
		/**
		 * Event handler for the mouse move event.
		 */
		scroller.mouseMoveHandler = function (e) {
			var normalizedEvent = scroller.chart.pointer.normalize(e),
				options = scroller.options,
				direction = options.vertical ? 'chartY' : 'chartX',
				initPositions = scroller.initPositions,
				scrollPosition,
				chartPosition,
				change;

			// In iOS, a mousemove event with e.pageX === 0 is fired when holding the finger
			// down in the center of the scrollbar. This should be ignored.
			if (scroller.grabbedCenter && (!e.touches || e.touches[0][direction] !== 0)) { // #4696, scrollbar failed on Android

				chartPosition = {
					chartX: (normalizedEvent.chartX - scroller.x - scroller.xOffset) / scroller.barWidth,
					chartY: (normalizedEvent.chartY - scroller.y - scroller.yOffset) / scroller.barWidth
				}[direction];
				scrollPosition = scroller[direction];

				change = chartPosition - scrollPosition;

				scroller.updatePosition(initPositions[0] + change, initPositions[1] + change);

				if (scroller.options.liveRedraw) {
					setTimeout(function () {
						scroller.mouseUpHandler(e);
					}, 0);
				} else {
					scroller.setRange(scroller.from, scroller.to);
				}

				scroller.hasDragged = true;
			}
		};

		/**
		 * Event handler for the mouse up event.
		 */
		scroller.mouseUpHandler = function (e) {
			if (scroller.hasDragged) {
				fireEvent(scroller, 'changed', {
					from: scroller.from,
					to: scroller.to,
					trigger: 'scrollbar',
					DOMEvent: e
				});
			}

			if (e.type !== 'mousemove') {
				scroller.grabbedCenter = scroller.hasDragged = scroller.chartX = scroller.chartY = null;
			}

		};

		scroller.mouseDownHandler = function (e) {
			var normalizedEvent = scroller.chart.pointer.normalize(e);

			scroller.chartX = (normalizedEvent.chartX - scroller.x - scroller.xOffset) / scroller.barWidth;
			scroller.chartY = (normalizedEvent.chartY - scroller.y - scroller.yOffset) / scroller.barWidth;
			scroller.initPositions = [scroller.from, scroller.to];

			scroller.grabbedCenter = true;
		};

	 	scroller.buttonToMinClick = function (e) {
	 		var range = (scroller.to - scroller.from) * scroller.step;
	 		scroller.updatePosition(scroller.from - range, scroller.to - range);
			fireEvent(scroller, 'changed', {
				from: scroller.from,
				to: scroller.to,
				trigger: 'scrollbar',
				DOMEvent: e
			});
	 	};

	 	scroller.buttonToMaxClick = function (e) {
	 		var range = (scroller.to - scroller.from) * scroller.step;
	 		scroller.updatePosition(scroller.from + range, scroller.to + range);
			fireEvent(scroller, 'changed', {
				from: scroller.from,
				to: scroller.to,
				trigger: 'scrollbar',
				DOMEvent: e
			});
	 	};

	 	scroller.trackClick = function (e) {
	 		var normalizedEvent = scroller.chart.pointer.normalize(e),
	 			range = scroller.to - scroller.from,
	 			top = scroller.y + scroller.scrollbarTop,
	 			left = scroller.x + scroller.scrollbarLeft;

	 		if ((scroller.options.vertical && normalizedEvent.chartY > top) || 
	 			(!scroller.options.vertical && normalizedEvent.chartX > left)) {
	 			// On the top or on the left side of the track:
 				scroller.updatePosition(scroller.from + range, scroller.to + range);
 			} else {
 				// On the bottom or the right side of the track:
 				scroller.updatePosition(scroller.from - range, scroller.to - range);
 			}

			fireEvent(scroller, 'changed', {
				from: scroller.from,
				to: scroller.to,
				trigger: 'scrollbar',
				DOMEvent: e
			});
	 	};
 	},

 	/**
 	* Update position option in the Scrollbar, with normalized 0-1 scale
 	*/
 	updatePosition: function (from, to) {
 		if (to > 1) {
 			from = correctFloat(1 - (to - from));
 			to = 1;
 		}

 		if (from < 0) {
 			to = correctFloat(to - from);
 			from = 0;
 		}

 		this.from = from;
 		this.to = to;
 		this.setRange(from, to);
 	},

	/**
	 * Set up the mouse and touch events for the Scrollbar
	 */
	addEvents: function () {
		var buttonsOrder = this.options.iverted ? [1, 0] : [0, 1],
			buttons = this.scrollbarButtons,
			bar = this.scrollbarGroup.element,
			track = this.track.element,
			mouseDownHandler = this.mouseDownHandler,
			mouseMoveHandler = this.mouseMoveHandler,
			mouseUpHandler = this.mouseUpHandler,
			_events;

		// Mouse events
		_events = [
			[buttons[buttonsOrder[0]].element, 'click', this.buttonToMinClick],
			[buttons[buttonsOrder[1]].element, 'click', this.buttonToMaxClick],
			[track, 'click', this.trackClick],
			[bar, 'mousedown', mouseDownHandler],
			[doc, 'mousemove', mouseMoveHandler],
			[doc, 'mouseup', mouseUpHandler]
		];

		// Touch events
		if (hasTouch) {
			_events.push(
				[bar, 'touchstart', mouseDownHandler],
				[doc, 'touchmove', mouseMoveHandler],
				[doc, 'touchend', mouseUpHandler]
			);
		}

		// Add them all
		each(_events, function (args) {
			addEvent.apply(null, args);
		});
		this._events = _events;
	},

	/**
	 * Removes the event handlers attached previously with addEvents.
	 */
	removeEvents: function () {
		each(this._events, function (args) {
			removeEvent.apply(null, args);
		});
		this._events = UNDEFINED;
	},

	/**
	 * Destroys allocated elements.
	 */
	destroy: function () {
		var scroller = this;

		// Disconnect events added in addEvents
		scroller.removeEvents();

		// Destroy properties
		each([scroller.track, scroller.scrollbarRifles, scroller.scrollbar, scroller.scrollbarGroup, scroller.group], function (prop) {
			if (prop && prop.destroy) {
				prop = prop.destroy();
			}
		});

		// Destroy elements in collection
		each([scroller.scrollbarButtons], function (coll) {
			destroyObjectProperties(coll);
		});
	}
};

Highcharts.Scrollbar = Scrollbar;