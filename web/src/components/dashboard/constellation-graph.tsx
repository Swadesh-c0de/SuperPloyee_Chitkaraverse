"use client";

import { useRef, useEffect } from "react";
import * as d3 from "d3";

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  color: string;
  val: number;
  highlighted: boolean;
}

export interface GraphLink {
  source: string;
  target: string;
}

interface ConstellationGraphProps {
  data: { nodes: GraphNode[]; links: GraphLink[] };
  onNodeClick: (nodeId: string | null) => void;
  selectedNodeId?: string | null;
}

interface SimNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number | null;
  fy?: number | null;
  connections: number;
}

interface SimLink {
  source: SimNode;
  target: SimNode;
}

const nodeR = (n: SimNode) => Math.max(5, Math.min(18, 5 + Math.sqrt(n.connections) * 3));

export default function ConstellationGraph({ data, onNodeClick, selectedNodeId }: ConstellationGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);

  const simRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
  const transformRef = useRef(d3.zoomIdentity);
  const hoveredRef = useRef<SimNode | null>(null);
  const selectedRef = useRef<string | null>(selectedNodeId ?? null);
  const nodesRef = useRef<SimNode[]>([]);
  const linksRef = useRef<SimLink[]>([]);
  const adjacencyRef = useRef<Map<string, Set<string>>>(new Map());
  const parallaxTarget = useRef({ x: 0, y: 0 });
  const parallaxCurrent = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  // Keep selectedRef in sync with prop
  useEffect(() => {
    selectedRef.current = selectedNodeId ?? null;
  }, [selectedNodeId]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const minimap = minimapRef.current;
    if (!container || !canvas || !minimap) return;

    const dpr = window.devicePixelRatio || 1;
    let width = container.clientWidth;
    let height = container.clientHeight;

    const resize = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // ── Build simulation data ──
    const connCount = new Map<string, number>();
    data.links.forEach(l => {
      connCount.set(l.source, (connCount.get(l.source) ?? 0) + 1);
      connCount.set(l.target, (connCount.get(l.target) ?? 0) + 1);
    });

    const nodes: SimNode[] = data.nodes.map(n => ({
      ...n,
      x: width / 2 + (Math.random() - 0.5) * 400,
      y: height / 2 + (Math.random() - 0.5) * 400,
      vx: 0, vy: 0,
      connections: connCount.get(n.id) ?? 0,
    }));
    nodesRef.current = nodes;

    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    const links: SimLink[] = data.links
      .filter(l => nodeMap.has(l.source) && nodeMap.has(l.target))
      .map(l => ({ source: nodeMap.get(l.source)!, target: nodeMap.get(l.target)! }));
    linksRef.current = links;

    const adj = new Map<string, Set<string>>();
    links.forEach(l => {
      const s = l.source.id; const t = l.target.id;
      if (!adj.has(s)) adj.set(s, new Set());
      if (!adj.has(t)) adj.set(t, new Set());
      adj.get(s)!.add(t);
      adj.get(t)!.add(s);
    });
    adjacencyRef.current = adj;

    // ── Force simulation ──
    const sim = d3.forceSimulation<SimNode>(nodes)
      .force("link", d3.forceLink<SimNode, SimLink>(links)
        .id(d => d.id).distance(120).strength(0.15))
      .force("charge", d3.forceManyBody<SimNode>().strength(-400).distanceMax(700))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide<SimNode>().radius(d => nodeR(d) + 20).strength(0.7))
      .alphaDecay(0.018)
      .velocityDecay(0.6);

    simRef.current = sim;

    // ── Draw ──
    const ctx = canvas.getContext("2d")!;

    function draw() {
      // DPR-aware base transform — reset every frame
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.save();

      // Smooth parallax
      parallaxCurrent.current.x += (parallaxTarget.current.x - parallaxCurrent.current.x) * 0.08;
      parallaxCurrent.current.y += (parallaxTarget.current.y - parallaxCurrent.current.y) * 0.08;

      const t = transformRef.current;
      ctx.translate(t.x + parallaxCurrent.current.x, t.y + parallaxCurrent.current.y);
      ctx.scale(t.k, t.k);

      const hovered = hoveredRef.current;
      const selected = selectedRef.current;
      const activeId = selected ?? hovered?.id ?? null;
      const neighbors = activeId ? (adjacencyRef.current.get(activeId) ?? new Set<string>()) : new Set<string>();

      // Draw links
      linksRef.current.forEach(link => {
        const sx = link.source.x, sy = link.source.y;
        const tx = link.target.x, ty = link.target.y;
        if (!isFinite(sx) || !isFinite(sy) || !isFinite(tx) || !isFinite(ty)) return;

        const isHighlit = activeId && (link.source.id === activeId || link.target.id === activeId);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(tx, ty);
        if (!activeId) {
          ctx.globalAlpha = 0.10;
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 0.6;
        } else if (isHighlit) {
          ctx.globalAlpha = 0.7;
          const grad = ctx.createLinearGradient(sx, sy, tx, ty);
          grad.addColorStop(0, "rgba(255,255,255,0.05)");
          grad.addColorStop(0.5, "rgba(255,255,255,0.55)");
          grad.addColorStop(1, "rgba(255,255,255,0.05)");
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.2;
        } else {
          ctx.globalAlpha = 0.03;
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 0.4;
        }
        ctx.stroke();
        ctx.restore();
      });

      // Draw nodes
      nodesRef.current.forEach(node => {
        if (!isFinite(node.x) || !isFinite(node.y)) return;
        const { x, y } = node;
        const r = nodeR(node);
        const isHovered = hovered?.id === node.id;
        const isSelected = selected === node.id;
        const isActive = isHovered || isSelected;
        const isNeighbor = !!activeId && neighbors.has(node.id);

        ctx.globalAlpha = activeId
          ? isActive ? 1 : isNeighbor ? 0.75 : 0.10
          : 1;

        // Glow for active / neighbor
        if (isActive || isNeighbor) {
          const glow = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * (isActive ? 4 : 2.5));
          glow.addColorStop(0, isActive ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)");
          glow.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(x, y, r * (isActive ? 4 : 2.5), 0, Math.PI * 2);
          ctx.fill();
        }

        // Outer ring (hub nodes with many connections)
        if (node.connections >= 2) {
          ctx.beginPath();
          ctx.arc(x, y, r + 3, 0, Math.PI * 2);
          ctx.strokeStyle = isActive ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.14)";
          ctx.lineWidth = isActive ? 1.2 : 0.7;
          ctx.stroke();
        }

        // Core
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = isSelected
          ? "#ffffff"
          : isHovered ? "rgba(255,255,255,0.93)"
          : node.connections >= 3 ? "rgba(255,255,255,0.82)"
          : "rgba(255,255,255,0.52)";
        ctx.fill();

        // Inner pupil on hub nodes
        if (node.connections >= 3) {
          ctx.beginPath();
          ctx.arc(x, y, r * 0.28, 0, Math.PI * 2);
          ctx.fillStyle = isActive ? "#111" : "rgba(0,0,0,0.5)";
          ctx.fill();
        }

        // Label — always visible, screen-space size via /t.k
        const LABEL_PX = isActive ? 13 : node.connections >= 2 ? 11.5 : 10.5;
        ctx.save();
        ctx.font = `${isActive ? 600 : 400} ${LABEL_PX / t.k}px -apple-system, "Inter", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const lx = x;
        const ly = y + r + 6 / t.k;

        if (isActive) {
          const tw = ctx.measureText(node.label).width;
          const pad = 5 / t.k;
          const fh = LABEL_PX / t.k;
          ctx.fillStyle = "rgba(0,0,0,0.78)";
          ctx.beginPath();
          const bx = lx - tw / 2 - pad, by = ly - pad * 0.4;
          const bw = tw + pad * 2, bh = fh + pad;
          const br = 3 / t.k;
          ctx.moveTo(bx + br, by);
          ctx.lineTo(bx + bw - br, by);
          ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + br);
          ctx.lineTo(bx + bw, by + bh - br);
          ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - br, by + bh);
          ctx.lineTo(bx + br, by + bh);
          ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - br);
          ctx.lineTo(bx, by + br);
          ctx.quadraticCurveTo(bx, by, bx + br, by);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#ffffff";
        } else {
          ctx.fillStyle = isNeighbor
            ? "rgba(255,255,255,0.80)"
            : node.connections >= 2 ? "rgba(255,255,255,0.62)" : "rgba(255,255,255,0.35)";
        }
        ctx.fillText(node.label, lx, ly);
        ctx.restore();

        ctx.globalAlpha = 1;
      });

      ctx.restore();
      drawMinimap();
    }

    function drawMinimap() {
      if (!minimap) return;
      const mCtx = minimap.getContext("2d")!;
      const mW = minimap.width, mH = minimap.height;
      mCtx.clearRect(0, 0, mW, mH);
      mCtx.fillStyle = "rgba(10,10,12,0.92)";
      mCtx.fillRect(0, 0, mW, mH);

      const ns = nodesRef.current;
      if (ns.length === 0) return;
      const pad = 8;
      const xs = ns.map(n => n.x), ys = ns.map(n => n.y);
      const minX = Math.min(...xs) - pad, maxX = Math.max(...xs) + pad;
      const minY = Math.min(...ys) - pad, maxY = Math.max(...ys) + pad;
      const sx = mW / (maxX - minX || 1), sy = mH / (maxY - minY || 1);
      const sc = Math.min(sx, sy) * 0.88;
      const ox = (mW - (maxX - minX) * sc) / 2;
      const oy = (mH - (maxY - minY) * sc) / 2;

      mCtx.globalAlpha = 0.12;
      mCtx.strokeStyle = "#fff";
      mCtx.lineWidth = 0.5;
      linksRef.current.forEach(l => {
        mCtx.beginPath();
        mCtx.moveTo((l.source.x - minX) * sc + ox, (l.source.y - minY) * sc + oy);
        mCtx.lineTo((l.target.x - minX) * sc + ox, (l.target.y - minY) * sc + oy);
        mCtx.stroke();
      });

      mCtx.globalAlpha = 0.65;
      ns.forEach(n => {
        mCtx.fillStyle = "#ffffff";
        mCtx.beginPath();
        mCtx.arc((n.x - minX) * sc + ox, (n.y - minY) * sc + oy, 1.8, 0, Math.PI * 2);
        mCtx.fill();
      });

      const t = transformRef.current;
      const vpX = (-t.x / t.k - minX) * sc + ox;
      const vpY = (-t.y / t.k - minY) * sc + oy;
      const vpW = (width / t.k) * sc;
      const vpH = (height / t.k) * sc;
      mCtx.globalAlpha = 1;
      mCtx.strokeStyle = "rgba(255,255,255,0.35)";
      mCtx.lineWidth = 1;
      mCtx.strokeRect(vpX, vpY, vpW, vpH);
    }

    // ── Animate loop ──
    let running = true;
    function loop() {
      if (!running) return;
      draw();
      rafRef.current = requestAnimationFrame(loop);
    }
    sim.on("tick", () => { /* simulation updates node positions */ });
    rafRef.current = requestAnimationFrame(loop);

    // ── Zoom / pan ──
    const zoom = d3.zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.2, 6])
      .on("zoom", e => { transformRef.current = e.transform; });

    d3.select(canvas).call(zoom);
    // Initial fit
    setTimeout(() => {
      const fitScale = Math.min(width / 600, height / 400, 1.2);
      const fitT = d3.zoomIdentity.translate(width / 2, height / 2).scale(fitScale * 0.7).translate(-width / 2, -height / 2);
      d3.select(canvas).call(zoom.transform, fitT);
    }, 800);

    // ── Mouse ──
    function hitTest(e: MouseEvent): SimNode | null {
      const rect = canvas!.getBoundingClientRect();
      const t = transformRef.current;
      const mx = (e.clientX - rect.left - t.x - parallaxCurrent.current.x) / t.k;
      const my = (e.clientY - rect.top - t.y - parallaxCurrent.current.y) / t.k;
      for (let i = nodesRef.current.length - 1; i >= 0; i--) {
        const n = nodesRef.current[i];
        const r = nodeR(n) + 6;
        if ((mx - n.x) ** 2 + (my - n.y) ** 2 < r * r) return n;
      }
      return null;
    }

    let dragNode: SimNode | null = null;

    function onMouseDown(e: MouseEvent) {
      const n = hitTest(e);
      if (!n) return;
      e.stopImmediatePropagation();
      dragNode = n;
      n.fx = n.x; n.fy = n.y;
      sim.alphaTarget(0.03).restart();
      canvas!.style.cursor = "grabbing";
    }

    function onMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      parallaxTarget.current = { x: (mx - width / 2) * -0.03, y: (my - height / 2) * -0.03 };

      if (dragNode) {
        e.stopImmediatePropagation();
        const t = transformRef.current;
        dragNode.fx = (mx - t.x - parallaxCurrent.current.x) / t.k;
        dragNode.fy = (my - t.y - parallaxCurrent.current.y) / t.k;
        return;
      }
      const n = hitTest(e);
      hoveredRef.current = n;
      canvas!.style.cursor = n ? "pointer" : "grab";
    }

    function onMouseUp() {
      if (dragNode) {
        dragNode.fx = null; dragNode.fy = null;
        dragNode = null;
        sim.alphaTarget(0);
        canvas!.style.cursor = "grab";
      }
    }

    function onClick(e: MouseEvent) {
      const n = hitTest(e);
      onNodeClick(n ? n.id : null);
    }

    canvas.addEventListener("mousedown", onMouseDown, { capture: true });
    canvas.addEventListener("mousemove", onMouseMove, { capture: true });
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseUp);
    canvas.addEventListener("click", onClick);
    canvas.style.cursor = "grab";

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      sim.stop();
      ro.disconnect();
      canvas.removeEventListener("mousedown", onMouseDown, { capture: true });
      canvas.removeEventListener("mousemove", onMouseMove, { capture: true });
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseleave", onMouseUp);
      canvas.removeEventListener("click", onClick);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full block" />
      {/* Minimap */}
      <div className="absolute bottom-4 right-4 z-10 rounded-lg overflow-hidden border border-white/10 shadow-2xl">
        <canvas ref={minimapRef} width={140} height={90} className="block" />
      </div>
    </div>
  );
}
