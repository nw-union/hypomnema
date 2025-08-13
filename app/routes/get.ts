import type { LoaderFunctionArgs } from "react-router";
import type { Item } from "../../domain/item";
import { getItemsFromKV } from "../services/kv.server";
import { getUserEmail } from "../util.server";

export async function loader({ request, context, params }: LoaderFunctionArgs) {
  const env = context.cloudflare.env;

  // typeパラメータのバリデーション
  const type = params.type;
  if (!type || !["mypage", "share"].includes(type)) {
    return Response.json(
      { error: "Invalid type. Must be 'mypage' or 'share'" },
      { status: 400 },
    );
  }

  // ユーザー ID を決定
  let userId: string;
  if (type === "share") {
    // 共有データは固定のuserIdを使用
    userId = "share";
  } else {
    // mypageの場合は実際のユーザーIDを使用
    const useridres = await getUserEmail(env, request);
    if (useridres.isErr()) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = useridres.value;
  }

  try {
    // KVからアイテムを取得
    const itemsResult = await getItemsFromKV(env.ITEMS_KV, userId);
    if (itemsResult.isErr()) {
      console.error("Error getting items:", itemsResult.error);
      return Response.json({ error: "Failed to get items" }, { status: 500 });
    }

    const items: Item[] = itemsResult.value;

    // 成功レスポンス
    return Response.json({
      items,
      type,
    });
  } catch (error) {
    console.error("Error getting items:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
