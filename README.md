# Canvas & D3.js Power BI Custom Visual

A Power BI custom visual that demonstrates the use of both HTML5 Canvas and D3.js SVG rendering side by side.

## Features

### Left Side - Canvas Bar Chart
- **Technology**: HTML5 Canvas (High-performance rendering)
- **Visualization**: Vertical bar chart with gradients
- **Features**:
  - Gradient-filled bars
  - Value labels on top of bars
  - Rotated category labels
  - White borders for visual separation

### Right Side - D3.js Donut Chart
- **Technology**: D3.js with SVG
- **Visualization**: Interactive donut chart
- **Features**:
  - Hover effects (arcs expand on mouseover)
  - Color-coded segments
  - Value labels in the center of each segment
  - Interactive legend with category names and values
  - Smooth transitions

## Getting Started

### Development
```bash
npm install
npm start
```

### Package
```bash
npm run package
```

## Data Requirements

The visual expects:
- **Category**: Grouping field (e.g., Product names, Regions)
- **Measure**: Numeric values (e.g., Sales, Quantity)

## Architecture

The visual uses a hybrid approach:
1. **Canvas** - For fast, pixel-based rendering of bars (ideal for large datasets)
2. **D3.js SVG** - For interactive, vector-based donut chart with smooth animations

Both visualizations update in sync when data changes, showing the same data in different formats.

## Styling

Styles are defined in `style/visual.less` with:
- Flexbox layout for side-by-side display
- Modern card-style containers
- Responsive design
- Smooth transitions and hover effects
