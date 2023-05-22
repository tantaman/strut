'use strict';

import React from 'react';
import _ from 'lodash';

class ImagePreview extends React.Component {
	state = {
		canvasW: 0,
		canvasH: 0
	};

	componentDidMount() {
		window.g = this.g = this.refs.canvas.getDOMNode().getContext('2d');
		this.size = this.computeSize();
		this.sizeCanvas();
		this.renderImage(this.props);
	}

	componentWillUnmount() {
		if (this.ourl) {
			URL.revokeObjectURL(this.ourl);
			this.ourl = this.image = null;
		}
	}

	computeSize() {
		var style = window.getComputedStyle(this.getDOMNode());
		return {
			width: parseInt(style.width),
			height: parseInt(style.height)
		};
	}

	renderImage(newProps) {
		var src = newProps.src;

		// Had a previous object url?
		// clean that shit up.
		if (this.ourl) {
			URL.revokeObjectURL(this.ourl);
			this.ourl = this.image = null;
		}

		// No actual src?  Bail.
		if (!src) return;

		// we may or may not need to create a new url from
		// the provided src.
		// osrc is that may or may not.
		var osrc = src;
		this.src = src;
		if (typeof src != 'string'
				&& !(src instanceof HTMLElement)) {
			this.ourl = osrc = URL.createObjectURL(src);
		}

		// convert the src to something drawable
		if (!(src instanceof HTMLElement)) {
			this.image = new Image();
			this.image.src = osrc;

			var self = this;
			// can't draw it till it is actually laoded
			this.image.onload = function() {
				// someone may have changed the src on us before this guy loaded
				// so check to make sure we're drawing what we think we're drawing.
				if (src == self.src) {
					if (newProps.scale) {
						self.drawImageScaled(newProps);
					} else {
						self.drawImage(newProps);
					}
					if (this.ourl) {
						URL.revokeObjectURL(this.ourl);
						this.ourl = null;
					}
				}
			};
		} else {
			// TODO: clean this up and the above.
			this.image = src;
			if (newProps.scale) {
				this.drawImageScaled(newProps);
			} else {
				this.drawImage(newProps);
			}
		}
	}

	// TODO: preserve aspect ratio and re-center...
	drawImageScaled(newProps) {
		this.g.clearRect(
			0,
			0,
			this.size.width,
			this.size.height
		);
		var sx = newProps.sx || 0;
		var sy = newProps.sy || 0;
		var sw = newProps.sw || this.image.width;
		var sh = newProps.sh || this.image.height;

		var scale = funcs.getFitSquareScaleFactor(
			sw,
			sh,
			this.size.width,
			this.size.height
		);

		this.g.drawImage(
			this.image,
			sx,
			sy,
			sw,
			sh,
			0,
			0,
			scale * sw,
			scale * sh
		);

		if (newProps.onDraw) {
			setTimeout(newProps.onDraw, 0);
		}
	}

	drawImage(newProps) {
		this.g.clearRect(
			0,
			0,
			this.size.width,
			this.size.height
		);
		var sx = newProps.sx || 0;
		var sy = newProps.sy || 0;
		var sw = newProps.sw || this.image.width;
		var sh = newProps.sh || this.image.height;

		this.g.drawImage(
			this.image,
			sx,
			sy,
			sw,
			sh
		);

		if (newProps.onDraw) {
			setTimeout(newProps.onDraw, 0);
		}
	}

	componentDidUpdate() {
		this.renderImage(this.props);
	}

	shouldComponentUpdate(newProps, newState) {
		// Trying to render the same image?  Bail.
		if (_.isEqual(newProps, this.props)
			&& _.isEqual(newState, this.state)) {
			return false;
		}

		return true;
	}

	sizeCanvas() {
		this.setState({
			canvasW: this.size.width,
			canvasH: this.size.height
		});
	}

	render() {
		return (
			<div
				className={(this.props.className||'') + " wdgt-img-preview"}>
				<canvas
					ref="canvas"
					width={this.state.canvasW}
					height={this.state.canvasH}
				/>
				{this.props.children}
			</div>
		);
	}
};

export default ImagePreview;
