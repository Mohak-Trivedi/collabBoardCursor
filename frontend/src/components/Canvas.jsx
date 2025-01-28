import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:3001");

function Canvas() {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const contextRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 800;
    canvas.height = 600;

    const context = canvas.getContext("2d");
    context.lineCap = "round";
    context.strokeStyle = color;
    context.lineWidth = 2;
    contextRef.current = context;

    // Listen for drawing history when connecting
    socket.on("drawing_history", (history) => {
      history.forEach((data) => {
        const context = contextRef.current;
        context.strokeStyle = data.color;
        context.beginPath();
        context.moveTo(data.x0, data.y0);
        context.lineTo(data.x1, data.y1);
        context.stroke();
      });
    });

    // Listen for drawing events from other users
    socket.on("draw", (data) => {
      const context = contextRef.current;
      context.strokeStyle = data.color;
      context.beginPath();
      context.moveTo(data.x0, data.y0);
      context.lineTo(data.x1, data.y1);
      context.stroke();
    });

    // Listen for clear canvas events
    socket.on("clear_canvas", () => {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      context.clearRect(0, 0, canvas.width, canvas.height);
    });

    return () => {
      socket.off("drawing_history");
      socket.off("draw");
      socket.off("clear_canvas");
    };
  }, []);

  const startDrawing = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    contextRef.current.strokeStyle = color;
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const { offsetX, offsetY } = e.nativeEvent;
    const context = contextRef.current;

    // Draw on local canvas
    context.lineTo(offsetX, offsetY);
    context.stroke();

    // Emit drawing data to server
    socket.emit("draw", {
      x0: e.nativeEvent.offsetX - e.movementX,
      y0: e.nativeEvent.offsetY - e.movementY,
      x1: offsetX,
      y1: offsetY,
      color: color,
    });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit("clear_canvas");
  };

  return (
    <div className="canvas-container">
      <div className="controls">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
        <button onClick={clearCanvas}>Clear Canvas</button>
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
    </div>
  );
}

export default Canvas;
