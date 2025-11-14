import powerbi from "powerbi-visuals-api";
import "./../style/visual.less";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
export declare class Visual implements IVisual {
    private target;
    private host;
    private formattingSettings;
    private formattingSettingsService;
    private canvasContainer;
    private canvas;
    private canvasContext;
    private svgContainer;
    private svg;
    private svgGroup;
    private webglContainer;
    private webglCanvas;
    private gl;
    private margin;
    constructor(options: VisualConstructorOptions);
    update(options: VisualUpdateOptions): void;
    private getDataPoints;
    private renderCanvasBarChart;
    private renderSVGDonutChart;
    private renderWebGLText;
    private adjustColorBrightness;
    getFormattingModel(): powerbi.visuals.FormattingModel;
}
