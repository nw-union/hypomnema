import type { Item } from "./item";
import { err, ok, type Result } from "neverthrow";

/**
 * 新しいアイテムを作成する
 *
 * @return 新しいアイテム
 */
export const newItem = (newId: string): Item => ({
  id: newId,
  symbol: "dot",
  text: "",
  children: [],
  isExpanded: true,
});

/**
 * アイテムが子要素を持つかどうかを判定する
 *
 * @param item - 判定対象のアイテム
 * @return アイテムが子要素を持つ場合は true、そうでない場合は false
 */
export const hasChildren = (item: Item): boolean =>
  item.children && item.children.length > 0;

/**
 * アイテムが特定のIDの子要素を持つかどうかを判定する
 *
 * @param item - 判定対象のアイテム
 * @param targetId - 判定するItemID
 */
const hasChildrenById = (item: Item, targetId: string): boolean =>
  item.children.some((child) => child.id === targetId);

/**
 * list 内の targetId の Item を更新する
 *
 * @param list - Item[]
 * @param targetId - 更新対象の ItemID
 * @param f - 更新関数
 * @return 更新された Item[]
 */
const updateItem = (
  list: Item[],
  targetId: string,
  f: (item: Item) => Item | Item[],
): Item[] =>
  list.flatMap((item) => {
    // 対象のアイテムの ID と一致する場合は Item を更新
    if (item.id === targetId) {
      return f(item);
    }
    // 子アイテムがある場合は再帰的に更新処理
    if (hasChildren(item)) {
      return {
        ...item,
        children: updateItem(item.children, targetId, f),
      };
    }
    return item;
  });

/**
 * 指定された ID のアイテムのテキストを更新する
 *
 * @param list - Item[]
 * @param targetId - 更新対象の ItemID
 * @param newText - 新しいテキスト
 * @return 更新された Item[]
 */
export const updateText = (
  list: Item[],
  targetId: string,
  newText: string,
): Item[] =>
  updateItem(list, targetId, (item) => ({
    ...item,
    text: newText,
  }));

/**
 * 指定された ID のアイテムを展開状態をトグルする
 *
 * @param list - Item[]
 * @param targetId - トグル対象の ItemID
 * @return 更新された Item[]
 */
export const toggleExpanded = (list: Item[], targetId: string): Item[] =>
  updateItem(list, targetId, (item) => ({
    ...item,
    isExpanded: !item.isExpanded,
  }));

/**
 * 指定された ID の 子要素を更新する
 *
 * @param list - Item[]
 * @param targetId - 更新対象の ItemID
 * @param children - 新しい子要素の配列
 * @return 更新された Item[]
 */
export const updateChildren = (
  list: Item[],
  targetId: string,
  children: Item[],
): Item[] =>
  updateItem(list, targetId, (item) => ({
    ...item,
    children: children,
  }));

/**
 * 指定されたIDのアイテムを削除する
 *
 * @param list - Item[]
 * @param targetId - 削除対象のアイテム
 * @param force - 強制削除フラグ（子がある場合でも削除するかどうか）
 * @return 更新されたItem[]
 */
export const deleteItem = (
  list: Item[],
  targetId: string,
  force: boolean = false, // 強制削除フラグ: デフォルトは false
): Item[] =>
  updateItem(list, targetId, (item) => {
    // 子がない場合 or force=true の場合は削除する
    if (!hasChildren(item) || force) {
      return []; // 削除 = 空の配列を返す
    }
    return item;
  });

/**
 * 指定されたIDのアイテムの後に新しいアイテムを追加する
 *
 * @param targetId - 追加位置のアイテムID
 * @param newId - 新しいアイテムのID
 * @returns 更新されたItemのコピー
 *
 * - 指定したアイテムが子要素を持つ and 展開している場合, 子要素の先頭に追加
 * - 指定したアイテムが子要素を持たない or 展開されていない場合, そのアイテムの直後に追加
 *
 */
export const addItem = (
  list: Item[],
  targetId: string,
  newId: string,
): Item[] =>
  updateItem(list, targetId, (item) => {
    // 子アイテムがある & 展開されている場合は、子の先頭に追加
    if (hasChildren(item) && item.isExpanded) {
      return { ...item, children: [newItem(newId), ...item.children] };
    }
    // それ以外( = 子がない or 展開されていない) の場合は, 直後に追加
    return [item, newItem(newId)];
  });

// ----------------------------------------------------------------------------

/**
 * アイテムリストから表示されているIDリストを取得する
 * (表示されている = isExpanded = true)
 *
 * @param list - アイテムのリスト
 * @returns 表示されているIDのイテレーター
 */
function* visibleItemsIterator(items: Item[]): Generator<string> {
  for (const item of items) {
    yield item.id;
    if (item.isExpanded) {
      yield* visibleItemsIterator(item.children);
    }
  }
}

function* itemsFlatIterator(items: Item[]): Generator<string> {
  for (const item of items) {
    yield item.id;
  }
}

const getPrev = (
  list: Generator<string>,
  target: string,
): Result<string, Error> => {
  let prev: string | null = null;
  for (const id of list) {
    if (id === target) {
      if (prev === null) {
        return err(new Error("Previous item not found"));
      }
      return ok(prev); // 直前のアイテムを返す
    }
    prev = id;
  }
  return err(new Error("Previous item not found"));
};

const getNext = (
  list: Generator<string>,
  target: string,
): Result<string, Error> => {
  let isMatch = false;
  for (const id of list) {
    if (isMatch) {
      return ok(id); // 直後のアイテムを返す
    }
    if (id === target) {
      isMatch = true;
    }
  }
  return err(new Error("Next item not found"));
};

/**
 * 表示されているアイテムの中で、指定されたIDの直前のアイテムのIDを取得する（イテレータ版）
 * getVisibleIdsを使わず、必要な部分までしか走査しないため効率的
 *
 * @param list - アイテムのリスト
 * @param targetId - 対象アイテムのID
 * @returns 直前のアイテムのID
 */
export const findPrevId = (
  list: Item[],
  targetId: string,
): Result<string, Error> => getPrev(visibleItemsIterator(list), targetId);

/**
 * 表示されているアイテムの中で、指定されたIDの直後のアイテムのIDを取得する
 *
 * @param list - アイテムのリスト
 * @param targetId - 対象アイテムのID
 * @returns 直後のアイテムのID
 */
export const findNextId = (
  list: Item[],
  targetId: string,
): Result<string, Error> => getNext(visibleItemsIterator(list), targetId);

// ----------------------------------------------------------------------------

/**
 * 指定されたIDのアイテムをインデント（字下げ）する
 *
 * インデントは同じ階層の直前のアイテムの子要素として移動させる処理です。
 * 例:
 * - A
 * - B <- これをインデント
 * - C
 *
 * 結果:
 * - A
 *   - B <- Aの子要素になる
 * - C
 *
 * @param item - ルートアイテム
 * @param targetId - インデント対象のアイテムID
 * @returns 更新されたItem
 */
export const indentItem = (
  list: Item[],
  targetId: string,
  newId: string,
): Item[] => {
  // 同じレイヤーの前のアイテムを探す
  const prevId = findLayerPrevItem(list, targetId);
  if (prevId.isErr()) {
    return list;
  }

  // ターゲットアイテムを取得して, 新しいIDを設定
  const targetItem = find(list, targetId);
  if (targetItem.isErr()) {
    return list;
  }
  const newItem = { ...targetItem.value, id: newId };

  // 削除してから追加
  const updated = deleteItem(list, targetId, true);
  return addAsLastChild(updated, prevId.value, newItem);
};

/**
 * 指定されたIDのアイテムをアウトデント（字上げ）する
 *
 * @param item - ルートアイテム
 * @param targetId - アウトデント対象のアイテムID
 * @returns 更新されたItem
 */
export const outdentItem = (
  list: Item[],
  targetId: string,
  newId: string,
): Item[] => {
  // 親を探す
  const parentId = findParent(list, targetId);
  if (parentId.isErr()) {
    return list;
  }

  // ターゲットアイテムを取得して, 新しいIDを設定
  const targetItem = find(list, targetId);
  if (targetItem.isErr()) {
    return list;
  }
  const newItem = { ...targetItem.value, id: newId };

  // 削除してから親の後ろに追加
  const updated = deleteItem(list, targetId, true);
  return addAfterItem(updated, parentId.value, newItem);
};

/**
 * リスト内で同じレイヤーの前のアイテムを探す
 *
 * @param list - 検索対象のアイテムリスト
 * @param targetId - 対象アイテムのID
 * @returns prevItem: 同じレイヤーの前のアイテム、parent: 親アイテム
 */
const findLayerPrevItem = (
  list: Item[],
  targetId: string,
): Result<string, Error> => {
  // list の中に該当する targetId があるかを確認
  const res = getPrev(itemsFlatIterator(list), targetId);
  if (res.isOk()) {
    return ok(res.value);
  }

  // なければ子要素の中を再帰的に探す
  for (const item of list) {
    const res = findLayerPrevItem(item.children, targetId);
    if (res.isOk()) {
      return ok(res.value);
    }
  }

  return err(new Error("Previous item not found in the same layer"));
};

/**
 * リスト内の指定されたIDのアイテムの最後の子として新しいアイテムを追加する
 *
 * @param list - アイテムリスト
 * @param parentId - 親アイテムのID
 * @param newItem - 追加する新しいアイテム
 * @returns 更新されたアイテムリスト
 */
const addAsLastChild = (
  list: Item[],
  parentId: string,
  newItem: Item,
): Item[] =>
  updateItem(list, parentId, (item) => ({
    ...item,
    children: [...item.children, newItem],
  }));

/**
 * リスト内の指定されたIDのアイテムの後に新しいアイテムを追加する
 *
 * @param list - アイテムリスト
 * @param targetId - 追加位置のアイテムID
 * @param newItem - 追加する新しいアイテム
 * @returns 更新されたアイテムリスト
 */
export const addAfterItem = (
  list: Item[],
  targetId: string,
  newItem: Item,
): Item[] => updateItem(list, targetId, (item) => [item, newItem]);

/**
 * リストから指定されたIDのアイテムの親を探す
 *
 * @param list - アイテムリスト
 * @param targetId - 対象アイテムのID
 * @returns parent: 親アイテム、grandParent: 祖父母アイテム
 */
const findParent = (list: Item[], targetId: string): Result<string, Error> => {
  for (const item of list) {
    if (hasChildrenById(item, targetId)) {
      return ok(item.id);
    }
    const found = findParent(item.children, targetId);
    if (found.isOk()) {
      return ok(found.value);
    }
  }
  return err(new Error("Parent item not found"));
};

/**
 * リストから指定されたIDのアイテムを再帰的に検索する
 *
 * @param list - 検索対象のアイテムリスト
 * @param targetId - 検索するアイテムID
 * @returns 見つかった場合はItem、見つからない場合はnull
 */
export const find = (list: Item[], targetId: string): Result<Item, Error> => {
  for (const item of list) {
    if (item.id === targetId) return ok(item);

    const found = find(item.children, targetId);
    if (found.isOk()) return ok(found.value);
  }
  return err(new Error(`Item with ID ${targetId} not found`));
};

/**
 * 指定されたIDのアイテムを一つ上のアイテムと入れ替える
 *
 * @param list - アイテムリスト
 * @param targetId - 入れ替え対象のアイテムID
 * @param newId - 入れ替え後の新しいID
 * @returns 更新されたアイテムリスト
 */
export const swapWithPrevious = (
  list: Item[],
  targetId: string,
  newId: string,
): Item[] => {
  // 同じレイヤーでの位置を探す
  const swapInList = (items: Item[]): Item[] => {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === targetId && i > 0) {
        // 見つかった場合、前のアイテムと入れ替え
        const newItems = [...items];
        // IDを更新してから入れ替え
        const updatedItem = { ...newItems[i], id: newId };
        [newItems[i - 1], newItems[i]] = [updatedItem, newItems[i - 1]];
        return newItems;
      }
    }
    return items;
  };

  // トップレベルで試す
  const swapped = swapInList(list);
  if (swapped !== list) {
    return swapped;
  }

  // 子要素を再帰的に処理
  return list.map((item) => ({
    ...item,
    children: swapWithPrevious(item.children, targetId, newId),
  }));
};

/**
 * 指定されたIDから根要素までのパンクズリストを生成する
 *
 * @param list - アイテムのリスト
 * @param targetId - 対象アイテムのID
 * @returns 根要素からtargetIdまでの親子関係のid・textのリスト
 */
export const getBreadcrumb = (
  list: Item[],
  targetId: string,
): Result<{ id: string; text: string }[], Error> => {
  const breadcrumb: { id: string; text: string }[] = [];

  const findPath = (
    items: Item[],
    target: string,
    path: { id: string; text: string }[],
  ): boolean => {
    for (const item of items) {
      const currentPath = [...path, { id: item.id, text: item.text }];

      if (item.id === target) {
        breadcrumb.push(...currentPath);
        return true;
      }

      if (hasChildren(item) && findPath(item.children, target, currentPath)) {
        return true;
      }
    }
    return false;
  };

  if (findPath(list, targetId, [])) {
    return ok(breadcrumb);
  }

  return err(new Error(`Item with ID ${targetId} not found`));
};

// TODO: この関数は他の関数で代用できない？
export const findPrevIdForDelete = (list: Item[], targetId: string): string =>
  findPrevId(list, targetId).match(
    (prevId) => prevId,
    () => list[0]?.id ?? "", // 前のアイテムが見つからない場合は最初のアイテムのIDを返す
  );
