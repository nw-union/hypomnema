import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route(":itemId", "routes/item.tsx"),
  route("update/:id", "routes/update.ts"),
] satisfies RouteConfig;
