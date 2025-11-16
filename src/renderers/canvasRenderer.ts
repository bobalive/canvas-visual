export class CanvasRenderer {
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
    }

    public render(width: number, height: number): void {
        const ctx = this.context;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        if (width <= 0 || height <= 0) {
            return;
        }

        // Draw a simple circle in the center
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 4;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#4CAF50';
        ctx.fill();
        ctx.strokeStyle = '#2E7D32';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
}
