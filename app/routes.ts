import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("share", "routes/share.tsx"),
  route("share/:id", "routes/share/item.tsx"),
  route(":itemId", "routes/item.tsx"),
  route("update/:id", "routes/update.ts"),
  route("share/update/:id", "routes/share/update.$id.ts"),
] satisfies RouteConfig;
