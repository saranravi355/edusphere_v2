import { permanentRedirect } from "next/navigation";

/**
 * Assets moved to the operations portal.
 *
 * Kept as a redirect rather than deleted: this URL is in browser histories,
 * bookmarks and the sidebar of anyone with a stale tab open, and a 404 on a
 * page that still exists is a bad way to find that out.
 */
export default function AssetsMoved(): never {
  permanentRedirect("/operations/assets");
}
