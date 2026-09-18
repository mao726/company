# X(Twitter) 自動投稿 セットアップ

## 状態
準備中。APIキー未取得のため未稼働。

## 必要なもの(人間が取得)
developer.x.com でアプリを作成し、以下4つを取得:
- X_API_KEY
- X_API_KEY_SECRET
- X_ACCESS_TOKEN
- X_ACCESS_TOKEN_SECRET

権限は必ず「Read and Write」に設定してからAccess Tokenを発行すること。

## 取得後の流れ
1. このフォルダに `.env` ファイルを作成し、`.env.example` と同じ形式でキーを記入する(`.env` は `.gitignore` 済みなのでGitには含まれない)
2. `post.py` を使って投稿する(未作成。キー受領後に作成)

## 運用ポリシー(合意事項)
- 頻度: 1日1回程度を上限とする(スパム防止)
- 内容: note記事の紹介、SNS運用に関する実用的な小ネタなど。誇張・虚偽・実績の捏造はしない
- 投稿前に内容をこのリポジトリ(automation/sns_x/queue/ 等)に記録し、事後確認できるようにする
- 苦情・エラー・アカウント制限等が発生した場合は即停止し、LESSONS.mdに記録する
