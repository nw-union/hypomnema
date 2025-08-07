import type React from "react";

import type { Item } from "../../domain/item";
import OutlineItem from "./OutlineItem";

// OutlineListのProps型
interface OutlineListProps {
  items: Item[];
  level?: number;
  itemRefs: React.RefObject<Record<string, HTMLDivElement | null>>;
  registerItemRef: (id: string, ref: HTMLDivElement | null) => void;
  focusedItemId: string | null;
  onUpdateText: (id: string, newText: string) => void;
  onToggleExpansion: (id: string) => void;
  onAddItemAfter: (currentItemId: string) => void;
  onDeleteItem: (idToDelete: string) => void;
  onIndentItem: (idToIndent: string) => void;
  onOutdentItem: (idToOutdent: string) => void;
  onMoveFocus: (currentItemId: string, direction: "up" | "down") => void;
  setFocusedItemId: React.Dispatch<React.SetStateAction<string>>;
  type?: "mypage" | "share";
  onItemClick?: (itemId: string, mode: "mypage" | "share") => void;
}

// Propsの型を指定、levelのデフォルト値を設定
function OutlineList({ items, level = 0, ...props }: OutlineListProps) {
  if (!items || items.length === 0) {
    return null; // Don't render empty lists
  }

  return (
    <ul className="pl-8 m-0">
      {/* Adjust padding based on level */}
      {items.map((item) => (
        <OutlineItem
          key={item.id}
          item={item}
          level={level}
          {...props} // Pass all props down
        />
      ))}
    </ul>
  );
}

export default OutlineList;
