export class WebGLRenderer {
    private canvas: HTMLCanvasElement;
    private gl: WebGLRenderingContext | null;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const glContext = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        this.gl = glContext as WebGLRenderingContext;

        if (!this.gl) {
            console.error('WebGL not supported');
        }
    }

    public isSupported(): boolean {
        return this.gl !== null;
    }

    public render(): void {
        if (!this.gl) {
            return;
        }

        const gl = this.gl;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Set viewport
        gl.viewport(0, 0, width, height);

        // Clear with light background
        gl.clearColor(0.95, 0.95, 0.95, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Vertex shader
        const vertexShaderSource = `
            attribute vec2 aPosition;
            void main() {
                gl_Position = vec4(aPosition, 0.0, 1.0);
            }
        `;

        // Fragment shader - red/orange color
        const fragmentShaderSource = `
            precision mediump float;
            void main() {
                gl_FragColor = vec4(1.0, 0.34, 0.13, 1.0);
            }
        `;

        // Create and compile vertex shader
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        if (!vertexShader) return;
        gl.shaderSource(vertexShader, vertexShaderSource);
        gl.compileShader(vertexShader);

        // Create and compile fragment shader
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        if (!fragmentShader) return;
        gl.shaderSource(fragmentShader, fragmentShaderSource);
        gl.compileShader(fragmentShader);

        // Create program and link shaders
        const program = gl.createProgram();
        if (!program) return;
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.useProgram(program);

        // Draw a simple triangle
        const vertices = new Float32Array([
            0.0, 0.5,    // top
            -0.5, -0.5,  // bottom-left
            0.5, -0.5    // bottom-right
        ]);

        const positionAttributeLocation = gl.getAttribLocation(program, 'aPosition');
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionAttributeLocation);

        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
}
