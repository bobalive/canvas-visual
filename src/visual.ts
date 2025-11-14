/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/
"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import * as d3 from "d3";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import DataView = powerbi.DataView;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;

import { VisualFormattingSettingsModel } from "./settings";

interface DataPoint {
    category: string;
    value: number;
    color: string;
}

export class Visual implements IVisual {
    private target: HTMLElement;
    private host: IVisualHost;
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;

    // Canvas elements (left side)
    private canvasContainer: HTMLElement;
    private canvas: HTMLCanvasElement;
    private canvasContext: CanvasRenderingContext2D;

    // D3 SVG elements (middle)
    private svgContainer: HTMLElement;
    private svg: d3.Selection<SVGElement, any, any, any>;
    private svgGroup: d3.Selection<SVGGElement, any, any, any>;

    // WebGL container (right side)
    private webglContainer: HTMLElement;
    private webglCanvas: HTMLCanvasElement;
    private gl: WebGLRenderingContext;

    // Layout properties
    private margin = { top: 30, right: 20, bottom: 50, left: 50 };

    constructor(options: VisualConstructorOptions) {
        console.log('Visual constructor', options);
        this.host = options.host;
        this.formattingSettingsService = new FormattingSettingsService();
        this.target = options.element;

        // Create main container
        const mainContainer = document.createElement('div');
        mainContainer.className = 'main-container';
        this.target.appendChild(mainContainer);

        // Create left container for Canvas visualization
        this.canvasContainer = document.createElement('div');
        this.canvasContainer.className = 'canvas-container';
        mainContainer.appendChild(this.canvasContainer);

        const canvasTitle = document.createElement('h3');
        canvasTitle.textContent = 'Canvas Bar Chart';
        canvasTitle.className = 'visual-title';
        this.canvasContainer.appendChild(canvasTitle);

        this.canvas = document.createElement('canvas');
        this.canvasContainer.appendChild(this.canvas);
        this.canvasContext = this.canvas.getContext('2d');

        // Create middle container for SVG visualization
        this.svgContainer = document.createElement('div');
        this.svgContainer.className = 'svg-container';
        mainContainer.appendChild(this.svgContainer);

        const svgTitle = document.createElement('h3');
        svgTitle.textContent = 'D3.js Donut Chart';
        svgTitle.className = 'visual-title';
        this.svgContainer.appendChild(svgTitle);

        // Create SVG for D3 visualization
        this.svg = d3.select(this.svgContainer)
            .append('svg')
            .attr('class', 'd3-svg');

        this.svgGroup = this.svg.append('g')
            .attr('class', 'svg-group');

        // Create right container for WebGL
        this.webglContainer = document.createElement('div');
        this.webglContainer.className = 'webgl-container';
        mainContainer.appendChild(this.webglContainer);

        const webglTitle = document.createElement('h3');
        webglTitle.textContent = 'WebGL';
        webglTitle.className = 'visual-title';
        this.webglContainer.appendChild(webglTitle);

        // Create WebGL canvas
        this.webglCanvas = document.createElement('canvas');
        this.webglCanvas.className = 'webgl-canvas';
        this.webglContainer.appendChild(this.webglCanvas);

        // Initialize WebGL context
        const glContext = this.webglCanvas.getContext('webgl') || this.webglCanvas.getContext('experimental-webgl');
        this.gl = glContext as WebGLRenderingContext;

        if (!this.gl) {
            console.error('WebGL not supported');
            const fallbackText = document.createElement('div');
            fallbackText.className = 'webgl-text';
            fallbackText.textContent = 'WebGL not supported in this browser';
            this.webglContainer.appendChild(fallbackText);
        }
    }

    public update(options: VisualUpdateOptions) {
        console.log('Visual update', options);

        // Get formatting settings
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(
            VisualFormattingSettingsModel,
            options.dataViews?.[0]
        );

        // Check if we have data
        if (!options.dataViews || !options.dataViews[0] || !options.dataViews[0].categorical) {
            return;
        }

        const dataView = options.dataViews[0];

        // Extract data
        const dataPoints: DataPoint[] = this.getDataPoints(dataView);

        if (dataPoints.length === 0) {
            return;
        }

        // Update dimensions - split viewport in thirds
        const viewport = options.viewport;
        const thirdWidth = viewport.width / 3;
        const titleHeight = 40;

        // Update canvas visualization (left side)
        const canvasWidth = thirdWidth - 20;
        const canvasHeight = viewport.height - titleHeight - 20;

        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        this.canvas.style.width = `${canvasWidth}px`;
        this.canvas.style.height = `${canvasHeight}px`;

        // Update SVG visualization (middle)
        const svgWidth = thirdWidth - 20;
        const svgHeight = viewport.height - titleHeight - 20;

        this.svg
            .attr('width', svgWidth)
            .attr('height', svgHeight);

        // Update WebGL canvas (right side)
        const webglWidth = thirdWidth - 20;
        const webglHeight = viewport.height - titleHeight - 20;

        this.webglCanvas.width = webglWidth;
        this.webglCanvas.height = webglHeight;
        this.webglCanvas.style.width = `${webglWidth}px`;
        this.webglCanvas.style.height = `${webglHeight}px`;

        // Render all visualizations
        this.renderCanvasBarChart(dataPoints, canvasWidth, canvasHeight);
        this.renderSVGDonutChart(dataPoints, svgWidth, svgHeight);
        this.renderWebGLText();
    }

    private getDataPoints(dataView: DataView): DataPoint[] {
        const categorical = dataView.categorical;
        const categories = categorical.categories?.[0];
        const values = categorical.values?.[0];
        const dataPoints: DataPoint[] = [];

        if (!categories || !values) {
            return dataPoints;
        }

        const colorPalette = this.host.colorPalette;

        for (let i = 0; i < categories.values.length; i++) {
            const defaultColor = colorPalette.getColor(i.toString()).value;

            dataPoints.push({
                category: categories.values[i] as string,
                value: values.values[i] as number,
                color: defaultColor
            });
        }

        return dataPoints;
    }

    private renderCanvasBarChart(dataPoints: DataPoint[], width: number, height: number): void {
        const ctx = this.canvasContext;
        const chartWidth = width - this.margin.left - this.margin.right;
        const chartHeight = height - this.margin.top - this.margin.bottom;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        if (chartWidth <= 0 || chartHeight <= 0) {
            return;
        }

        // Save context state
        ctx.save();
        ctx.translate(this.margin.left, this.margin.top);

        // Calculate bar dimensions
        const barWidth = chartWidth / dataPoints.length * 0.8;
        const spacing = chartWidth / dataPoints.length;
        const maxValue = d3.max(dataPoints, d => d.value) || 1;

        // Draw bars
        dataPoints.forEach((d, i) => {
            const x = i * spacing + spacing * 0.1;
            const barHeight = (d.value / maxValue) * chartHeight;
            const y = chartHeight - barHeight;

            // Draw bar with gradient
            const gradient = ctx.createLinearGradient(x, y, x, chartHeight);
            gradient.addColorStop(0, d.color);
            gradient.addColorStop(1, this.adjustColorBrightness(d.color, -30));

            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barWidth, barHeight);

            // Draw border
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, barWidth, barHeight);

            // Draw value label
            ctx.fillStyle = '#333';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(d.value.toFixed(0), x + barWidth / 2, y - 5);

            // Draw category label
            ctx.save();
            ctx.translate(x + barWidth / 2, chartHeight + 15);
            ctx.rotate(-0.5);
            ctx.fillStyle = '#666';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(d.category, 0, 0);
            ctx.restore();
        });

        ctx.restore();
    }

    private renderSVGDonutChart(dataPoints: DataPoint[], width: number, height: number): void {
        const radius = Math.min(width, height) / 2 - 40;
        const innerRadius = radius * 0.6;

        // Clear previous content
        this.svgGroup.selectAll('*').remove();

        // Center the group
        this.svgGroup.attr('transform', `translate(${width / 2}, ${height / 2})`);

        // Create pie layout
        const pie = d3.pie<DataPoint>()
            .value(d => d.value)
            .sort(null);

        // Create arc generator
        const arc = d3.arc<d3.PieArcDatum<DataPoint>>()
            .innerRadius(innerRadius)
            .outerRadius(radius);

        // Create arc for hover effect
        const arcHover = d3.arc<d3.PieArcDatum<DataPoint>>()
            .innerRadius(innerRadius)
            .outerRadius(radius + 10);

        // Create arcs
        const arcs = this.svgGroup.selectAll('.arc')
            .data(pie(dataPoints))
            .enter()
            .append('g')
            .attr('class', 'arc');

        // Draw paths
        arcs.append('path')
            .attr('d', arc)
            .attr('fill', d => d.data.color)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .style('cursor', 'pointer')
            .on('mouseover', function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('d', arcHover);
            })
            .on('mouseout', function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('d', arc);
            });

        // Add labels
        arcs.append('text')
            .attr('transform', d => `translate(${arc.centroid(d)})`)
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .attr('fill', '#fff')
            .style('pointer-events', 'none')
            .text(d => d.data.value.toFixed(0));

        // Add legend
        const legend = this.svgGroup.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${-width / 2 + 10}, ${-height / 2 + 10})`);

        const legendItems = legend.selectAll('.legend-item')
            .data(dataPoints)
            .enter()
            .append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(0, ${i * 25})`);

        legendItems.append('rect')
            .attr('width', 18)
            .attr('height', 18)
            .attr('fill', d => d.color);

        legendItems.append('text')
            .attr('x', 24)
            .attr('y', 9)
            .attr('dy', '.35em')
            .attr('font-size', '11px')
            .attr('fill', '#666')
            .text(d => `${d.category} (${d.value.toFixed(0)})`);
    }

    private renderWebGLText(): void {
        if (!this.gl) {
            return;
        }

        const gl = this.gl;
        const width = this.webglCanvas.width;
        const height = this.webglCanvas.height;

        // Set viewport
        gl.viewport(0, 0, width, height);

        // Clear with dark background
        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Vertex shader
        const vertexShaderSource = `
            attribute vec2 aPosition;
            void main() {
                gl_Position = vec4(aPosition, 0.0, 1.0);
            }
        `;

        // Fragment shader - green color
        const fragmentShaderSource = `
            precision mediump float;
            void main() {
                gl_FragColor = vec4(0.2, 0.8, 0.3, 1.0);
            }
        `;

        // Create and compile vertex shader
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexShaderSource);
        gl.compileShader(vertexShader);

        // Create and compile fragment shader
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentShaderSource);
        gl.compileShader(fragmentShader);

        // Create program and link shaders
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.useProgram(program);

        // Draw a simple square in the center
        const vertices = new Float32Array([
            -0.5, -0.5,  // bottom-left
            0.5, -0.5,  // bottom-right
            0.5, 0.5,  // top-right
            -0.5, -0.5,  // bottom-left
            0.5, 0.5,  // top-right
            -0.5, 0.5   // top-left
        ]);

        const positionAttributeLocation = gl.getAttribLocation(program, 'aPosition');
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionAttributeLocation);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    private adjustColorBrightness(color: string, amount: number): string {
        // Simple color brightness adjustment
        const num = parseInt(color.replace('#', ''), 16);
        const r = Math.max(0, Math.min(255, (num >> 16) + amount));
        const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
        const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}