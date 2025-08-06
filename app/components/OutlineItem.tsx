import type React from "react";
import { useEffect, useRef } from "react";
import type { Item } from "../../domain/item";
import { hasChildren } from "../../domain/logic";
import OutlineList from "./OutlineList";
import { Link } from "react-router";

// Propsの型を指定
interface OutlineItemProps {
  item: Item;
  level: number;
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
}

function OutlineItem({
  item,
  level,
  itemRefs,
  registerItemRef,
  focusedItemId,
  onUpdateText,
  onToggleExpansion,
  onAddItemAfter,
  onDeleteItem,
  onIndentItem,
  onOutdentItem,
  onMoveFocus,
  setFocusedItemId,
  type = "mypage",
}: OutlineItemProps) {
  // Refの型を指定
  const contentRef = useRef<HTMLDivElement>(null);

  // Register ref with HomePage
  useEffect(() => {
    if (contentRef.current) {
      registerItemRef(item.id, contentRef.current);
    }
    // Cleanup function to unregister ref when component unmounts
    return () => {
      registerItemRef(item.id, null);
    };
  }, [item.id, registerItemRef]);

  // KeyboardEventの型を指定
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // Check for IME composition
    // isComposingはネイティブイベントのプロパティ
    if (event.nativeEvent.isComposing || event.key === "Process") {
      return;
    }

    // Cast the event target to HTMLDivElement
    const target = event.target as HTMLDivElement;
    const innerText = target.innerText;

    switch (event.key) {
      case "Enter":
        if (!event.shiftKey) {
          event.preventDefault();
          onAddItemAfter(item.id);
        }
        // Allow Shift+Enter for line breaks within the contentEditable if needed
        break;

      case "Tab":
        if (event.shiftKey) {
          event.preventDefault();
          onUpdateText(item.id, innerText);
          onOutdentItem(item.id);
        } else {
          event.preventDefault();
          onUpdateText(item.id, innerText);
          onIndentItem(item.id);
        }
        break;

      case "Backspace": {
        // Delete only if item is empty and cursor is at the beginning
        // targetをHTMLDivElementにキャスト
        // const targetBackspace = event.target as HTMLDivElement;
        const selectionStart = window
          .getSelection()
          ?.getRangeAt(0)?.startOffset;
        if (innerText === "" && selectionStart === 0) {
          event.preventDefault();
          onDeleteItem(item.id);
        }
        break;
      }

      case "Delete":
        // Delete only if item is empty
        if (innerText === "") {
          event.preventDefault();
          onDeleteItem(item.id);
        }
        break;

      case "ArrowUp":
        event.preventDefault();
        onMoveFocus(item.id, "up");
        break;

      case "ArrowDown":
        event.preventDefault();
        onMoveFocus(item.id, "down");
        break;

      default:
        break;
    }
  };

  // FocusEventの型を指定
  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    // Update text only if it actually changed
    if (event.target.innerText !== item.text) {
      onUpdateText(item.id, event.target.innerText);
    }
  };
  // const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   // Update text on change
  //   onUpdateText(item.id, event.target.value);
  // };

  const handleFocus = () => {
    // When an item receives focus naturally (e.g., click), update the focusedItemId state
    if (focusedItemId !== item.id) {
      setFocusedItemId(item.id);
    }
  };

  // MouseEventの型を指定
  const handleToggleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Prevent focus shifts if button is clicked
    e.stopPropagation();
    // childrenの存在チェックを改善
    if (hasChildren(item)) {
      onToggleExpansion(item.id);
    }
  };

  // childrenの存在チェックを改善
  // const hasChildren = !!(item.children && item.children.items.length > 0);

  return (
    <li
      className={`relative list-none ${item.isExpanded ? "expanded" : hasChildren(item) ? "collapsed" : ""}`}
    >
      {/* Add data-id for easier debugging/testing */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: contentEditable makes this interactive */}
      <div
        ref={contentRef}
        className="inline-block min-w-48 max-w-full px-1 py-0.5 mb-1 cursor-text border-b border-transparent focus:outline-none break-all"
        contentEditable={true}
        suppressContentEditableWarning={true} // Suppress React warning for contentEditable
        onKeyDown={handleKeyDown}
        onBlur={handleBlur} // Update on blur
        onFocus={handleFocus} // Set focus state on click/natural focus
      >
        {item.text}
      </div>
      {/* Render button conditionally based on children */}
      {/* Use a visually hidden span for screen readers when empty */}
      <button
        type="button"
        className="absolute -left-10 top-0.5 w-6 h-6 p-0 m-0 -mx-2 border-none bg-white cursor-pointer text-xs leading-3 text-center text-gray-300 select-none hover:text-gray-600 empty:invisible"
        onClick={handleToggleClick}
        aria-expanded={hasChildren(item) ? item.isExpanded : undefined}
        aria-label={
          hasChildren(item)
            ? item.isExpanded
              ? "Collapse item"
              : "Expand item"
            : "Item has no children" // aria-labelは常に提供するのが良い
        }
        tabIndex={-1} // Prevent tabbing to the button itself
        // disabled={!hasChildren} // hasChildrenがない場合は非活性化する方が明確かも
      >
        {hasChildren(item) ? (
          item.isExpanded ? (
            "▼"
          ) : (
            "▶︎"
          )
        ) : (
          // 空でもボタンのスペースを確保したい場合、または完全に消したい場合がある
          // visibility: hidden よりは条件レンダリングの方が良いかもしれない
          // 例: {hasChildren && (item.isExpanded ? "▼" : "▶︎")}
          // もし常にボタンを表示するなら以下
          <span style={{ visibility: "hidden", pointerEvents: "none" }}>•</span> // ダミーコンテンツでスペース確保、クリック不可に
        )}
      </button>
      <Link
        to={`/?mode=${type}&id=${item.id}`}
        className="absolute -left-3 top-0.5 w-6 h-6 p-0 m-0 -mx-2 border-none bg-white cursor-pointer text-xs leading-3 text-center text-gray-600 select-none hover:bg-gray-300 empty:invisible inline-flex items-center justify-center"
        aria-label="Navigate to item"
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 18 18"
          fill="currentColor"
          className="zoomBulletIcon _uhlm2"
        >
          <title>Navigate to item</title>
          <circle cx="9" cy="9" r="3.5"></circle>
        </svg>
      </Link>
      {/* Recursively render children if expanded */}
      {/* childrenの存在チェックを改善 */}
      {hasChildren(item) && (
        <div className={item.isExpanded ? "" : "hidden"}>
          <OutlineList
            items={item.children}
            level={level + 1}
            // Pass all other props down for children
            itemRefs={itemRefs}
            registerItemRef={registerItemRef}
            focusedItemId={focusedItemId}
            onUpdateText={onUpdateText}
            onToggleExpansion={onToggleExpansion}
            onAddItemAfter={onAddItemAfter}
            onDeleteItem={onDeleteItem}
            onIndentItem={onIndentItem}
            onOutdentItem={onOutdentItem}
            onMoveFocus={onMoveFocus}
            setFocusedItemId={setFocusedItemId}
            type={type}
          />
        </div>
      )}
    </li>
  );
}

export default OutlineItem;
