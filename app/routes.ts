import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("update/:type/:id", "routes/update.ts"),
  route("get/:type", "routes/get.ts"), // ← 追加
] satisfies RouteConfig;
