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
    private color: string;

    constructor(initialX: number, initialY: number, thickness: number, color: string) {
        this.points = [{ x: initialX, y: initialY }];
        this.thickness = thickness;
        this.color = color;
    }

    drag(x: number, y: number) {
        this.points.push({ x, y });
    }

    display(ctx: CanvasRenderingContext2D) {
        if (this.points.length < 2) return;

        ctx.strokeStyle = this.color;
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
        ctx.strokeStyle = currentColor; 
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
    private rotation: number;

    constructor(emoji: string, initialX: number, initialY: number, rotation: number) {
        this.x = initialX;
        this.y = initialY;
        this.emoji = emoji;
        this.rotation = rotation;
    }

    drag(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    display(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((Math.PI / 180) * this.rotation);
        ctx.translate(-this.x, -this.y);
        ctx.font = "24px serif";
        ctx.fillText(this.emoji, this.x, this.y);
        ctx.restore();
    }
}

class StickerPreview extends Sticker {
    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((Math.PI / 180) * this.rotation);
        ctx.translate(-this.x, -this.y);
        ctx.font = "24px serif";
        ctx.globalAlpha = 0.5;
        ctx.fillText(this.emoji, this.x, this.y);
        ctx.globalAlpha = 1.0;
        ctx.restore();
    }
}

const getRandomColor = () => {
    return "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
};

const getRandomRotation = () => {
    return Math.floor(Math.random() * 360);
}

const createButton = (text: string, onClick: () => void, className?: string) => {
    const button = document.createElement("button");
    button.textContent = text;
    button.className = className || "";
    button.addEventListener("click", onClick);
    buttonContainer.appendChild(button);
    return button;
}

const ctx = canvas.getContext("2d");

let isDrawing = false;
let points: Array<MarkerLine | Sticker> = [];
let redoStack: Array<MarkerLine | Sticker> = [];
let currentLine: MarkerLine | null = null;
let currentSticker: Sticker | null = null;
let toolPreview: ToolPreview | StickerPreview | null = null;
let currentThickness = 2; // Default marker thickness
let currentEmoji = "";
let currentRotateAngle = 0;
let currentColor = "#000000";

// Color choices
const colors = [
    { code: "#000000", label: "Black" },
    { code: "#FF0000", label: "Red" },
    { code: "#00FF00", label: "Green" },
    { code: "#0000FF", label: "Blue" }
];

// Function for creating color buttons
colors.forEach(color => {
    const colorButton = createButton(color.label, () => {
        currentColor = color.code; // Update the current drawing color
        currentThickness = 2; // Reset to default marker thickness
        currentEmoji = "";     // Ensure no sticker is selected
        fireToolMovedEvent();  // Update preview to reflect changes
    });
    colorButton.style.backgroundColor = color.code;
    colorButton.style.color = "#FFFFFF";
    buttonContainer.appendChild(colorButton);
});

createButton("Random Color", () => {
    currentColor = getRandomColor();
    currentThickness = 2; // Reset to default marker thickness
    currentEmoji = "";     // Ensure no sticker is selected
    fireToolMovedEvent();
});

// Function to create marker buttons
const createMarkerButton = (text: string, thickness: number, className?: string) => {
    createButton(text, () => {
        currentThickness = thickness;
        currentEmoji = "";
        fireToolMovedEvent();
    }, className);
};

// Function to create sticker buttons
const createStickerButton = (emoji: string) => {
    createButton(emoji, () => {
        currentEmoji = emoji;
        currentRotateAngle = getRandomRotation(); 
        fireToolMovedEvent();
    }, "sticker-button");
};

// Initialize tool preview
toolPreview = new ToolPreview(currentThickness);

const startDrawing = (event: MouseEvent) => {
    if (currentEmoji) {
        currentSticker = new Sticker(currentEmoji, event.offsetX, event.offsetY, currentRotateAngle);
        points.push(currentSticker);
        changeDrawEvent();
    } else {
        isDrawing = true;
        currentLine = new MarkerLine(event.offsetX, event.offsetY, currentThickness, currentColor);
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

const exportCanvas = () => {
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = 1024;
    exportCanvas.height = 1024;
    const exportCtx = exportCanvas.getContext("2d");

    if (!exportCtx) return;

    exportCtx.scale(4, 4);

    points.forEach(point => point.display(exportCtx));

    const anchor = document.createElement("a");
    anchor.href = exportCanvas.toDataURL("image/png");
    anchor.download = "stellar_stamps.png";
    anchor.click();
};

const updateToolPreview = (event: MouseEvent) => {
    if (!isDrawing && !currentSticker) {
        if (currentEmoji) {
            toolPreview = new StickerPreview(currentEmoji, event.offsetX, event.offsetY, currentRotateAngle);
        } else {
            toolPreview.updatePosition(event.offsetX, event.offsetY);
            ctx.strokeStyle = currentColor;
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
    changeDrawEvent();
});

// Tool interactions
const toolMoved = new CustomEvent("tool-moved");

canvas.addEventListener("tool-moved", () => {
    if (!isDrawing && !currentSticker) {
        if (toolPreview) {
            toolPreview.draw(ctx);
        }
    }
});

const fireToolMovedEvent = () => {
    toolPreview = currentEmoji ? 
        new StickerPreview(currentEmoji, 0, 0, currentRotateAngle) :
        new ToolPreview(currentThickness);

    const toolMoved = new CustomEvent("tool-moved");
    canvas.dispatchEvent(toolMoved);
};

// Button controls
createButton("Clear", () => {
    points = [];
    redoStack = [];
    changeDrawEvent();
});

createButton("Undo", () => {
    if (points.length > 0) {
        const lastLine = points.pop();
        if (lastLine) {
            redoStack.push(lastLine);
        }
        changeDrawEvent();
    }
});

createButton("Redo", () => {
    if (redoStack.length > 0) {
        const lastUndoneLine = redoStack.pop();
        if (lastUndoneLine) {
            points.push(lastUndoneLine);
        }
        changeDrawEvent();
    }
});

// Marker thickness buttons
createMarkerButton("Thin Marker", 1, "marker-button");
createMarkerButton("Thick Marker", 6, "marker-button");

// Sticker selection and creation
let stickers = [
    { emoji: "😊" },
    { emoji: "💛" },
    { emoji: "⭐" }
];

stickers.forEach(sticker => createStickerButton(sticker.emoji));

createButton("Add Custom Sticker", () => {
    const userDefinedEmoji = prompt("Enter your custom sticker emoji:", "🚀");
    if (userDefinedEmoji) {
        stickers.push({ emoji: userDefinedEmoji });
        createStickerButton(userDefinedEmoji);
    }
});

// Place sticker
canvas.addEventListener("mousedown", (event: MouseEvent) => {
    if (currentEmoji) {
        placeSticker(event.offsetX, event.offsetY);
    }
});

// Register mouse event listeners
canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mousemove", updateToolPreview);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseleave", stopDrawing);

// Export button
createButton("Export", exportCanvas);
