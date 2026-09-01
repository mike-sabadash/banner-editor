import { useEffect, useMemo, useRef, useState } from "react";
import { Image as KonvaImage, Layer, Stage, Text, Transformer } from "react-konva";
import { formats, fitPreview, type BannerElement } from "../model";
import { animatedText, applyTextCase } from "./interaction";
import { editorActions, getDisplayElement, useEditorState } from "./editorStore";

const useHtmlImage = (src?: string) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!src) { setImage(null); return; }
    const img = new window.Image();
    img.onload = () => setImage(img);
    img.src = src;
    return () => { img.onload = null; };
  }, [src]);
  return image;
};

function CanvasObject({ element }: { element: BannerElement }) {
  const state = useEditorState();
  const selected = state.selectedId === element.id;
  const nodeRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const image = useHtmlImage(element.assetUrl);
  const display = useMemo(() => getDisplayElement(element, state.playhead), [element, state.playhead, state.keyframesByFormat]);
  const format = formats.find((f) => f.id === state.activeFormat)!;
  const artX = (display.x / 100) * format.width;
  const artY = (display.y / 100) * format.height;
  const artWidth = (display.width / 100) * format.width;
  const ratio = image && image.naturalWidth ? image.naturalHeight / image.naturalWidth : .65;
  const text = animatedText(applyTextCase(display.text, display.textCase), state.playhead, display.textAnimation);
  const animation = display.textAnimation, localTime = Math.max(0, state.playhead - (animation?.start ?? 0));
  const progress = Math.max(0, Math.min(1, localTime / (animation?.duration ?? .55)));
  const motionOpacity = !animation || animation.type === "none" || animation.type === "typewriter" ? 1 : progress;
  const motionY = animation?.type === "rise" ? (1 - progress) * format.height * .08 : 0;
  const motionScale = animation?.type === "bounce" ? (progress < .72 ? .78 + progress * .46 : 1 + Math.sin((progress - .72) * 18) * .06 * (1 - progress)) : 1;
  const motionX = animation?.type === "shake" && progress < 1 ? Math.sin(localTime * 38) * (1 - progress) * 9 : 0;

  useEffect(() => {
    if (!selected || !nodeRef.current || !transformerRef.current) return;
    transformerRef.current.nodes([nodeRef.current]);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selected, image, element.kind]);

  const commitPosition = (node: any) => editorActions.updateElement(element.id, {
    x: (node.x() / format.width) * 100,
    y: (node.y() / format.height) * 100,
  });

  const commitTransform = (node: any) => {
    if (element.kind !== "image") {
      const nextWidth = Math.max(5, Math.min(100, (artWidth * Math.abs(node.scaleX()) / format.width) * 100));
      editorActions.updateElement(element.id, {
        x: (node.x() / format.width) * 100,
        y: (node.y() / format.height) * 100,
        width: nextWidth,
        textSizing: "fixed",
        scale: 100,
        rotation: node.rotation(),
      }, false);
      node.scaleX(1);
      node.scaleY(1);
      return;
    }
    const absoluteScale = Math.max(5, Math.min(600, node.scaleX() * 100));
    editorActions.updateElement(element.id, {
      x: (node.x() / format.width) * 100,
      y: (node.y() / format.height) * 100,
      scale: absoluteScale,
      rotation: node.rotation(),
    });
  };

  const common = {
    ref: nodeRef,
    x: artX + motionX,
    y: artY + motionY,
    rotation: display.rotation,
    scaleX: display.scale / 100 * motionScale,
    scaleY: display.scale / 100 * motionScale,
    opacity: display.opacity / 100 * motionOpacity,
    draggable: !element.locked,
    onPointerDown: (event: any) => { event.cancelBubble = true; editorActions.select(element.id); },
    onDragEnd: (event: any) => commitPosition(event.target),
    onTransformEnd: (event: any) => commitTransform(event.target),
    onDblClick: (event: any) => {
      if (element.kind === "image" || !nodeRef.current) return;
      const node = nodeRef.current, stage = event.target.getStage(), rect = node.getClientRect(), stageRect = stage.container().getBoundingClientRect();
      node.hide(); transformerRef.current?.hide(); node.getLayer()?.batchDraw();
      const input = document.createElement("textarea");
      input.value = element.text; input.style.cssText = `position:fixed;z-index:9999;left:${stageRect.left + rect.x}px;top:${stageRect.top + rect.y}px;width:${Math.max(80, rect.width)}px;height:${Math.max(36, rect.height)}px;padding:0;border:1px solid #2878ff;outline:none;resize:none;background:transparent;color:${element.color};font:${element.fontSize * (stage.scaleX() || 1)}px ${element.fontFamily};line-height:${element.lineHeight / 100};`;
      document.body.appendChild(input); input.focus(); input.select();
      const finish = () => { editorActions.updateElement(element.id, { text: input.value, textSizing: "auto" }, false); input.remove(); node.show(); transformerRef.current?.show(); node.getLayer()?.batchDraw(); };
      input.addEventListener("blur", finish, { once: true });
      input.addEventListener("keydown", (key) => { if (key.key === "Escape") { input.value = element.text; input.blur(); } if (key.key === "Enter" && (key.metaKey || key.ctrlKey)) input.blur(); });
    },
  };

  return <>
    {element.kind === "image" ? (
      <KonvaImage {...common} image={image ?? undefined} width={artWidth} height={artWidth * ratio} />
    ) : (
      <Text {...common} text={text} width={display.textSizing === "fixed" ? artWidth : undefined} fontFamily={element.fontFamily} fontSize={element.fontSize} lineHeight={element.lineHeight / 100} fill={element.color} align={element.textAlign ?? "left"} wrap="word" />
    )}
    {selected && !element.locked && <Transformer
      ref={transformerRef}
      rotateEnabled
      keepRatio={element.kind === "image"}
      flipEnabled={false}
      enabledAnchors={element.kind === "image" ? ["top-left","top-right","bottom-left","bottom-right"] : ["middle-left","middle-right"]}
      anchorSize={9}
      borderStroke="#2878ff"
      anchorStroke="#2878ff"
      anchorFill="#ffffff"
      boundBoxFunc={(oldBox, newBox) => Math.abs(newBox.width) < 8 || Math.abs(newBox.height) < 8 ? oldBox : newBox}
    />}
  </>;
}

export default function CanvasV2() {
  const state = useEditorState();
  const format = formats.find((f) => f.id === state.activeFormat)!;
  const preview = fitPreview(format.width, format.height, 760, 460);
  const zoom = state.canvasZoom ?? 1;
  const scaleX = preview.width / format.width * zoom, scaleY = preview.height / format.height * zoom;
  const elements = state.elementsByFormat[state.activeFormat] ?? [];
  const shellRef = useRef<HTMLDivElement>(null);
  const panStart = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const [spaceDown, setSpaceDown] = useState(false);
  const [panning, setPanning] = useState(false);

  useEffect(() => {
    const editable = (target: EventTarget | null) => target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
    const down = (event: KeyboardEvent) => {
      if (event.code !== "Space" || editable(event.target)) return;
      event.preventDefault();
      setSpaceDown(true);
    };
    const up = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      setSpaceDown(false);
      setPanning(false);
      panStart.current = null;
    };
    addEventListener("keydown", down);
    addEventListener("keyup", up);
    return () => { removeEventListener("keydown", down); removeEventListener("keyup", up); };
  }, []);

  const beginPan = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!spaceDown || !shellRef.current) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    panStart.current = { x: event.clientX, y: event.clientY, left: shellRef.current.scrollLeft, top: shellRef.current.scrollTop };
    setPanning(true);
  };
  const movePan = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!panning || !panStart.current || !shellRef.current) return;
    shellRef.current.scrollLeft = panStart.current.left - (event.clientX - panStart.current.x);
    shellRef.current.scrollTop = panStart.current.top - (event.clientY - panStart.current.y);
  };
  const endPan = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    panStart.current = null;
    setPanning(false);
  };
  const zoomWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    editorActions.setCanvasZoom(zoom * (event.deltaY < 0 ? 1.1 : .9));
  };

  return <div
    ref={shellRef}
    className={`core-canvas-shell ${spaceDown ? "can-pan" : ""} ${panning ? "is-panning" : ""}`}
    onPointerDown={beginPan}
    onPointerMove={movePan}
    onPointerUp={endPan}
    onPointerCancel={endPan}
    onWheel={zoomWheel}
  >
    <Stage width={preview.width * zoom} height={preview.height * zoom} scaleX={scaleX} scaleY={scaleY} onPointerDown={(event) => { if (!spaceDown && event.target === event.target.getStage()) editorActions.select(null); }} className="core-stage">
      <Layer>
        {elements.filter((element) => element.visible).map((element) => <CanvasObject key={element.id} element={element} />)}
      </Layer>
    </Stage>
  </div>;
}
