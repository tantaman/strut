import React from 'react';
import Draggable from '../interactions/Draggable';
import Resizable from '../interactions/Resizable';

var resizeDirections = [
	'n',
	'w',
	's',
	'e',
	'nw',
	'sw',
	'ne',
	'se'
];

class CropOverlay extends React.Component {
	componentWillUnmount = Draggable.componentWillUnmount;
	componentWillMount() {
		Draggable.componentWillMount.call(this);
		Resizable.componentWillMount.call(this);
	}
	onDeltaDrag = Resizable.onDeltaDrag.bind(this);
	onDeltaDragStart = Resizable.onDeltaDragStart.bind(this);
	onMouseDown = Draggable.onMouseDown.bind(this);
	onMouseUp = Draggable.onMouseUp.bind(this);
	onMouseMove = Draggable.onMouseMove.bind(this);

	constructor(props) {
		this.state = {
			width: this.props.width,
			height: this.props.height
		};
	}

	getDefaultProps() {
		return {
			width: 0,
			height: 0
		}
	}

	onDrag = (e) => {
		if (this.props.onChange) {
			this.props.onChange({
				left: this.state.left,
				top: this.state.top,
				width: this.state.width,
				height: this.state.height
			});
		}
	}

	onResize = (e) => {
		this.onDrag();
	};

	render() {
		var resizeControls = resizeDirections.map(function(d) {
			return (
				<ResizeControl
					key={d}
					onDeltaDrag={this.onDeltaDrag}
					onDeltaDragStart={this.onDeltaDragStart}
					direction={d}
					className={"wdgt-resize-point wdgt-" + d} />
			);
		}, this);

		return (
			<div
				onMouseDown={this.onMouseDown}
				className="wdgt-crop-overlay"
				style={{
					top: this.state.top + 'px',
					left: this.state.left + 'px',
					width: this.state.width + 'px',
					height: this.state.height + 'px'
				}}>
				<div className="wdgt-grid-dashed-h" />
				<div className="wdgt-grid-dashed-v" />
				{resizeControls}
			</div>
		);
	}
};

module.exports = CropOverlay;
