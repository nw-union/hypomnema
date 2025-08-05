import type { ActionFunctionArgs } from "react-router";
import { z } from "zod";
import type { Item } from "../../../domain/item";
import { saveItemsToKV } from "../../services/kv.server";
import { getUserEmail } from "../../util.server";

// アイテムのスキーマ定義
const ItemSchema: z.ZodType<Item> = z.lazy(() =>
  z.object({
    id: z.string(),
    symbol: z.enum([
      "dot",
      "naraba",
      "therefore",
      "because",
      "equal",
      "notEqual",
    ]),
    text: z.string(),
    children: z.array(ItemSchema),
    isExpanded: z.boolean(),
  }),
);

// リクエストボディのスキーマ
const UpsertItemsSchema = z.object({
  items: z.array(ItemSchema),
});

export async function action({ request, context, params }: ActionFunctionArgs) {
  const env = context.cloudflare.env;

  // 認証チェック - ユーザー ID を取得
  const useridres = await getUserEmail(env, request);
  if (useridres.isErr()) {
    throw new Response("Unauthorized", { status: 401 });
  }

  // 共有データは固定のuserIdを使用
  const userId = "share";

  // POSTメソッドのみ受け付ける
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const id = params.id;
  if (!id) {
    return Response.json({ error: "Item ID is required" }, { status: 400 });
  }

  try {
    // リクエストボディをパース
    const body = await request.json();

    // バリデーション
    const validationResult = UpsertItemsSchema.safeParse(body);
    if (!validationResult.success) {
      return Response.json(
        {
          error: "Invalid request body",
          details: validationResult.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { items } = validationResult.data;

    // KVに保存（共有データとして）
    const saveResult = await saveItemsToKV(env.ITEMS_KV, userId, id, items);
    if (saveResult.isErr()) {
      console.error("Error saving items:", saveResult.error);
      return Response.json({ error: "Failed to save items" }, { status: 500 });
    }

    // 成功レスポンス
    return Response.json({
      message: "Items saved successfully",
    });
  } catch (error) {
    console.error("Error upserting items:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
