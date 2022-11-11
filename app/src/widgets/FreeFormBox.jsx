/*
Shows control points and ant box around its content.
Events from control points get bubbled up to outside event handlers instead
of being handled by the box itself.
*/

import Css from '../html/Css';
import DeltaDragControl from './DeltaDragControl';
import Draggable from '../interactions/Draggable';
import React from 'react';
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

class FreeFormBox extends React.Component {
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

	componentWillMount() {
		this._lastClick = 0;
	}

	onDrag = (e) => {
		if (this.props.onChange) {
			var model = this.props.model;
			this.props.onChange({
				left: e.left,
				top: e.top,
				width: model.style.width,
				height: model.style.height
			});
		}
	};

	onDragStart = () => {
		return this.props.model.selected && !this.props.model.editing;
	};

	onResize = (e) => {
		if (this.props.onChange) {
			var model = this.props.model;
			this.props.onChange({
				left: e.left != null ? e.left : model.style.left,
				top: e.top != null ? e.top : model.style.top,
				width: e.width != null ? e.width : model.style.width,
				height: e.height != null ? e.height : model.style.height
			});
		}
	};

	onClick = (e) => {
		if (this.props.onClick) {
			this.props.onClick(e);
		}
	};

	_onMouseDown = (e) => {
		if (this.props.onMouseDown) {
			this.props.onMouseDown(e);
		}
		this.onMouseDown(e);
	};

	_renderResizeControl(d) {
		return (
			<DeltaDragControl
				key={d}
				onDeltaDrag={this.onDeltaDrag}
				onDeltaDragStart={this.onDeltaDragStart}
				onClick={this.props.onClick}
				containerScale={this.props.containerScale}
				direction={d}
				className={"wdgt-resize-point wdgt-" + d} />
		);
	}

	render() {
		var model = this.props.model;
		if (model.selected && !model.editing) {
			var resizeControls = resizeDirections.map(this._renderResizeControl);
		}

		return (
			<div
				onMouseDown={this._onMouseDown}
				onClick={this.onClick}
				className={Css.toClassString({
					"wdgt-crop-overlay": true,
					selected: model.selected && !model.editing,
					editing: model.editing,
				})}
				style={model.style}>
				{resizeControls}
				{this.props.children}
			</div>
		);
	}
};

export default FreeFormBox;
