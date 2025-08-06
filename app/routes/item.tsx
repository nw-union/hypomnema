import { useEffect } from "react";
import {
  type LoaderFunctionArgs,
  Link,
  useLoaderData,
  useNavigate,
  useParams,
} from "react-router";
import type { Item } from "../../domain/item";
import { v4 as uuidv4 } from "uuid";
import { find, newItem } from "../../domain/logic";
import OutlineEditor from "../components/OutlineEditor";
import { getItemsFromKV } from "../services/kv.server";
import { getUserEmail } from "../util.server";

interface LoaderData {
  item: Item | null;
}

export async function loader({
  context,
  request,
  params,
}: LoaderFunctionArgs): Promise<LoaderData> {
  const itemId = params.id;

  const env = context.cloudflare.env;

  // ユーザー ID を取得
  const useridres = await getUserEmail(env, request);
  if (useridres.isErr()) {
    throw new Response("Unauthorized", { status: 401 });
  }
  const userId = useridres.value;

  // KV からアイテムを取得、なければ 初期値を入れる
  const itemsResult = await getItemsFromKV(env.ITEMS_KV, userId);
  if (itemsResult.isErr()) {
    throw new Response("Failed to load items", { status: 500 });
  }

  let items = itemsResult.value;
  if (items.length === 0) {
    items = [newItem(uuidv4())];
  }

  // itemId が指定されていない場合は null を返す
  if (!itemId) {
    return { item: null }; // FIXME
  }

  // mockItemList からアイテムを検索
  const res = find(items, itemId);
  if (res.isErr()) {
    // アイテムが見つからない場合は null を返す
    return { item: null };
  }

  let item = res.value;
  // children が空の配列の場合のみ newItem を追加
  if (item.children.length === 0) {
    item = {
      ...item,
      children: [newItem(uuidv4())],
    };
  }

  return {
    item,
  };
}

export default function ItemPage() {
  const { item } = useLoaderData<LoaderData>();
  const params = useParams();
  const navigate = useNavigate();

  // パラメータが変更されたときにページをリロード
  useEffect(() => {
    // 現在のitemIdとURLのitemIdが異なる場合、ページをリロード
    if (item && params.id && item.id !== params.id) {
      navigate(0); // 現在のルートをリロード
    }
  }, [params.id, item, navigate]);

  if (!item) {
    return (
      <div className="max-w-3xl mx-auto py-4 px-8">
        <h1 className="text-2xl font-bold mb-4">アイテムが見つかりません</h1>
        <p className="text-gray-600">指定されたIDのアイテムが存在しません。</p>
        <Link
          to="/"
          className="text-blue-500 hover:text-blue-700 mt-4 inline-block"
        >
          トップに戻る
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
        ← トップに戻る
      </Link>
      <h1 className="text-lg font-bold my-6 break-all">{item.text}</h1>
      <OutlineEditor id={item.id} items={item.children} type="mypage" />
    </div>
  );
}
