# わりかん（Warikan）

飲み会・旅行の割り勘をさっと計算する PWA。**無料・広告なし・ログイン不要・通信なし・オフライン対応。**

## できること

- 合計金額と人数を入れるだけで 1人あたりの金額を表示
- チップ・サービス料（0/5/10/15/20% またはその他）
- 端数処理：1円／10円／100円単位で 切り上げ・切り捨て・四捨五入。集まる金額と差額（おつり／不足）も表示
- 傾斜をつける：人ごとに負担割合（×0.5〜×3）と名前を設定
- 結果を LINE に貼れるテキストでコピー、または共有
- 通貨：日本円（既定）のほか USD / EUR / GBP / KRW / TWD / CNY / THB / AUD
- 表示言語：日本語 / English

入力内容はこの端末の localStorage にだけ保存されます。

## English

**Warikan** splits a bill in seconds: amount, number of people, optional tip percentage, rounding to 1/10/100 yen (up, down or nearest) with the surplus/shortfall shown, and an optional uneven split where some people pay more (per-person weights and names). Copy the result as plain text for LINE or share it. Yen by default, with other currencies available. Japanese UI by default with an English toggle. Free, no ads, no login, no network; works offline.

## 開発 / Development

```bash
npm install
npm run dev      # 開発サーバー / dev server
npm run build    # 型チェック + ビルド → dist/ / type-check + build
npm run preview  # ビルドの確認 / preview the build
```

Vite + vanilla TypeScript + vite-plugin-pwa（`registerType: 'autoUpdate'`, `base: './'`）。`main` ブランチに push すると `.github/workflows/pages.yml` で GitHub Pages に公開されます。 / Pushing to `main` deploys to GitHub Pages via `.github/workflows/pages.yml`.
