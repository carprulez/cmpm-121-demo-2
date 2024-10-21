import "./style.css";

const APP_NAME = "Stellar Stamps";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

// Create and append app title
const title = document.createElement("h1");
title.textContent = APP_NAME;
app.appendChild(title);

// Create main container
const mainContainer = document.createElement("div");
mainContainer.className = "main-container";
app.appendChild(mainContainer);

// Create a container for the buttons
const buttonContainer = document.createElement("div");
buttonContainer.className = "button-container";
mainContainer.appendChild(buttonContainer);

// Create and append canvas element
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.id = "drawingCanvas";
mainContainer.appendChild(canvas);

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

class ToolPreview {
    private x: number;
    private y: number;
    private thickness: number;

    constructor(thickness: number) {
        this.x = 0;
        this.y = 0;
        this.thickness = thickness;
    }

    updatePosition(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.thickness / 2, 0, Math.PI * 2);
        ctx.stroke();
    }
}

class Sticker {
    private x: number;
    private y: number;
    private emoji: string;

    constructor(emoji: string, initialX: number, initialY: number) {
        this.x = initialX;
        this.y = initialY;
        this.emoji = emoji;
    }

    drag(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    display(ctx: CanvasRenderingContext2D) {
        ctx.font = "24px serif";
        ctx.fillText(this.emoji, this.x, this.y);
    }
}

class StickerPreview extends Sticker {
    draw(ctx: CanvasRenderingContext2D) {
        ctx.font = "24px serif";
        ctx.globalAlpha = 0.5;
        ctx.fillText(this.emoji, this.x, this.y);
        ctx.globalAlpha = 1.0;
    }
}

// Button creation
const createButton = (text: string, onClick: () => void, className?: string) => {
    const button = document.createElement("button");
    button.textContent = text;
    button.className = className || "";
    button.addEventListener("click", onClick);
    buttonContainer.appendChild(button);
    return button;
}

// Context for drawing
const ctx = canvas.getContext("2d");

let isDrawing = false;
let points: Array<MarkerLine | Sticker> = [];
let redoStack: Array<MarkerLine | Sticker> = [];
let currentLine: MarkerLine | null = null;
let currentSticker: Sticker | null = null;
let toolPreview: ToolPreview | StickerPreview | null = null;
let currentThickness = 2;
let currentEmoji = "";

// Initialize tool preview
toolPreview = new ToolPreview(currentThickness);

// Helper functions
const startDrawing = (event: MouseEvent) => {
    if (currentEmoji) {
        currentSticker = new Sticker(currentEmoji, event.offsetX, event.offsetY);
        points.push(currentSticker);
        changeDrawEvent();
    } else {
        isDrawing = true;
        currentLine = new MarkerLine(event.offsetX, event.offsetY, currentThickness);
        points.push(currentLine);
        changeDrawEvent();
        redoStack = [];
    }
};

const draw = (event: MouseEvent) => {
    if (currentEmoji && currentSticker) {
        currentSticker.drag(event.offsetX, event.offsetY);
        changeDrawEvent();
    } else if (isDrawing && currentLine) {
        currentLine.drag(event.offsetX, event.offsetY);
        changeDrawEvent();
    }
};

const stopDrawing = () => {
    currentSticker = null;
    isDrawing = false;
    currentLine = null;
};

const updateToolPreview = (event: MouseEvent) => {
    if (!isDrawing && !currentSticker) { // Ensure preview is visible only when not drawing
        if (currentEmoji) {
            toolPreview = new StickerPreview(currentEmoji, event.offsetX, event.offsetY);
        } else {
            toolPreview.updatePosition(event.offsetX, event.offsetY);
        }
        changeDrawEvent();
    }
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

    if (toolPreview && !isDrawing && !currentSticker) {
        toolPreview.draw(ctx);
    }
});

canvas.addEventListener("mousemove", (event: MouseEvent) => {
    updateToolPreview(event);
    changeDrawEvent(); // Trigger a redraw whenever the tool moves
});

const toolMoved = new CustomEvent("tool-moved");

// Register the tool-moved event listener
canvas.addEventListener("tool-moved", () => {
    if (!isDrawing && !currentSticker) {
        if (toolPreview) {
            toolPreview.draw(ctx);
        }
    }
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
    if (toolPreview) toolPreview = new ToolPreview(currentThickness);
}, "selectedTool"); // Default thickness

const thickButton = createButton("Thick", () => {
    currentThickness = 5;
    thickButton.classList.add("selectedTool");
    thinButton.classList.remove("selectedTool");
    if (toolPreview) toolPreview = new ToolPreview(currentThickness);
});

// Sticker selection buttons
const smileButton = createButton("😊", () => {
    currentEmoji = "😊";
    thinButton.classList.remove("selectedTool");
    thickButton.classList.remove("selectedTool");
    changeDrawEvent();
});

const heartButton = createButton("💛", () => {
    currentEmoji = "💛";
    thinButton.classList.remove("selectedTool");
    thickButton.classList.remove("selectedTool");
    changeDrawEvent();
});

const starButton = createButton("⭐", () => {
    currentEmoji = "⭐";
    thinButton.classList.remove("selectedTool");
    thickButton.classList.remove("selectedTool");
    changeDrawEvent();
})

// Register mouse event listeners
canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mousemove", updateToolPreview);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseleave", stopDrawing);
