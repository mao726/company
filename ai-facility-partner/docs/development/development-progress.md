# 開発進捗

実装状況は正直に記載する。画面だけ・ダミーデータ表示だけのものは「完成」としない。

状態の定義：未着手／設計中／実装中／検証中／完成（テスト合格＋検証環境で動作確認済み）

## フェーズ別

| フェーズ | 状態 | 更新日 | 備考 |
|---|---|---|---|
| PHASE 0 既存環境の調査 | 報告済み | 2026-11-17 | `phase0-report.md`。質問 Q1〜Q6 は未回答 |
| PHASE 1 基盤設計 | **設計完了・承認待ち** | 2026-11-17 | 文書一式。Q1〜Q6 は仮定で設計（`../README.md`） |
| PHASE 2 MVP実装 | 未着手 | — | PHASE 1 承認後 |
| PHASE 3 管理機能 | 未着手 | — | |
| PHASE 4 AI機能 | 未着手 | — | |
| PHASE 5 実証・改善 | 未着手 | — | |
| PHASE 6 SaaS化 | 未着手 | — | |
| PHASE 7 拡張 | 未着手 | — | |

## PHASE 1 の成果物

| 区分 | 文書 | 状態 |
|---|---|---|
| business | business-model.md、target-market.md、pricing-strategy.md | 初版（数値・価格は仮説） |
| architecture | system-architecture.md（API設計を含む）、database-design.md（マルチテナント設計を含む）、permission-design.md、security-design.md、ai-architecture.md、integration-design.md | 初版・設計レビュー済み |
| product | product-roadmap.md、module-specifications.md、user-flows.md、screen-design.md | 初版 |
| development | technical-decisions.md、test-strategy.md、deployment-guide.md（草案）、operation-guide.md（草案）、development-progress.md | 初版 |

## 必須テスト（指示書第13章）

| No | テスト | 実施フェーズ | 状態 |
|---|---|---|---|
| 1 | 法人Aの職員が法人Bのデータを見られない | 2a | 未着手（方法は test-strategy.md で定義済み） |
| 2 | 施設Aの一般職員が施設Bの情報を閲覧できない | 2a | 未着手 |
| 3 | 承認権限のない一般職員は承認できない | 2a | 未着手 |
| 4 | 期限超過の業務が正しく表示される | 2b | 未着手 |
| 5 | 繰り返し業務が二重生成されない | 2b | 未着手 |
| 6 | 提出期限の通知が正しいタイミングで送られる | 2b〜3 | 未着手 |
| 7 | 承認・差し戻しの履歴が残る | 2b | 未着手 |
| 8 | ファイルのアクセス制限が機能する | 2a〜2b | 未着手 |
| 9 | AIが存在しない情報を回答した場合に検知・確認できる | 4 | 未着手 |
| 10 | バックアップから復旧できる | 3 | 未着手 |
| 11 | スマートフォンで主要操作ができる | 2b | 未着手 |
| 12 | 施設数・職員数が増えても整合性が保たれる | 2a〜3 | 未着手 |

## 履歴

| 日付 | 内容 |
|---|---|
| 2026-11-09 | 旧設計書 v0.1 作成（`../archive/mvp-design-v0.1.md`） |
| 2026-11-09 | 開発環境の起動時スクリプトの誤記を修正 |
| 2026-11-17 | 開発指示書（2026-11版）を受領。PHASE 0 報告を作成、v0.1 を旧版に移動 |
| 2026-11-17 | PHASE 1 設計文書一式を作成。設計レビューで12件の問題を修正（technical-decisions.md） |
