import "./style.css";

const APP_NAME = "Stellar Stamps";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

// Create and append app title
const title = document.createElement("h1");
title.textContent = APP_NAME;
app.appendChild(title);

// Create and append canvas element
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.id = "drawingCanvas";
app.appendChild(canvas);

// Button creation
const createButton = (text: string, onClick: () => void) => {
    const button = document.createElement("button");
    button.textContent = text;
    button.addEventListener("click", onClick);
    app.appendChild(button);
    return button;
}

// Context for drawing
const ctx = canvas.getContext("2d");

let isDrawing = false;
let points: Array<Array<{ x: number, y: number }>> = [];
let redoStack: Array<Array<{ x: number, y: number }>> = [];
let currentLine: Array<{ x: number, y: number }> = [];

// Helper functions
const startDrawing = (event: MouseEvent) => {
    isDrawing = true;
    currentLine = []; // Start a new line
    currentLine.push({ x: event.offsetX, y: event.offsetY });
    points.push(currentLine);
    changeDrawEvent();
    redoStack = [];
};

const draw = (event: MouseEvent) => {
    if (!isDrawing) return;

    currentLine.push({ x: event.offsetX, y: event.offsetY });
    changeDrawEvent();
};

const stopDrawing = () => {
    isDrawing = false;
    currentLine = [];
};

const changeDrawEvent = () => {
    const customEvent = new CustomEvent("drawing-changed");
    canvas.dispatchEvent(customEvent);
};

// Redraw the canvas on drawing-changed
canvas.addEventListener("drawing-changed", () => {
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    points.forEach(line => {
        ctx.beginPath();
        line.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.stroke();
    });
});

// Clear button
createButton("Clear", () => {
    points = [];
    redoStack = [];
    changeDrawEvent();
});

// Undo button
createButton("Undo", () => {
    if (points.length > 0) {
        const lastLine = points.pop();
        if (lastLine) {
            redoStack.push(lastLine);
        }
        changeDrawEvent();
    }
});

// Redo button
createButton("Redo", () => {
    if(redoStack.length > 0) {
        const lastUndoneLine = redoStack.pop();
        if (lastUndoneLine) {
            points.push(lastUndoneLine);
        }
        changeDrawEvent();
    }
});

// Register mouse event listeners
canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseleave", stopDrawing);
