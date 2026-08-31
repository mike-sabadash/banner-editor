import { useEffect, useMemo, useRef, useState } from "react";
import { Image as KonvaImage, Layer, Stage, Text, Transformer } from "react-konva";
import { formats, fitPreview, type BannerElement } from "../model";
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

  useEffect(() => {
    if (!selected || !nodeRef.current || !transformerRef.current) return;
    transformerRef.current.nodes([nodeRef.current]);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selected, image]);

  const commitPosition = (node: any) => editorActions.updateElement(element.id, {
    x: (node.x() / format.width) * 100,
    y: (node.y() / format.height) * 100,
  });
  const commitTransform = (node: any) => {
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
    x: artX,
    y: artY,
    rotation: display.rotation,
    scaleX: display.scale / 100,
    scaleY: display.scale / 100,
    opacity: display.opacity / 100,
    draggable: !element.locked,
    onPointerDown: (event: any) => { event.cancelBubble = true; editorActions.select(element.id); },
    onDragEnd: (event: any) => commitPosition(event.target),
    onTransformEnd: (event: any) => commitTransform(event.target),
  };

  return <>
    {element.kind === "image" ? (
      <KonvaImage {...common} image={image ?? undefined} width={artWidth} height={artWidth * ratio} />
    ) : (
      <Text {...common} text={element.text} width={artWidth} fontFamily={element.fontFamily} fontSize={element.fontSize} lineHeight={element.lineHeight / 100} fill={element.color} />
    )}
    {selected && !element.locked && <Transformer ref={transformerRef} rotateEnabled keepRatio={element.kind === "image"} flipEnabled={false} anchorSize={9} borderStroke="#2878ff" anchorStroke="#2878ff" anchorFill="#ffffff" boundBoxFunc={(oldBox, newBox) => Math.abs(newBox.width) < 8 || Math.abs(newBox.height) < 8 ? oldBox : newBox} />}
  </>;
}

export default function CanvasV2() {
  const state = useEditorState();
  const format = formats.find((f) => f.id === state.activeFormat)!;
  const preview = fitPreview(format.width, format.height, 760, 460);
  const scaleX = preview.width / format.width, scaleY = preview.height / format.height;
  const elements = state.elementsByFormat[state.activeFormat] ?? [];
  return <div className="core-canvas-shell">
    <Stage width={preview.width} height={preview.height} scaleX={scaleX} scaleY={scaleY} onPointerDown={(event) => { if (event.target === event.target.getStage()) editorActions.select(null); }} className="core-stage">
      <Layer>
        {elements.filter((e) => e.visible).map((element) => <CanvasObject key={element.id} element={element} />)}
      </Layer>
    </Stage>
  </div>;
}
