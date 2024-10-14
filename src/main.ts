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

// Context for drawing
const ctx = canvas.getContext("2d");

let drawing = false;

// Helper functions
const startDrawing = (event: MouseEvent) => {
    drawing = true;
    draw(event);
};

const draw = (event: MouseEvent) => {
    if (!drawing || !ctx) return;

    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(event.offsetX, event.offsetY);
    ctx.lineTo(event.offsetX, event.offsetY);
    ctx.stroke();
};

const stopDrawing = () => {
    drawing = false;
    if (ctx) {
        ctx.beginPath();
    };
};

// Register mouse event listeners
canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseleave", stopDrawing);

// Create and append "Clear" button
const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
clearButton.addEventListener("click", () => ctx?.clearRect(0, 0, canvas.width, canvas.height));
app.appendChild(clearButton);
