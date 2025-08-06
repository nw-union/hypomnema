import OutlineEditor from "../components/OutlineEditor.tsx";
import type { Item } from "../../domain/item";
import { newItem, find } from "../../domain/logic";
import { getItemsFromKV } from "../services/kv.server.ts";
import type { LoaderFunctionArgs } from "react-router";
import {
  useLoaderData,
  Link,
  useSearchParams,
  useNavigate,
} from "react-router";
import { v4 as uuidv4 } from "uuid";
import { getUserEmail } from "../util.server.ts";
import { useState, useEffect } from "react";

interface LoaderData {
  mypageItems: Item[];
  shareItems: Item[];
  userId: string;
  mode?: "mypage" | "share";
  itemId?: string;
  detailItem?: Item | null;
}

export async function loader({
  context,
  request,
}: LoaderFunctionArgs): Promise<LoaderData> {
  const env = context.cloudflare.env;
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") as "mypage" | "share" | null;
  const itemId = url.searchParams.get("id");

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

  let detailItem: Item | null = null;

  // 詳細表示モードの場合、対象アイテムを検索
  if (mode && itemId) {
    const targetItems = mode === "mypage" ? mypageItems : shareItems;
    const res = find(targetItems, itemId);
    if (res.isOk()) {
      let item = res.value;
      // children が空の配列の場合のみ newItem を追加
      if (item.children.length === 0) {
        item = {
          ...item,
          children: [newItem(uuidv4())],
        };
      }
      detailItem = item;
    }
  }

  return {
    mypageItems,
    shareItems,
    userId,
    mode: mode || undefined,
    itemId: itemId || undefined,
    detailItem,
  };
}

export default function Index() {
  const { mypageItems, shareItems, mode, itemId, detailItem } =
    useLoaderData<LoaderData>();
  const [_searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"mypage" | "share">("mypage");

  // URL パラメータが変更されたときの処理
  useEffect(() => {
    if (detailItem && itemId && detailItem.id !== itemId) {
      navigate(0); // 現在のルートをリロード
    }
  }, [itemId, detailItem, navigate]);

  // 詳細表示モードの場合
  if (mode && itemId) {
    if (!detailItem) {
      return (
        <div className="max-w-3xl mx-auto py-4 px-8">
          <h1 className="text-2xl font-bold mb-4">アイテムが見つかりません</h1>
          <p className="text-gray-600">
            指定されたIDのアイテムが存在しません。
          </p>
          <Link
            to="/"
            className="text-blue-500 hover:text-blue-700 mt-4 inline-block"
          >
            {mode === "share" ? "共有ページに戻る" : "トップに戻る"}
          </Link>
        </div>
      );
    }

    return (
      <div className="max-w-3xl mx-auto pt-4 pb-28 px-8">
        <Link
          to="/"
          className="text-xs text-blue-500 hover:text-blue-700 mt-4 inline-block"
        >
          ← {mode === "share" ? "共有ページに戻る" : "トップに戻る"}
        </Link>
        <h1 className="text-lg font-bold my-6 break-all">{detailItem.text}</h1>
        <OutlineEditor
          id={detailItem.id}
          items={detailItem.children}
          type={mode}
        />
      </div>
    );
  }

  // 通常のホーム表示モード
  const tabs = [
    { name: "my page", key: "mypage" as const },
    { name: "share", key: "share" as const },
  ];

  return (
    <div className="max-w-3xl mx-auto pt-4 pb-28 px-8">
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;

            return (
              <button
                type="button"
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
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

      {activeTab === "mypage" && (
        <OutlineEditor id="root" items={mypageItems} type="mypage" />
      )}
      {activeTab === "share" && (
        <OutlineEditor id="root" items={shareItems} type="share" />
      )}
    </div>
  );
}
