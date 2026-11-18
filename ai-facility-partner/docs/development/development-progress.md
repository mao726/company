# 開発進捗

実装状況は正直に記載する。画面だけ・ダミーデータ表示だけのものは「完成」としない。

状態の定義：未着手／設計中／実装中／検証中／完成（テスト合格＋検証環境で動作確認済み）

## フェーズ別

| フェーズ | 状態 | 更新日 | 備考 |
|---|---|---|---|
| PHASE 0 既存環境の調査 | 報告済み | 2026-11-17 | `phase0-report.md`。質問 Q1〜Q6 は未回答 |
| PHASE 1 基盤設計 | **v2・承認待ち**（レビュー指摘48件のうち設計で直せるものを修正。残りは判断・専門家確認待ち） | 2026-11-17 | `design-review-2026-11-17.md` 第7章、`open-decisions.md` |
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
| architecture | system-architecture.md（API設計を含む）、database-design.md（マルチテナント設計を含む）、permission-design.md、security-design.md、ai-architecture.md、integration-design.md、subprocessors.md | v2（レビュー指摘を反映） |
| product | product-roadmap.md、module-specifications.md、user-flows.md、screen-design.md | v2 |
| development | technical-decisions.md、test-strategy.md、deployment-guide.md（草案）、operation-guide.md（草案）、development-progress.md、open-decisions.md、design-review-2026-11-17.md | v2 |

## 必須テスト（指示書第13章）

フェーズとの対応の正本は `test-strategy.md` 第4章。

| No | テスト | 主なフェーズ | 状態 |
|---|---|---|---|
| 1 | 法人Aの職員が法人Bのデータを見られない | 2a〜4（各フェーズで対象を追加） | 未着手（方法・基準は定義済み） |
| 2 | 施設Aの一般職員が施設Bの情報を閲覧できない | 2a〜4（同上） | 未着手 |
| 3 | 承認権限のない一般職員は承認できない | 2a（権限判定）〜3 | 未着手 |
| 4 | 期限超過の業務が正しく表示される | 2b-1〜2b-2 | 未着手 |
| 5 | 繰り返し業務が二重生成されない | 2b-1（完了日ベースは3） | 未着手 |
| 6 | 提出期限の通知が正しいタイミングで送られる | 2b-1〜3 | 未着手 |
| 7 | 承認・差し戻しの履歴が残る | 2b-1〜3 | 未着手 |
| 8 | ファイルのアクセス制限が機能する | 2a〜2b-2 | 未着手 |
| 9 | AIが存在しない情報を回答した場合に検知・確認できる | 4 | 未着手 |
| 10 | バックアップから復旧できる | 3 | 未着手 |
| 11 | スマートフォンで主要操作ができる | 2a〜3 | 未着手 |
| 12 | 施設数・職員数が増えても整合性が保たれる | 2b-2（初回）〜4 | 未着手 |

## 履歴

| 日付 | 内容 |
|---|---|
| 2026-11-09 | 旧設計書 v0.1 作成（`../archive/mvp-design-v0.1.md`） |
| 2026-11-09 | 開発環境の起動時スクリプトの誤記を修正 |
| 2026-11-17 | 開発指示書（2026-11版）を受領。PHASE 0 報告を作成、v0.1 を旧版に移動 |
| 2026-11-17 | PHASE 1 設計文書一式を作成。設計レビューで12件の問題を修正（technical-decisions.md） |
| 2026-11-17 | 4観点のレビュー担当エージェントで再評価。84件（統合後48件）の指摘。承認前に修正が必要と判断（design-review-2026-11-17.md） |
| 2026-11-17 | 設計 v2：レビュー指摘を修正（TD-014〜TD-050）。判断事項を open-decisions.md に、再委託先一覧を subprocessors.md に作成 |
| 2026-11-18 | 検証担当エージェントによる v2 の検証（未解消0件、一部のみ9件、修正で生じた問題19件）。すべて修正（TD-051〜TD-061） |
| 2026-11-18 | 再検証（新たな高7件など）。DB 利用者と専用関数の一覧化、共通の判定関数などで修正（TD-062〜TD-069）。この修正は未検証 |
