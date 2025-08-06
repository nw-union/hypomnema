import OutlineEditor from "../components/OutlineEditor.tsx";
import type { Item } from "../../domain/item";
import { newItem } from "../../domain/logic";
import { getItemsFromKV } from "../services/kv.server.ts";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { v4 as uuidv4 } from "uuid";
import { getUserEmail } from "../util.server.ts";
import { useState } from "react";

interface LoaderData {
  mypageItems: Item[];
  shareItems: Item[];
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
    userId,
  };
}

export default function Index() {
  const { mypageItems, shareItems } = useLoaderData<LoaderData>();
  const [activeTab, setActiveTab] = useState<"mypage" | "share">("mypage");

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
