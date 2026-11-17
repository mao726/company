# AI施設運営パートナー 設計文書

介護施設（初期：特別養護老人ホーム）の施設運営業務を一元管理するSaaSの設計文書。

## 状態

- PHASE 0：報告済み（`development/phase0-report.md`）
- PHASE 1：基盤設計 **要修正**（レビュー結果：`development/design-review-2026-11-17.md`）
- 実装：未着手

## 未回答の前提（仮定で設計している事項）

PHASE 0 の質問 Q1〜Q6 は未回答のため、推奨案を「仮定」として設計した。回答により変わる箇所は各文書で **【仮定 Qn】** と表記している。

| No | 質問 | 設計上の仮定 |
|---|---|---|
| Q1 | リポジトリ | 当面 `mao726/company` の `ai-facility-partner/` で開発。専用リポジトリができれば移す |
| Q2 | データの置き場所・予算 | データは国内のみ。実証は Supabase（東京）＋ Vercel（東京実行）、本番前に再判断 |
| Q3 | 実証施設 | 未定。業務内容は架空データで設計し、ヒアリング後に修正 |
| Q4 | AI事業者・送信範囲 | 初期は Claude API。職員氏名はAIに送らず、内部の仮名に置き換える |
| Q5 | 体制 | 開発は Claude Code。コードレビュー・運用担当者は未定 |
| Q6 | 法人本部 | データ構造・権限は最初から対応、法人本部画面は PHASE 7 |

## 文書一覧

| 区分 | 文書 | 内容 |
|---|---|---|
| business | [business-model.md](business/business-model.md) | 事業モデル |
| | [target-market.md](business/target-market.md) | 対象市場 |
| | [pricing-strategy.md](business/pricing-strategy.md) | 料金戦略（仮説） |
| architecture | [system-architecture.md](architecture/system-architecture.md) | 全体構成・モジュール・API設計 |
| | [database-design.md](architecture/database-design.md) | データベース設計・マルチテナント |
| | [permission-design.md](architecture/permission-design.md) | 役割・権限 |
| | [security-design.md](architecture/security-design.md) | セキュリティ・個人情報保護 |
| | [ai-architecture.md](architecture/ai-architecture.md) | AI接続層 |
| | [integration-design.md](architecture/integration-design.md) | 外部連携・CSV |
| product | [product-roadmap.md](product/product-roadmap.md) | ロードマップ |
| | [module-specifications.md](product/module-specifications.md) | モジュール仕様 |
| | [user-flows.md](product/user-flows.md) | 業務の流れ |
| | [screen-design.md](product/screen-design.md) | 画面設計 |
| development | [development-progress.md](development/development-progress.md) | 進捗 |
| | [technical-decisions.md](development/technical-decisions.md) | 判断記録 |
| | [test-strategy.md](development/test-strategy.md) | テスト戦略 |
| | [deployment-guide.md](development/deployment-guide.md) | 環境構築・デプロイ |
| | [operation-guide.md](development/operation-guide.md) | 運用 |

## 変更ルール

- 仕様変更時はコードと関連文書を同時に更新する
- 重要な設計変更は `development/technical-decisions.md` に理由と影響範囲を記録する
