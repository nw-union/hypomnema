import { useCallback, useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import type { Item } from "../../domain/item";
import {
  toggleExpanded,
  addItem,
  deleteItem,
  updateText,
  findPrevIdForDelete,
  findPrevId,
  findNextId,
  indentItem,
  outdentItem,
  swapWithPrevious,
} from "../../domain/logic";
import OutlineList from "./OutlineList";
import MobileIndentControls from "./MobileIndentControls";
import { v4 as uuidv4 } from "uuid";

// Propsの型を指定
interface OutlineEditorProps {
  id: string;
  items: Item[];
  apiPrefix?: string; // オプショナルなAPIプレフィックス
}

function OutlineEditor({ id, items, apiPrefix = "" }: OutlineEditorProps) {
  // Stateの型を指定
  const [title, _setTitle] = useState<string>("");
  const [itemList, setItemList] = useState<Item[]>(items);
  const [focusedItemId, setFocusedItemId] = useState<string>(""); // Use nullish coalescing
  const fetcher = useFetcher();
  const isFirstRender = useRef(true);
  const saveTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Refの型を指定 (Record<string, HTMLDivElement | null>)
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // itemListが変更されたときにAPIを呼び出す（デバウンス付き）
  // biome-ignore lint/correctness/useExhaustiveDependencies: fetcherは安定した参照
  useEffect(() => {
    // 初回レンダリング時はスキップ
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // 既存のタイマーをクリア
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // itemListに変更があった場合、1秒後に保存
    if (itemList.length > 0) {
      saveTimerRef.current = setTimeout(() => {
        fetcher.submit(
          { items: itemList },
          {
            method: "POST",
            action: `${apiPrefix}/update/${id}`,
            encType: "application/json",
          },
        );
      }, 1000);
    }

    // クリーンアップ関数
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [itemList]); // fetcherは依存配列から除外（fetcherの参照は安定している）

  // --- Focus Management ---
  useEffect(() => {
    if (focusedItemId && itemRefs.current[focusedItemId]) {
      const element = itemRefs.current[focusedItemId];
      // Nullチェックを追加
      if (element) {
        element.focus();
        // カーソルを末尾に移動します（オプションですが、しばしば望まれます）window.getSelection()はnullを返すことがあります
        const sel = window.getSelection();
        if (sel) {
          const range = document.createRange();
          range.selectNodeContents(element);
          range.collapse(false); // false for end
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    }
  }, [focusedItemId]); // focusedItemIdが変更されたときに再実行

  // Callbackの型を指定
  const registerItemRef = useCallback(
    (id: string, ref: HTMLDivElement | null) => {
      if (ref) {
        itemRefs.current[id] = ref;
      } else {
        delete itemRefs.current[id]; // Clean up refs when items unmount
      }
    },
    [],
  );

  // --- Item Manipulation Callbacks ---

  // テキストを更新します
  const updateItemFn = useCallback((id: string, newText: string) => {
    setItemList((prev) => updateText(prev, id, newText));
  }, []);

  // 展開状態をトグルします
  const toggleItemExpansion = useCallback((id: string) => {
    setItemList((prev) => toggleExpanded(prev, id));
    // setFocusedItemId(id); // トグルされたアイテムにフォーカス
  }, []);

  // 新しい Item を追加します
  const addItemFn = useCallback((currentItemId: string) => {
    const id = uuidv4();
    setItemList((prev) => addItem(prev, currentItemId, id));
    setFocusedItemId(id); // 新しいアイテムにフォーカス
  }, []);

  // アイテムを削除します
  const deleteItemFn = useCallback((idToDelete: string) => {
    setItemList((prev) => {
      const prevId = findPrevIdForDelete(prev, idToDelete);
      setFocusedItemId(prevId); // 削除後のフォーカスを設定
      return deleteItem(prev, idToDelete);
    });
  }, []);

  // アイテムをインデントします
  const indentItemFn = useCallback((idToIndent: string) => {
    const newId = uuidv4(); // 新しいIDを生成
    setItemList((prev) => indentItem(prev, idToIndent, newId));
    // インデント後のアイテムにフォーカス
    setFocusedItemId(newId);
  }, []);

  // アイテムをアウトデントします
  const outdentItemFn = useCallback((idToOutdent: string) => {
    const newId = uuidv4(); // 新しいIDを生成
    setItemList((prev) => outdentItem(prev, idToOutdent, newId));
    // アウトデント後のアイテムにフォーカス
    setFocusedItemId(newId);
  }, []);

  // // ひとつ上のアイテムにフォーカスを移動します
  // const moveFocusUp = useCallback(
  //   (id: string) => {
  //     setFocusedItemId(findPrevIdById(items, id).unwrapOr(id));
  //   },
  //   [items],
  // );

  // // ひとつ下のアイテムにフォーカスを移動します
  // const moveFocusDown = useCallback(
  //   (id: string) => {
  //     setFocusedItemId(findNextIdById(items, id).unwrapOr(id));
  //   },
  //   [items],
  // );

  const moveFocus = useCallback(
    (currentItemId: string, direction: "up" | "down") => {
      if (itemList.length === 0) return;
      // const root = itemList[0];

      if (direction === "up") {
        findPrevId(itemList, currentItemId).match(
          (prevId) => setFocusedItemId(prevId),
          () => {}, // 前のアイテムが見つからない場合は何もしない
        );
      } else if (direction === "down") {
        findNextId(itemList, currentItemId).match(
          (nextId) => setFocusedItemId(nextId),
          () => {}, // 次のアイテムが見つからない場合は何もしない
        );
      }
    },
    [itemList],
  ); // Dependency on itemList is correct here

  // アイテムを上のアイテムと入れ替える
  const swapWithPreviousFn = useCallback((idToSwap: string) => {
    const newId = uuidv4();
    setItemList((prev) => swapWithPrevious(prev, idToSwap, newId));
    // 新しいIDにフォーカスを設定
    setFocusedItemId(newId);
  }, []);

  // フォーカス中のアイテムに対してインデント/アウトデントを実行
  const handleMobileIndent = useCallback(() => {
    if (focusedItemId && itemRefs.current[focusedItemId]) {
      const element = itemRefs.current[focusedItemId];
      if (element) {
        updateItemFn(focusedItemId, element.innerText);
      }
      indentItemFn(focusedItemId);
    }
  }, [focusedItemId, updateItemFn, indentItemFn]);

  const handleMobileOutdent = useCallback(() => {
    if (focusedItemId && itemRefs.current[focusedItemId]) {
      const element = itemRefs.current[focusedItemId];
      if (element) {
        updateItemFn(focusedItemId, element.innerText);
      }
      outdentItemFn(focusedItemId);
    }
  }, [focusedItemId, updateItemFn, outdentItemFn]);

  const handleMobileSwapUp = useCallback(() => {
    if (focusedItemId) {
      swapWithPreviousFn(focusedItemId);
    }
  }, [focusedItemId, swapWithPreviousFn]);

  return (
    <>
      <h1 className="font-bold my-5">{title}</h1>
      <OutlineList
        items={itemList}
        itemRefs={itemRefs} // Pass refs object
        registerItemRef={registerItemRef} // Pass ref registration function
        focusedItemId={focusedItemId} // Pass focused ID
        onUpdateText={updateItemFn}
        onToggleExpansion={toggleItemExpansion}
        onAddItemAfter={addItemFn}
        onDeleteItem={deleteItemFn}
        onIndentItem={indentItemFn}
        onOutdentItem={outdentItemFn}
        onMoveFocus={moveFocus} // Pass focus function
        setFocusedItemId={setFocusedItemId} // Allow direct focus setting on click etc.
      />
      <MobileIndentControls
        onIndent={handleMobileIndent}
        onOutdent={handleMobileOutdent}
        onSwapUp={handleMobileSwapUp}
        disabled={!focusedItemId}
      />
    </>
  );
}
export default OutlineEditor;
