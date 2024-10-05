import React, { useEffect, useRef, useState } from "react";

const SWATCHES = [
  "#000000", // black
  "#ffffff", // white
  "#ee3333", // red
  "#e64980", // pink
  "#be4bdb", // purple
  "#893200", // brown
  "#228be6", // blue
  "#3333ee", // dark blue
  "#40c057", // green
  "#00aa00", // dark green
  "#fab005", // yellow
  "#fd7e14", // orange
];

const App = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("rgb(255, 255, 255)");
  const [shouldReset, setShouldReset] = useState(false);
  const [variableStorage, setVariableStorage] = useState({});
  const [calculationResult, setCalculationResult] = useState(null);
  const [latexPosition, setLatexPosition] = useState({ x: 10, y: 200 });
  const [latexExpressions, setLatexExpressions] = useState([]);

  useEffect(() => {
    if (latexExpressions.length > 0 && window.MathJax) {
      setTimeout(() => {
        window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
      }, 0);
    }
  }, [latexExpressions]);

  useEffect(() => {
    if (calculationResult) {
      displayLatexOnCanvas(
        calculationResult.expression,
        calculationResult.answer
      );
    }
  }, [calculationResult]);

  useEffect(() => {
    if (shouldReset) {
      clearCanvas();
      setLatexExpressions([]);
      setCalculationResult(null);
      setVariableStorage({});
      setShouldReset(false);
    }
  }, [shouldReset]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - canvas.offsetTop;
        ctx.lineCap = "round";
        ctx.lineWidth = 3;
      }
    }

    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML";
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.MathJax.Hub.Config({
        tex2jax: {
          inlineMath: [
            ["$", "$"],
            ["\\(", "\\)"],
          ],
        },
      });
    };

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const displayLatexOnCanvas = (expression, answer) => {
    const latex = `\\(\\LARGE{${expression} = ${answer}}\\)`;
    setLatexExpressions((prevExpressions) => [...prevExpressions, latex]);

    clearCanvas();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const initializeDrawing = (event) => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.background = "black";
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
        setIsDrawing(true);
      }
    }
  };

  const draw = (event) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = brushColor;
        ctx.lineTo(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
        ctx.stroke();
      }
    }
  };

  const finishDrawing = () => {
    setIsDrawing(false);
  };

  const processDrawing = async () => {
    const canvas = canvasRef.current;
    const URL = "http://localhost:3000/calculate";
    if (canvas) {
      try {
        const response = await fetch(URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image: canvas.toDataURL("image/png"),
            dict_of_vars: variableStorage,
          }),
        });

        const data = await response.json();
        console.log("Response", data);

        data.data.forEach((item) => {
          if (item.assign === true) {
            setVariableStorage((prevStorage) => ({
              ...prevStorage,
              [item.expr]: item.result,
            }));
          }
        });

        const ctx = canvas.getContext("2d");
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let minX = canvas.width,
          minY = canvas.height,
          maxX = 0,
          maxY = 0;

        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const i = (y * canvas.width + x) * 4;
            if (imageData.data[i + 3] > 0) {
              // If pixel is not transparent
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
            }
          }
        }

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        setLatexPosition({ x: centerX, y: centerY });

        data.data.forEach((item) => {
          setTimeout(() => {
            setCalculationResult({
              expression: item.expr,
              answer: item.result,
            });
          }, 1000);
        });
      } catch (error) {
        console.error("Error processing drawing:", error);
      }
    }
  };

  const DraggableLatex = ({ latex, index }) => {
    const [position, setPosition] = useState(latexPosition);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const handleMouseDown = (e) => {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    useEffect(() => {
      if (isDragging) {
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
      } else {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      }
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }, [isDragging]);

    return (
      <div
        className="absolute p-2 text-white rounded shadow-md cursor-move"
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
        onMouseDown={handleMouseDown}
      >
        <div className="latex-content">{latex}</div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-screen">
      <div className="grid grid-cols-3 gap-2 absolute top-0 left-0 right-0 z-10 bg-gray-800 p-2">
        <button
          onClick={() => setShouldReset(true)}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Reset
        </button>
        <div className="flex justify-center space-x-2">
          {SWATCHES.map((swatch) => (
            <button
              key={swatch}
              className="w-8 h-8 rounded-full border-2 border-white"
              style={{ backgroundColor: swatch }}
              onClick={() => setBrushColor(swatch)}
            />
          ))}
        </div>
        <button
          onClick={processDrawing}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Process
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
        onMouseDown={initializeDrawing}
        onMouseMove={draw}
        onMouseUp={finishDrawing}
        onMouseOut={finishDrawing}
      />
      {latexExpressions.map((latex, index) => (
        <DraggableLatex key={index} latex={latex} index={index} />
      ))}
    </div>
  );
};

export default App;
