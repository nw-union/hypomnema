import OutlineEditor from "../components/OutlineEditor.tsx";
import NavigationTabs from "../components/NavigationTabs.tsx";
import type { Item } from "../../domain/item";
import { newItem } from "../../domain/logic";
import { getItemsFromKV } from "../services/kv.server.ts";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { v4 as uuidv4 } from "uuid";
import { getUserEmail } from "../util.server.ts";

// export function meta({}: Route.MetaArgs) {
//   return [
//     { title: "New React Router App" },
//     { name: "description", content: "Welcome to React Router!" },
//   ];
// }
//

interface LoaderData {
  items: Item[];
  userId: string;
}

export async function loader({
  context,
  request,
}: LoaderFunctionArgs): Promise<LoaderData> {
  const env = context.cloudflare.env;

  // ユーザー ID を取得
  const useridres = await getUserEmail(env, request);
  if (useridres.isErr()) {
    throw new Response("Unauthorized", { status: 401 });
  }
  const userId = useridres.value;

  // KV からアイテムを取得、なければ mockItemList を使用
  const itemsResult = await getItemsFromKV(env.ITEMS_KV, userId);
  if (itemsResult.isErr()) {
    throw new Response("Failed to load items", { status: 500 });
  }

  let items = itemsResult.value;
  if (items.length === 0) {
    items = [newItem(uuidv4())];
  }

  return {
    items,
    userId,
  };
}

export default function Index() {
  const { items } = useLoaderData<LoaderData>();

  return (
    <div className="max-w-3xl mx-auto pt-4 pb-28 px-8">
      <NavigationTabs />
      <OutlineEditor id="root" items={items} />
    </div>
  );
}
