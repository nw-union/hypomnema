import type { Item } from "../../domain/item";
import {
  newItem,
  find,
  updateText,
  toggleExpanded,
  addItem,
  findPrevIdForDelete,
  deleteItem,
  indentItem,
  outdentItem,
  findPrevId,
  findNextId,
  swapWithPrevious,
} from "../../domain/logic";
import { getItemsFromKV } from "../services/kv.server.ts";
import type { LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { v4 as uuidv4 } from "uuid";
import { getUserEmail } from "../util.server.ts";
import { useCallback, useEffect, useRef, useState } from "react";
import OutlineList from "../components/OutlineList.tsx";
import MobileIndentControls from "../components/MobileIndentControls.tsx";

interface LoaderData {
  mypageItems: Item[];
  shareItems: Item[];
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

  // マイページのアイテムを取得
  const mypageItemsResult = await getItemsFromKV(env.ITEMS_KV, userId);
  if (mypageItemsResult.isErr()) {
    throw new Response("Failed to load mypage items", { status: 500 });
  }

  let mypageItems = mypageItemsResult.value;
  if (mypageItems.length === 0) {
    mypageItems = [newItem(uuidv4())];
  }

  // 共有アイテムを取得
  const shareItemsResult = await getItemsFromKV(env.ITEMS_KV, "share");
  if (shareItemsResult.isErr()) {
    throw new Response("Failed to load share items", { status: 500 });
  }

  let shareItems = shareItemsResult.value;
  if (shareItems.length === 0) {
    shareItems = [newItem(uuidv4())];
  }

  return {
    mypageItems,
    shareItems,
  };
}

export default function Index() {
  const { mypageItems, shareItems } = useLoaderData<LoaderData>();

  const [mode, setMode] = useState<"mypage" | "share">("share");
  const [itemId, setItemId] = useState<string>("root");

  const [title, setTitle] = useState<string>("");
  const [itemList, setItemList] = useState<Item[]>(shareItems);

  // アイテムをクリックしたときの処理
  const handleItemClick = (
    clickedItemId: string,
    clickedMode: "mypage" | "share",
  ) => {
    setMode(clickedMode);
    setItemId(clickedItemId);

    const targetItems = clickedMode === "mypage" ? mypageItems : shareItems;
    const res = find(targetItems, clickedItemId);

    if (res.isOk()) {
      let item = res.value;
      if (item.children.length === 0) {
        item = {
          ...item,
          children: [newItem(uuidv4())],
        };
      }
      // setDetailItem(item);
      setTitle(item.text);
      setItemList(item.children);
    }
  };

  // 戻るボタンの処理
  const handleBack = () => {
    // setMode(null);
    setItemId("root");
    setTitle("");
    if (mode === "mypage") {
      setItemList(mypageItems);
    } else {
      setItemList(shareItems);
    }
  };

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
            action: `/update/${mode}/${itemId}`,
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

  // 通常のホーム表示モード
  const tabs = [
    { name: "share", key: "share" as const },
    { name: "my page", key: "mypage" as const },
  ];

  return (
    <div className="max-w-3xl mx-auto pt-4 pb-28 px-8">
      {itemId === "root" && (
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const isActive = mode === tab.key;

              return (
                <button
                  type="button"
                  key={tab.key}
                  onClick={() => {
                    setMode(tab.key);
                    // タブ切り替え時にitemListも切り替える
                    if (itemId === "root") {
                      const targetItems =
                        tab.key === "mypage" ? mypageItems : shareItems;
                      setItemList(targetItems);
                    }
                  }}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    isActive
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {itemId !== "root" && (
        <button
          type="button"
          onClick={handleBack}
          className="text-xs text-blue-500 hover:text-blue-700 mt-4 inline-block"
        >
          ← 戻る
        </button>
      )}
      <h1 className="text-lg font-bold my-6 break-all">{title}</h1>
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
        type={mode}
        onItemClick={handleItemClick}
      />
      <MobileIndentControls
        onIndent={handleMobileIndent}
        onOutdent={handleMobileOutdent}
        onSwapUp={handleMobileSwapUp}
        disabled={!focusedItemId}
      />
    </div>
  );
}
