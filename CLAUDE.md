# CLAUDE.md

このファイルは、このリポジトリでコードを扱う際の Claude Code (claude.ai/code) へのガイダンスを提供します。

## Communication Rules

- すべての応答は日本語で行うこと
- コードやコマンドは英語のままで構わないが、説明は日本語で行うこと

## Git Commit Rules

- すべてのコミットメッセージは日本語で記述すること
- コミットメッセージは Conventional Commits に従うこと
- コミットの前に、`bun run check` を実行すること

## Pull Request Rules

- [組織のテンプレート](https://raw.githubusercontent.com/nw-union/.github/refs/heads/main/.github/pull_request_template.md) に従うこと
- すべてのセクションを適切に記入すること


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

### 開発時の重要ポイント

- 新しい操作を追加する場合は `domain/logic.ts` に純粋関数として実装
- テストは `bun test` で実行（主要な操作関数のテストは `domain/logic.test.ts` に実装済み）
- モバイル対応は `MobileIndentControls` コンポーネントで実装済み
- ジェネレータ関数を活用した効率的なツリー走査の実装

