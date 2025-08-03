import type { Item } from "../../domain/item";
import { updateChildren } from "../../domain/logic";

/**
 * KV からアイテムリストを取得する
 */
export async function getItemsFromKV(
  kv: KVNamespace,
  userId: string,
): Promise<Item[]> {
  const key = `items:${userId}`;
  const data = await kv.get(key, "json");
  return (data as Item[]) || [];
}

async function saveToKV(
  kv: KVNamespace,
  userId: string,
  items: Item[],
): Promise<void> {
  const key = `items:${userId}`;
  await kv.put(key, JSON.stringify(items));
}

/**
 * KV にアイテムリストを保存する
 */
export async function saveItemsToKV(
  kv: KVNamespace,
  userId: string,
  itemId: string,
  items: Item[],
): Promise<void> {
  if (itemId === "root") {
    return await saveToKV(kv, userId, items);
  } else {
    const root = await getItemsFromKV(kv, userId);
    return await saveToKV(kv, userId, updateChildren(root, itemId, items));
  }
}
