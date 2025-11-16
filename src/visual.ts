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
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;

import { VisualFormattingSettingsModel } from "./settings";
import { CanvasRenderer } from "./renderers/canvasRenderer";
import { SVGRenderer } from "./renderers/svgRenderer";
import { WebGLRenderer } from "./renderers/webglRenderer";

export class Visual implements IVisual {
    private target: HTMLElement;
    private host: IVisualHost;
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;

    // Containers
    private canvasContainer: HTMLElement;
    private svgContainer: HTMLElement;
    private webglContainer: HTMLElement;

    // Renderers
    private canvasRenderer: CanvasRenderer;
    private svgRenderer: SVGRenderer;
    private webglRenderer: WebGLRenderer;

    // Canvas elements
    private canvas: HTMLCanvasElement;
    private webglCanvas: HTMLCanvasElement;

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
        canvasTitle.textContent = 'Canvas (Circle)';
        canvasTitle.className = 'visual-title';
        this.canvasContainer.appendChild(canvasTitle);

        this.canvas = document.createElement('canvas');
        this.canvasContainer.appendChild(this.canvas);
        this.canvasRenderer = new CanvasRenderer(this.canvas);

        // Create middle container for SVG visualization
        this.svgContainer = document.createElement('div');
        this.svgContainer.className = 'svg-container';
        mainContainer.appendChild(this.svgContainer);

        const svgTitle = document.createElement('h3');
        svgTitle.textContent = 'SVG (Square)';
        svgTitle.className = 'visual-title';
        this.svgContainer.appendChild(svgTitle);

        // Initialize SVG renderer
        this.svgRenderer = new SVGRenderer(this.svgContainer);

        // Create right container for WebGL
        this.webglContainer = document.createElement('div');
        this.webglContainer.className = 'webgl-container';
        mainContainer.appendChild(this.webglContainer);

        const webglTitle = document.createElement('h3');
        webglTitle.textContent = 'WebGL (Triangle)';
        webglTitle.className = 'visual-title';
        this.webglContainer.appendChild(webglTitle);

        // Create WebGL canvas
        this.webglCanvas = document.createElement('canvas');
        this.webglCanvas.className = 'webgl-canvas';
        this.webglContainer.appendChild(this.webglCanvas);

        // Initialize WebGL renderer
        this.webglRenderer = new WebGLRenderer(this.webglCanvas);

        if (!this.webglRenderer.isSupported()) {
            const fallbackText = document.createElement('div');
            fallbackText.className = 'webgl-text';
            fallbackText.textContent = 'WebGL not supported in this browser';
            this.webglContainer.appendChild(fallbackText);
        }
    }

    public update(options: VisualUpdateOptions) {
        console.log('Visual update', options);

        // Signal rendering started
        this.host.eventService.renderingStarted(options);

        // Get formatting settings
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(
            VisualFormattingSettingsModel,
            options.dataViews?.[0]
        );

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

        // Update WebGL canvas (right side)
        const webglWidth = thirdWidth - 20;
        const webglHeight = viewport.height - titleHeight - 20;

        this.webglCanvas.width = webglWidth;
        this.webglCanvas.height = webglHeight;
        this.webglCanvas.style.width = `${webglWidth}px`;
        this.webglCanvas.style.height = `${webglHeight}px`;

        // Render all visualizations
        this.canvasRenderer.render(canvasWidth, canvasHeight);
        this.svgRenderer.render(svgWidth, svgHeight);
        this.webglRenderer.render();

        // Signal rendering finished after all renders complete
        // Use requestAnimationFrame to ensure WebGL commands are flushed
        requestAnimationFrame(() => {
            this.host.eventService.renderingFinished(options);
        });
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}