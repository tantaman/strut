export type Point = {
  x: number;
  y: number;
};

export const pointOperations = {
  isBottomRightOf(point: Point, other: Point) {
    return other.x >= point.x && other.y >= point.y;
  },

  isBottomLeftOf(point: Point, other: Point) {
    return other.x < point.x && other.y >= point.y;
  },

  isTopRightOf(point: Point, other: Point) {
    return other.x >= point.x && other.y < point.y;
  },

  isTopLeftOf(point: Point, other: Point) {
    return other.x < point.x && other.y >= point.y;
  },
};
