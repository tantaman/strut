import { useState, useRef } from "react";
import React from "react";
import "styles/interactions/Draggable.css";

import type { Position } from "../html/html";

import css from "../html/Css";

export default function Draggable({
  children,
  className,
  onClick,
  onDragStart,
  onDragEnd,
  onDragging,
  style,
}: {
  children: React.ReactNode;
  className: string;
  onClick: () => void;
  onDragStart?: () => void;
  onDragging: (pos: Position) => void;
  onDragEnd?: () => void;
  style: Object;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMouseDown, setMouseDown] = useState(false);
  const [isDragging, setDragging] = useState<boolean>(false);
  const [startContainerPosition, setStartContainerPosition] =
    useState<Position>({
      top: undefined,
      left: undefined,
    });
  const [startMousePosition, setStartMousePosition] = useState<Position>({
    top: undefined,
    left: undefined,
  });

  const onMouseDown = (e: React.MouseEvent) => {
    setMouseDown(true);
    setStartMousePosition({
      top: e.clientY,
      left: e.clientX,
    });
    setStartContainerPosition({
      top: containerRef.current?.offsetTop,
      left: containerRef.current?.offsetLeft,
    });
  };
  const onMouseUp = () => {
    if (onDragEnd && isDragging) {
      onDragEnd();
    }
    setMouseDown(false);
    setDragging(false);
  };
  const onMouseLeave = onMouseUp;
  const onMouseMove = (e: React.MouseEvent) => {
    if (isMouseDown) {
      const pos = {
        left:
          (startContainerPosition.left || 0) +
          e.clientX -
          (startMousePosition.left || 0),
        top:
          (startContainerPosition.top || 0) +
          e.clientY -
          (startMousePosition.top || 0),
      };
      if (!isDragging) {
        setDragging(true);
        if (onDragStart) {
          onDragStart();
        }
      } else {
        onDragging(pos);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={css.toClassString({
        dragging: isDragging,
        [className]: true,
      })}
      onClick={onClick}
      style={style}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onMouseMove={onMouseMove}
    >
      {children}
    </div>
  );
}
