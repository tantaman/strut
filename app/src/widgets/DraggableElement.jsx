import Draggable from '../interactions/Draggable';
import React from 'react';

class DraggableElement extends React.Component {
  componentWillUnmount = Draggable.componentWillUnmount;
  componentWillMount = Draggable.componentWillMount;
  onMouseDown = Draggable.onMouseDown.bind(this);
  onMouseUp = Draggable.onMouseUp.bind(this);
  onMouseMove = Draggable.onMouseMove.bind(this);

  render() {
    var style = this.props.style;
    if (!this.props.doesntDragSelf) {
      style = this.props.style || {};

      if (this.props.vert) {
        style.top = this.state.top;
      }

      if (this.props.horiz) {
        style.left = this.state.left;
      }

      if (!this.props.vert && !this.props.horiz) {
        style.top = this.state.top;
        style.left = this.state.left;
      }
    }

    return (
      <div
        {...this.props}
        onMouseDown={this.onMouseDown}
        style={style}>
        {this.props.children}
      </div>
    );
  }

  onDrag = (e) => {
    if (this.props.onDrag) {
      this.props.onDrag(e);
    }
  }

  onDragStart = () => {
    if (this.props.onDragStart) {
      this.props.onDragStart();
    }
  }
};

module.exports = DraggableElement;
