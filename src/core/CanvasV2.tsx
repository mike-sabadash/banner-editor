import { useEffect, useMemo, useRef, useState } from "react";
import { Image as KonvaImage, Layer, Line, Rect, Stage, Text, Transformer } from "react-konva";
import { formats, fitPreview, type BannerElement } from "../model";
import { animatedText, applyTextCase } from "./interaction";
import { editorActions, getDisplayElement, useEditorState } from "./editorStore";

const useHtmlImage = (src?: string) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!src) { setImage(null); setError(true); return; }
    let cancelled = false;
    setImage(null); setError(false);
    const img = new window.Image();
    const ready = () => { if (!cancelled && img.naturalWidth > 0) { setImage(img); setError(false); } };
    img.onload = ready;
    img.onerror = () => { if (!cancelled) setError(true); };
    img.src = src;
    if (img.complete) ready();
    if (typeof img.decode === "function") void img.decode().then(ready).catch(() => { if (!img.complete && !cancelled) setError(true); });
    return () => { cancelled = true; img.onload = null; img.onerror = null; };
  }, [src]);
  return { image, error };
};

function CanvasObject({ element, setGuides }: { element: BannerElement; setGuides: (guides: Array<"left"|"right"|"top"|"bottom">) => void }) {
  const state = useEditorState();
  const selected = (state.selectedIds?.length ? state.selectedIds : state.selectedId ? [state.selectedId] : []).includes(element.id);
  const nodeRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const { image, error: imageError } = useHtmlImage(element.assetUrl);
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

  useEffect(() => () => editorRef.current?.remove(), []);

  const commitPosition = (node: any) => editorActions.updateElement(element.id, {
    x: (node.x() / format.width) * 100,
    y: (node.y() / format.height) * 100,
  });

  const commitTransform = (node: any) => {
    if (element.kind !== "image") {
      const nextWidth = Math.max(5, Math.min(100, (node.width() / format.width) * 100));
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
    onPointerDown: (event: any) => { event.cancelBubble = true;const source=event.evt as PointerEvent;editorActions.select(element.id,source.shiftKey||source.metaKey||source.ctrlKey); },
    onDragMove: (event: any) => {
      if (element.kind !== "image") return;
      const node = event.target, width = node.width() * node.scaleX(), height = node.height() * node.scaleY(), threshold = 7, next: Array<"left"|"right"|"top"|"bottom"> = [];
      if (Math.abs(node.x()) < threshold) { node.x(0); next.push("left"); }
      if (Math.abs(node.y()) < threshold) { node.y(0); next.push("top"); }
      if (Math.abs(node.x() + width - format.width) < threshold) { node.x(format.width - width); next.push("right"); }
      if (Math.abs(node.y() + height - format.height) < threshold) { node.y(format.height - height); next.push("bottom"); }
      setGuides(next);
    },
    onDragEnd: (event: any) => { setGuides([]); commitPosition(event.target); },
    onTransform: (event: any) => {
      const node = event.target;
      if (element.kind !== "image") {
        node.width(Math.max(18, node.width() * Math.abs(node.scaleX())));
        node.scaleX(1); node.scaleY(1);
        transformerRef.current?.forceUpdate();
      } else {
        const width=node.width()*node.scaleX(),height=node.height()*node.scaleY(),threshold=7,next:Array<"left"|"right"|"top"|"bottom">=[];
        if(Math.abs(node.x())<threshold)next.push("left"); if(Math.abs(node.y())<threshold)next.push("top");
        if(Math.abs(node.x()+width-format.width)<threshold)next.push("right"); if(Math.abs(node.y()+height-format.height)<threshold)next.push("bottom");
        setGuides(next);
      }
    },
    onTransformEnd: (event: any) => { setGuides([]); commitTransform(event.target); },
    onDblClick: (event: any) => {
      if (element.kind === "image" || !nodeRef.current) return;
      editorRef.current?.focus();
      if (editorRef.current) return;
      const node = nodeRef.current, stage = event.target.getStage(), rect = node.getClientRect(), stageRect = stage.container().getBoundingClientRect();
      node.hide(); transformerRef.current?.hide(); node.getLayer()?.batchDraw();
      const input = document.createElement("textarea");
      editorRef.current = input;
      const canvasScale = stage.scaleX() || 1;
      const editWidth = Math.max(40, artWidth * canvasScale * (display.scale / 100));
      input.value = element.text;
      input.spellcheck = false;
      input.style.cssText = `position:fixed;z-index:9999;box-sizing:border-box;left:${stageRect.left + rect.x}px;top:${stageRect.top + rect.y}px;width:${editWidth}px;min-height:${Math.max(24, rect.height)}px;height:${Math.max(24, rect.height)}px;margin:0;padding:0;border:1px solid #2878ff;border-radius:0;outline:none;resize:none;overflow:hidden;white-space:pre-wrap;overflow-wrap:break-word;word-break:normal;background:transparent;color:${element.color};caret-color:${element.color};font-family:${element.fontFamily};font-size:${element.fontSize * canvasScale}px;font-weight:inherit;line-height:${element.lineHeight / 100};text-align:${element.textAlign ?? "left"};transform-origin:left top;`;
      document.body.appendChild(input);
      const fit=()=>{input.style.height="0";input.style.height=`${Math.max(24,input.scrollHeight)}px`};
      input.addEventListener("input",fit); fit(); input.focus(); input.setSelectionRange(input.value.length,input.value.length);
      let finished=false;
      const finish = () => { if(finished)return;finished=true;editorRef.current=null;editorActions.updateElement(element.id, { text: input.value, textSizing: "fixed" }, false); input.remove(); node.show(); transformerRef.current?.show(); node.getLayer()?.batchDraw(); };
      input.addEventListener("blur", finish, { once: true });
      input.addEventListener("keydown", (key) => { if (key.key === "Escape") { input.value = element.text; input.blur(); } if (key.key === "Enter" && (key.metaKey || key.ctrlKey)) input.blur(); });
    },
  };

  return <>
    {element.kind === "image" ? image ? (
      <KonvaImage {...common} image={image} width={artWidth} height={artWidth * ratio} />
    ) : (
      <><Rect {...common} width={artWidth} height={Math.max(72,artWidth * ratio)} fill={imageError?"#fff0ef":"#eef1ed"} stroke={imageError?"#d84f45":"#aab0a7"} dash={[8,6]}/><Text x={artX+12} y={artY+12} width={Math.max(40,artWidth-24)} text={imageError?"Image could not be decoded":"Loading image…"} fontSize={14} fill={imageError?"#a33a32":"#687068"}/></>
    ) : (
      <Text {...common} text={text} width={artWidth} fontFamily={element.fontFamily} fontSize={element.fontSize} lineHeight={element.lineHeight / 100} fill={element.color} align={element.textAlign ?? "left"} wrap="word" />
    )}
    {selected && !element.locked && <Transformer
      ref={transformerRef}
      rotateEnabled
      keepRatio={element.kind === "image"}
      flipEnabled={false}
      enabledAnchors={element.kind === "image" ? ["top-left","top-right","bottom-left","bottom-right"] : ["middle-left","middle-right"]}
      ignoreStroke
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
  const [guides, setGuides] = useState<Array<"left"|"right"|"top"|"bottom">>([]);

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
        {elements.filter((element) => element.visible&&state.playhead>=(element.inPoint??0)-.001&&state.playhead<=(element.outPoint??state.duration)+.001).map((element) => <CanvasObject key={element.id} element={element} setGuides={setGuides} />)}
        {guides.map((guide)=><Line key={guide} points={guide==="left"?[0,0,0,format.height]:guide==="right"?[format.width,0,format.width,format.height]:guide==="top"?[0,0,format.width,0]:[0,format.height,format.width,format.height]} stroke="#ff2db2" strokeWidth={1}/>)}
      </Layer>
    </Stage>
  </div>;
}
