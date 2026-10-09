const RESIZE_LAB_HOST = "resize-lab.bannermatic.online";

export function shouldRenderResizeLab(location: Pick<Location, "hostname" | "search">): boolean {
  return location.hostname === RESIZE_LAB_HOST
    || new URLSearchParams(location.search).get("view") === "resize-lab";
}
