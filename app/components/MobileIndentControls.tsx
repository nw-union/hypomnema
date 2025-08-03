import { useEffect, useState } from "react";

interface MobileIndentControlsProps {
  onIndent: () => void;
  onOutdent: () => void;
  onSwapUp: () => void;
  disabled?: boolean;
}

function MobileIndentControls({
  onIndent,
  onOutdent,
  onSwapUp,
  disabled = false,
}: MobileIndentControlsProps) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    // ビューポートの高さ変化を監視してキーボード表示を検知
    const handleViewportChange = () => {
      // visualViewport APIを使用（iOS Safariでサポート）
      if (window.visualViewport) {
        const viewport = window.visualViewport;
        const hasKeyboard = viewport.height < window.innerHeight;
        setIsKeyboardVisible(hasKeyboard);

        if (hasKeyboard) {
          // キーボードの高さを計算
          const keyboardHeight = window.innerHeight - viewport.height;
          setKeyboardHeight(keyboardHeight);
        } else {
          setKeyboardHeight(0);
        }
      }
    };

    // イベントリスナーを追加
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleViewportChange);
      window.visualViewport.addEventListener("scroll", handleViewportChange);
      // 初回チェック
      handleViewportChange();
    }

    // クリーンアップ
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener(
          "resize",
          handleViewportChange,
        );
        window.visualViewport.removeEventListener(
          "scroll",
          handleViewportChange,
        );
      }
    };
  }, []);
  // ボタンの位置を計算
  const bottomPosition = isKeyboardVisible ? keyboardHeight + 16 : 16; // 16pxはマージン

  return (
    <div
      className="fixed right-4 flex gap-2 bg-white rounded-lg p-2 border border-gray-200 md:hidden transition-all duration-300 ease-out"
      style={{ bottom: `${bottomPosition}px` }}
    >
      <button
        type="button"
        className="w-10 h-10 flex items-center justify-center border border-gray-300 bg-white cursor-pointer text-base rounded text-gray-600 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={onSwapUp}
        aria-label="上に移動"
        disabled={disabled}
      >
        ↑
      </button>
      <button
        type="button"
        className="w-10 h-10 flex items-center justify-center border border-gray-300 bg-white cursor-pointer text-base rounded text-gray-600 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={onOutdent}
        aria-label="アウトデント"
        disabled={disabled}
      >
        ←
      </button>
      <button
        type="button"
        className="w-10 h-10 flex items-center justify-center border border-gray-300 bg-white cursor-pointer text-base rounded text-gray-600 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={onIndent}
        aria-label="インデント"
        disabled={disabled}
      >
        →
      </button>
    </div>
  );
}

export default MobileIndentControls;
