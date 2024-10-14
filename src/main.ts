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

class MarkerLine {
    private points: Array<{ x: number, y: number }>;
    private thickness: number;

    constructor(initialX: number, initialY: number, thickness: number) {
        this.points = [{ x: initialX, y: initialY }];
        this.thickness = thickness;
    }

    drag(x: number, y: number) {
        this.points.push({ x, y });
    }

    display(ctx: CanvasRenderingContext2D) {
        if (this.points.length < 2) return;

        ctx.strokeStyle = "black";
        ctx.lineWidth = this.thickness;
        ctx.lineCap = "round";

        ctx.beginPath();
        this.points.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.stroke();
    }
}

// Button creation
const createButton = (text: string, onClick: () => void, className?: string) => {
    const button = document.createElement("button");
    button.textContent = text;
    button.className = className || "";
    button.addEventListener("click", onClick);
    app.appendChild(button);
    return button;
}

// Context for drawing
const ctx = canvas.getContext("2d");

let isDrawing = false;
let points: Array<MarkerLine> = [];
let redoStack: Array<MarkerLine> = [];
let currentLine: MarkerLine | null = null;
let currentThickness = 2;

// Helper functions
const startDrawing = (event: MouseEvent) => {
    isDrawing = true;
    currentLine = new MarkerLine(event.offsetX, event.offsetY, currentThickness);
    points.push(currentLine);
    changeDrawEvent();
    redoStack = [];
};

const draw = (event: MouseEvent) => {
    if (isDrawing && currentLine) {
        currentLine.drag(event.offsetX, event.offsetY);
        changeDrawEvent();
    }
};

const stopDrawing = () => {
    isDrawing = false;
    currentLine = null;
};

const changeDrawEvent = () => {
    const customEvent = new CustomEvent("drawing-changed");
    canvas.dispatchEvent(customEvent);
};

// Redraw the canvas on drawing-changed
canvas.addEventListener("drawing-changed", () => {
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    points.forEach(line => line.display(ctx));
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

// Marker thickness buttons
const thinButton = createButton("Thin", () => {
    currentThickness = 2;
    thinButton.classList.add("selectedTool");
    thickButton.classList.remove("selectedTool");
}, "selectedTool"); // Default thickness

const thickButton = createButton("Thick", () => {
    currentThickness = 5;
    thickButton.classList.add("selectedTool");
    thinButton.classList.remove("selectedTool");
});

// Register mouse event listeners
canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseleave", stopDrawing);
