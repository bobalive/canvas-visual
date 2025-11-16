import * as d3 from "d3";

export class SVGRenderer {
    private svg: d3.Selection<SVGElement, any, any, any>;
    private svgGroup: d3.Selection<SVGGElement, any, any, any>;

    constructor(container: HTMLElement) {
        this.svg = d3.select(container)
            .append('svg')
            .attr('class', 'd3-svg');

        this.svgGroup = this.svg.append('g')
            .attr('class', 'svg-group');
    }

    public render(width: number, height: number): void {
        // Update SVG size
        this.svg
            .attr('width', width)
            .attr('height', height);

        // Clear previous content
        this.svgGroup.selectAll('*').remove();

        // Center the group
        this.svgGroup.attr('transform', `translate(${width / 2}, ${height / 2})`);

        // Draw a simple square in the center
        const size = Math.min(width, height) / 2;

        this.svgGroup.append('rect')
            .attr('x', -size / 2)
            .attr('y', -size / 2)
            .attr('width', size)
            .attr('height', size)
            .attr('fill', '#2196F3')
            .attr('stroke', '#1565C0')
            .attr('stroke-width', 3);
    }
}
