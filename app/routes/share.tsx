import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { v4 as uuidv4 } from "uuid";
import type { Item } from "../../domain/item";
import { newItem } from "../../domain/logic";
import OutlineEditor from "../components/OutlineEditor.tsx";
import { getItemsFromKV } from "../services/kv.server.ts";
import { getUserEmail } from "../util.server.ts";

interface LoaderData {
  items: Item[];
  userId: string;
}

export async function loader({
  context,
  request,
}: LoaderFunctionArgs): Promise<LoaderData> {
  const env = context.cloudflare.env;

  // 認証チェック - ユーザー ID を取得
  const useridres = await getUserEmail(env, request);
  if (useridres.isErr()) {
    throw new Response("Unauthorized", { status: 401 });
  }

  // 共有データは固定のuserIdを使用
  const userId = "share";

  // KV からアイテムを取得、なければ新しいアイテムを作成
  let items = await getItemsFromKV(env.ITEMS_KV, userId);
  if (items.length === 0) {
    items = [newItem(uuidv4())];
  }

  return {
    items,
    userId,
  };
}

export default function Share() {
  const { items } = useLoaderData<LoaderData>();

  return (
    <div className="max-w-3xl mx-auto pt-4 pb-28 px-8">
      <OutlineEditor id="root" items={items} apiPrefix="/share" />
    </div>
  );
}
