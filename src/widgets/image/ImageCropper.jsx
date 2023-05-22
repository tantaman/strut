'use strict';

import React from 'react';
import ImagePreview from './ImagePreview';
import CropOverlay from '../CropOverlay';

class ImageCropper extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			overlay: {
				width: this.props.overlay.width,
				height: this.props.overlay.height,
				top: this.props.overlay.top,
				left: this.props.overlay.left
			}
		};
	}

	getDefaultProps() {
		return {
			overlay: {
				width: 250,
				height: 100,
				top: 25,
				left: 25
			}
		}
	}

	onDraw = () => {
		this.onChange({
			width: this.state.overlay.width,
			height: this.state.overlay.height,
			top: this.state.overlay.top,
			left: this.state.overlay.left
		});
	};

	onChange = (e) => {
		if (this.props.onChange) {
			// Gotta get the canvas!!!
			e.src = this.getDOMNode().children[0];
			this.props.onChange(e);
		}
	};

	render() {
		return (
			<ImagePreview
				src={this.props.src}
				scale={true}
				onDraw={this.onDraw}
				className={(this.props.className||'') + ' wdgt-img-cropper'}>
				<div className="wdgt-crop-filter" />
				<CropOverlay
						width={this.state.overlay.width}
						height={this.state.overlay.height}
						top={this.state.overlay.top}
						left={this.state.overlay.left}
						onChange={this.onChange}
				/>
			</ImagePreview>
		);
	}
};

export default ImageCropper;
