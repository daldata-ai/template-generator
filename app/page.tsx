"use client"
import React, { useState, useRef, useEffect } from 'react';

const ImageTextPositionTool = () => {
  const [imageUrl, setImageUrl] = useState(null);
  const [positionX, setPositionX] = useState(50); // X-coordinate for intersection point
  const [positionY, setPositionY] = useState(50); // Y-coordinate for intersection point
  const [textContent, setTextContent] = useState('Sample Text');
  const [textSize, setTextSize] = useState(16);
  const [textPosition, setTextPosition] = useState('center'); // center, left, right
  const [textColor, setTextColor] = useState('#000000'); // Text color option
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState('point'); // 'point', 'vertical', 'horizontal'
  const [pixelCoords, setPixelCoords] = useState({ x: 0, y: 0 });
  const [originalImageSize, setOriginalImageSize] = useState({ width: 0, height: 0 });
  const [scaledImageSize, setScaledImageSize] = useState({ width: 0, height: 0 });
  const [textBounds, setTextBounds] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setOriginalImageSize({ width: img.width, height: img.height });
        };
        img.src = e.target.result;
        setImageUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Update container dimensions when window resizes
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Update canvas when image, line positions, or text properties change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageUrl) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate dimensions to maintain aspect ratio
      const aspectRatio = img.width / img.height;
      let canvasWidth = containerDimensions.width;
      let canvasHeight = canvasWidth / aspectRatio;

      if (canvasHeight > containerDimensions.height) {
        canvasHeight = containerDimensions.height;
        canvasWidth = canvasHeight * aspectRatio;
      }

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      setScaledImageSize({ width: canvasWidth, height: canvasHeight });

      // Draw image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Calculate line positions on canvas
      const vx = (positionX / 100) * canvas.width;
      const hy = (positionY / 100) * canvas.height;

      // Calculate actual pixel coordinates on original image
      const originalX = Math.round((positionX / 100) * originalImageSize.width);
      const originalY = Math.round((positionY / 100) * originalImageSize.height);

      setPixelCoords({
        x: originalX,
        y: originalY
      });

      // Draw vertical line
      ctx.beginPath();
      ctx.moveTo(vx, 0);
      ctx.lineTo(vx, canvas.height);
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw horizontal line
      ctx.beginPath();
      ctx.moveTo(0, hy);
      ctx.lineTo(canvas.width, hy);
      ctx.strokeStyle = 'blue';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Mark intersection point
      ctx.beginPath();
      ctx.arc(vx, hy, 5, 0, 2 * Math.PI);
      ctx.fillStyle = 'green';
      ctx.fill();

      // Add labels to the lines
      ctx.font = '12px Arial';
      ctx.fillStyle = 'black';
      ctx.fillText(`X = ${originalX}`, vx + 8, 15);
      ctx.fillText(`Y = ${originalY}`, 5, hy - 5);

      // Set up font for text
      const scaledFontSize = textSize * (canvasWidth / originalImageSize.width);
      ctx.font = `${scaledFontSize}px Arial`;

      // Measure the text
      const textMetrics = ctx.measureText(textContent);
      const textWidth = textMetrics.width;
      const textHeight = scaledFontSize;

      let textX;
      const textY = hy; // Position text above the horizontal line

      // Calculate text position based on selected mode
      if (textPosition === 'center') {
        // Center text at intersection point
        textX = vx - (textWidth / 2);
      } else if (textPosition === 'left') {
        // Place text to the left of intersection point
        textX = Math.max(0, vx - textWidth);
      } else if (textPosition === 'right') {
        // Place text to the right of intersection point
        textX = vx;
      }

      // Store the text bounds for display in the UI
      setTextBounds({
        x: Math.round((textX / canvasWidth) * originalImageSize.width),
        y: Math.round(((textY - textHeight) / canvasHeight) * originalImageSize.height),
        width: Math.round((textWidth / canvasWidth) * originalImageSize.width),
        height: Math.round((textHeight / canvasHeight) * originalImageSize.height)
      });

      // Draw a background rectangle for better text visibility
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillRect(textX, textY - textHeight, textWidth, textHeight);

      // Draw the text with selected color
      ctx.fillStyle = textColor;
      ctx.fillText(textContent, textX, textY);

      // Draw a border around the text bounds
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(textX, textY - textHeight, textWidth, textHeight);

      // Simulate how this would look as a "final result"
      // Create a copy of the canvas for the simulation
      const simulationCanvas = document.createElement('canvas');
      simulationCanvas.width = canvas.width;
      simulationCanvas.height = canvas.height;
      const simCtx = simulationCanvas.getContext('2d');

      // Draw just the image
      simCtx.drawImage(img, 0, 0, simulationCanvas.width, simulationCanvas.height);

      // Draw the text with background
      simCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      simCtx.fillRect(textX, textY - textHeight, textWidth, textHeight);
      simCtx.fillStyle = textColor;
      simCtx.font = `${scaledFontSize}px Arial`;
      simCtx.fillText(textContent, textX, textY);

      // Draw a small dot at the reference point
      simCtx.beginPath();
      simCtx.arc(vx, hy, 3, 0, 2 * Math.PI);
      simCtx.fillStyle = 'rgba(0, 128, 0, 0.5)';
      simCtx.fill();

      // Draw the simulation on a separate part of the canvas
      ctx.drawImage(simulationCanvas, 0, 0);
    };

    img.src = imageUrl;
  }, [imageUrl, positionX, positionY, containerDimensions, originalImageSize, textContent, textSize, textPosition, textColor]);

  // Determine what part of the line is being dragged
  const getClickedElement = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate positions
    const vX = (positionX / 100) * canvas.width;
    const hY = (positionY / 100) * canvas.height;

    // Distance from the mouse to elements
    const distToVertical = Math.abs(mouseX - vX);
    const distToHorizontal = Math.abs(mouseY - hY);
    const distToIntersection = Math.sqrt(Math.pow(mouseX - vX, 2) + Math.pow(mouseY - hY, 2));

    // Check intersection point first (it has precedence)
    if (distToIntersection < 10) {
      return 'point';
    }
    // Then check if we're near a line
    else if (distToVertical < 10) {
      return 'vertical';
    }
    else if (distToHorizontal < 10) {
      return 'horizontal';
    }

    return null;
  };

  // Handle mouse events for dragging
  const handleMouseDown = (e) => {
    if (!canvasRef.current || !imageUrl) return;

    // Determine what element was clicked
    const element = getClickedElement(e);
    if (!element) return;

    setDragMode(element);
    setIsDragging(true);
    updatePosition(e);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    updatePosition(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragMode('point');
  };

  // Update position based on mouse position and drag mode
  const updatePosition = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newXPos = (x / canvas.width) * 100;
    const newYPos = (y / canvas.height) * 100;

    // If shift key is pressed, only move the selected axis
    if (e.shiftKey) {
      // Update based on drag mode
      if (dragMode === 'vertical') {
        setPositionX(Math.max(0, Math.min(100, newXPos)));
      } else if (dragMode === 'horizontal') {
        setPositionY(Math.max(0, Math.min(100, newYPos)));
      } else if (dragMode === 'point') {
        // When dragging the point with shift, move the nearest line
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const vX = (positionX / 100) * canvas.width;
        const hY = (positionY / 100) * canvas.height;

        // Determine which axis to move based on which is closer to the mouse
        const distToVertical = Math.abs(mouseX - vX);
        const distToHorizontal = Math.abs(mouseY - hY);

        if (distToVertical <= distToHorizontal) {
          setPositionX(Math.max(0, Math.min(100, newXPos)));
        } else {
          setPositionY(Math.max(0, Math.min(100, newYPos)));
        }
      }
    } else {
      // Without shift, move according to the drag mode
      if (dragMode === 'point') {
        // Move both coordinates when dragging the point
        setPositionX(Math.max(0, Math.min(100, newXPos)));
        setPositionY(Math.max(0, Math.min(100, newYPos)));
      } else if (dragMode === 'vertical') {
        // Move only X when dragging vertical line
        setPositionX(Math.max(0, Math.min(100, newXPos)));
      } else if (dragMode === 'horizontal') {
        // Move only Y when dragging horizontal line
        setPositionY(Math.max(0, Math.min(100, newYPos)));
      }
    }
  };

  return (
    <div className="max-w-4xl p-4 bg-gray-100 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Image Text Positioning Tool</h2>

      {/* Upload section */}
      <div className="mb-4">
        <label className="block mb-2">
          <span className="text-gray-700">Upload Image:</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </label>
      </div>

      {/* Text controls */}
      {imageUrl && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-2">
              <span className="text-gray-700">Text Content:</span>
              <input
                type="text"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </label>
          </div>
          <div>
            <label className="block mb-2">
              <span className="text-gray-700">Text Size (px):</span>
              <input
                type="number"
                value={textSize}
                onChange={(e) => setTextSize(Math.max(8, parseInt(e.target.value) || 16))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                min="8"
              />
            </label>
          </div>
          <div>
            <label className="block mb-2">
              <span className="text-gray-700">Text Color:</span>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm"
              />
            </label>
          </div>
          <div className="md:col-span-2">
            <span className="text-gray-700 block mb-2">Text Position Mode:</span>
            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="center"
                  checked={textPosition === 'center'}
                  onChange={() => setTextPosition('center')}
                  className="form-radio"
                />
                <span className="ml-2">Centered at reference point</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="left"
                  checked={textPosition === 'left'}
                  onChange={() => setTextPosition('left')}
                  className="form-radio"
                />
                <span className="ml-2">Left of reference point</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="right"
                  checked={textPosition === 'right'}
                  onChange={() => setTextPosition('right')}
                  className="form-radio"
                />
                <span className="ml-2">Right of reference point</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Canvas container */}
      <div
        ref={containerRef}
        className="relative w-full h-96 bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-gray-300 rounded-lg"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {imageUrl ? (
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full cursor-move"
          />
        ) : (
          <div className="text-gray-500">Upload an image to begin</div>
        )}
      </div>

      {/* Instructions */}
      {imageUrl && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
          <p><strong>Instructions:</strong></p>
          <ul className="list-disc pl-5">
            <li>Click and drag the green point to move both X and Y coordinates</li>
            <li>Drag the vertical (red) line to move only the X coordinate</li>
            <li>Drag the horizontal (blue) line to move only the Y coordinate</li>
            <li>Hold <strong>Shift</strong> while dragging to move only the selected line (X or Y)</li>
            <li>Text is placed relative to the reference point according to the selected position mode</li>
          </ul>
        </div>
      )}

      {/* Position information */}
      {imageUrl && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-white rounded-md shadow">
            <h3 className="font-semibold mb-2">Reference Point:</h3>
            <p className="flex justify-between">
              <span>Coordinates:</span>
              <span className="text-green-600 font-medium">(x={pixelCoords.x}, y={pixelCoords.y})</span>
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Original image size: {originalImageSize.width}px × {originalImageSize.height}px
            </p>
          </div>

          <div className="p-3 bg-white rounded-md shadow">
            <h3 className="font-semibold mb-2">Text Placement:</h3>
            <p>Mode: <span className="text-blue-600 font-medium">{textPosition}</span></p>
            <p>Font Size: {textSize}px</p>
            <p>
              Text Color:
              <span style={{ color: textColor }} className="ml-2">{textColor}</span>
              <span className="inline-block w-4 h-4 ml-2 align-middle" style={{ backgroundColor: textColor, border: '1px solid #ccc' }}></span>
            </p>
            <p>Text: "{textContent}"</p>
            <p>Position: <span className="text-purple-600">({textBounds.x}, {textBounds.y})</span></p>
            <p>Dimensions: {textBounds.width}px × {textBounds.height}px</p>
          </div>

          <div className="md:col-span-2 p-3 bg-white rounded-md shadow">
            <h3 className="font-semibold mb-2">Text Placement Explained:</h3>
            {textPosition === 'center' && (
              <p>
                The text is centered horizontally on the reference point at
                (x={pixelCoords.x}, y={pixelCoords.y}).
                With text width of {textBounds.width}px, the left edge starts at {textBounds.x}px and extends to {textBounds.x + textBounds.width}px.
              </p>
            )}
            {textPosition === 'left' && (
              <p>
                The text is placed to the left of the reference point,
                with its right edge at the point (x={pixelCoords.x}, y={pixelCoords.y}).
                The text starts at {textBounds.x}px and doesn't cross beyond the reference point.
              </p>
            )}
            {textPosition === 'right' && (
              <p>
                The text is placed to the right of the reference point,
                with its left edge starting exactly at the point (x={pixelCoords.x}, y={pixelCoords.y})
                and extending to {textBounds.x + textBounds.width}px.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageTextPositionTool;