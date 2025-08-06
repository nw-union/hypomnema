import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("update/:type/:id", "routes/update.ts"),
] satisfies RouteConfig;
