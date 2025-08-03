# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Communication Rules
- すべての応答は日本語で行うこと
- コードやコマンドは英語のままで構わないが、説明は日本語で行うこと


### Tech Stack
- **Frontend**: React 19, React Router v7
- **Runtime**: Cloudflare Workers (Edge environment)
- **Storage**: Cloudflare KV Namespace
- **Build Tools**: Vite, Wrangler, Bun
- **Styling**: Tailwind CSS v4
- **Code Quality**: Biome (formatter/linter), TypeScript

## Architecture

### Directory Structure
```
app/
├── components/     # Reactコンポーネント
│   ├── OutlineEditor.tsx    # メインエディタコンポーネント
│   ├── OutlineList.tsx      # アイテムリスト表示
│   ├── OutlineItem.tsx      # 個別アイテムコンポーネント
│   └── MobileIndentControls.tsx # モバイル用インデント操作
├── routes/         # React Routerのルート定義
│   ├── home.tsx    # ルートレベルのアウトライン
│   ├── item.tsx    # 個別アイテムの詳細画面
│   └── update.ts   # アイテム更新API
├── services/       # 外部サービスとの通信層
│   └── kv.server.ts # Cloudflare KVとの通信
├── entry.server.tsx # サーバーサイドエントリーポイント
├── root.tsx        # アプリケーションルート
└── routes.ts       # ルート定義

domain/             # ドメインロジック (app外に配置)
├── item.ts         # Item型の定義
├── logic.ts        # ビジネスロジック (純粋関数)
└── logic.test.ts   # ロジックのテスト
```

### Key Concepts
- **Item型**: 再帰的なツリー構造で、各アイテムは `id`, `symbol`, `text`, `children[]`, `isExpanded` を持つ
- **純粋関数**: すべての操作は `domain/logic.ts` 内で純粋関数として実装され、不変性を保つ
- **SSR**: React Router v7 と Cloudflare Workers でサーバーサイドレンダリング
- **データ永続化**: Cloudflare KV に `items:{userId}` の形式で保存（現在はuserIdは"default"固定）
- **エラーハンドリング**: neverthrow を使用したResult型でエラーを型安全に扱う

### 開発時の重要ポイント
- 新しい操作を追加する場合は `domain/logic.ts` に純粋関数として実装
- テストは `bun test` で実行（主要な操作関数のテストは `domain/logic.test.ts` に実装済み）
- モバイル対応は `MobileIndentControls` コンポーネントで実装済み
- ジェネレータ関数を活用した効率的なツリー走査の実装

## Git Commit Rules
- すべてのコミットメッセージは日本語で記述すること
- コミットメッセージは Conventional Commits に従うこと
- コミットの前に、`bun run check` を実行すること

## Pull Request Rules
- PR を作成する際は、`.github/pull_request_template.md` のテンプレートに従うこと
- すべてのセクションを適切に記入すること

## Commands

### Setup
- `bun install` - 依存パッケージをインストール（初回セットアップ時のみ必要）

### Development
- `bun run dev` - 開発サーバーをHMR付きで起動 (http://localhost:5173)
- `bun run build` - プロダクション用ビルド
- `bun run start` - wrangler dev で起動

### Testing
- `bun test` - すべてのテストを実行
- `bun test <file>` - 特定のテストファイルを実行

### Code Quality
- `bun run fmt` - Biome でコードフォーマット
- `bun run lint` - Biome でリントチェック
- `bun run typecheck` - TypeScript で型チェック
- `bun run check` - フォーマット、リント、型チェックをすべて実行

