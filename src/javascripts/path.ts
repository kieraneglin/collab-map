class Path {
  static scaleIncoming(data, canvasSize): object {
    let scale = canvasSize / data.size;
    let path = data.path;

    path.left *= scale;
    path.top *= scale;
    path.scaleX *= scale;
    path.scaleY *= scale;

    return path;
  }
}

export default Path;
