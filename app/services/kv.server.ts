import type { Item } from "../../domain/item";
import { updateChildren } from "../../domain/logic";
import { ResultAsync } from "neverthrow";

/**
 * KV からアイテムリストを取得する
 */
export function getItemsFromKV(
  kv: KVNamespace,
  userId: string,
): ResultAsync<Item[], Error> {
  const key = `items:${userId}`;
  return ResultAsync.fromPromise(
    kv.get(key, "json"),
    (error) => new Error(`Failed to get items from KV: ${error}`),
  ).map((data) => (data as Item[]) || []);
}

function saveToKV(
  kv: KVNamespace,
  userId: string,
  items: Item[],
): ResultAsync<void, Error> {
  const key = `items:${userId}`;
  return ResultAsync.fromPromise(
    kv.put(key, JSON.stringify(items)),
    (error) => new Error(`Failed to save items to KV: ${error}`),
  );
}

/**
 * KV にアイテムリストを保存する
 */
export function saveItemsToKV(
  kv: KVNamespace,
  userId: string,
  itemId: string,
  items: Item[],
): ResultAsync<void, Error> {
  if (itemId === "root") {
    return saveToKV(kv, userId, items);
  } else {
    return getItemsFromKV(kv, userId).andThen((root) =>
      saveToKV(kv, userId, updateChildren(root, itemId, items)),
    );
  }
}
