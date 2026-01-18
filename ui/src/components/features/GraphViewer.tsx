import { ForceGraph2D } from "react-force-graph";
import { useRef, useEffect, useState, memo } from "react";
import type { Node, Link } from "../../hooks/useGraphData";

interface GraphViewerProps {
  nodes: Node[];
  links: Link[];
  onNodeClick: (node: Node) => void;
  selectedNodeId?: string | number | null;
}

const GraphViewer = memo(
  ({ nodes, links, onNodeClick, selectedNodeId }: GraphViewerProps) => {
    const fgRef = useRef<any>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    useEffect(() => {
      const observer = new ResizeObserver((entries) => {
        if (entries[0]) {
          setDimensions({
            width: entries[0].contentRect.width,
            height: entries[0].contentRect.height,
          });
        }
      });
      if (wrapperRef.current) observer.observe(wrapperRef.current);
      return () => observer.disconnect();
    }, []);

    // Auto zoom on data load
    useEffect(() => {
      if (nodes.length > 0 && fgRef.current) {
        setTimeout(() => {
          fgRef.current.zoomToFit(400, 50);
        }, 500);
      }
    }, [nodes.length]);

    return (
      <div
        ref={wrapperRef}
        className="w-full h-full min-h-[500px] bg-[var(--color-bg-app)] rounded-xl overflow-hidden shadow-inner border border-[var(--color-border)]"
      >
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={{ nodes, links }}
          nodeLabel="title"
          nodeColor={
            (node: any) =>
              node.id === selectedNodeId
                ? "#6366f1" // Indigo 500
                : "#94a3b8" // Slate 400
          }
          nodeRelSize={6}
          linkColor={() => "#cbd5e1"} // Slate 300
          linkWidth={1}
          linkDirectionalArrowLength={3.5}
          linkDirectionalArrowRelPos={1}
          linkCanvasObjectMode={() => "after"}
          linkCanvasObject={(
            link: any,
            ctx: CanvasRenderingContext2D,
            globalScale: number,
          ) => {
            if (!link.type) return;

            const label = link.resolved_type || link.type;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            const textWidth = ctx.measureText(label).width;
            const bckgDimensions = [textWidth, fontSize].map(
              (n) => n + fontSize * 0.2,
            ); // some padding

            // Calculate center point
            const x = (link.source.x + link.target.x) / 2;
            const y = (link.source.y + link.target.y) / 2;

            // Draw background
            ctx.save();
            ctx.translate(x, y);
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.fillRect(
              -bckgDimensions[0] / 2,
              -bckgDimensions[1] / 2,
              bckgDimensions[0],
              bckgDimensions[1],
            );

            // Draw text
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#64748b"; // Slate 500
            ctx.fillText(label, 0, 0);
            ctx.restore();
          }}
          onNodeClick={(node) => {
            onNodeClick(node as Node);
            if (fgRef.current) {
              fgRef.current.centerAt(node.x, node.y, 1000);
              fgRef.current.zoom(2.5, 1000);
            }
          }}
          backgroundColor="transparent"
          d3VelocityDecay={0.3}
          cooldownTicks={100}
          nodeCanvasObject={(
            node: any,
            ctx: CanvasRenderingContext2D,
            globalScale: number,
          ) => {
            const label = (() => {
              if (!node.authors) return node.title || node.id;
              const firstAuthor = node.authors.split(" and ")[0].split(",")[0]; // Get LastName of first author
              const year = node.year || "?";
              return `(${firstAuthor}, ${year})`;
            })();

            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;

            // Draw Node Circle
            const r = 6;
            ctx.beginPath();
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
            ctx.fillStyle = node.id === selectedNodeId ? "#6366f1" : "#94a3b8";
            ctx.fill();

            // Draw Border if selected
            if (node.id === selectedNodeId) {
              ctx.lineWidth = 2 / globalScale;
              ctx.strokeStyle = "#fff";
              ctx.stroke();
            }

            // Draw Label
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = node.id === selectedNodeId ? "#4f46e5" : "#64748b"; // Darker text for visibility
            ctx.fillText(label, node.x, node.y + r + fontSize);
          }}
          nodeCanvasObjectMode={() => "replace"}
        />
      </div>
    );
  },
);

export default GraphViewer;
