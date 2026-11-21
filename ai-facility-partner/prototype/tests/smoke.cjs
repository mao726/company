'use strict';
/*
 * 試作品（../index.html）の動作確認
 *
 * 使い方（リポジトリの直下で）:
 *   node ai-facility-partner/prototype/tests/smoke.cjs
 *
 * - Playwright と Chromium が必要です（インターネットには接続しません）
 * - 画面の写しは環境変数 SHOT_DIR のフォルダ（未指定なら一時フォルダ）に保存します
 * - すべて試作品に入っている架空のデータで動かします
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

const FILE_URL = 'file://' + path.resolve(__dirname, '..', 'index.html');
const SHOT_DIR = process.env.SHOT_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'afp-proto-'));
fs.mkdirSync(SHOT_DIR, { recursive: true });

let passed = 0;
let failed = 0;
function check(cond, label, detail) {
  if (cond) { passed++; console.log('  ok  ' + label); }
  else { failed++; console.log('  NG  ' + label + (detail !== undefined ? '  ->  ' + JSON.stringify(detail) : '')); }
}
function section(name) { console.log('\n■ ' + name); }

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();

  const errors = [];
  const external = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + String(e)));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
  page.on('request', (r) => {
    const u = r.url();
    if (!u.startsWith('file:') && !u.startsWith('data:') && !u.startsWith('about:')) external.push(u);
  });

  const title = () => page.locator('#page-title').innerText();
  async function expectTitle(expected, label) {
    try {
      await page.waitForFunction((t) => { const h = document.getElementById('page-title'); return !!h && h.innerText === t; }, expected, { timeout: 3000 });
      check(true, label);
    } catch (e) {
      check(false, label, await title().catch(() => '(見出しなし)'));
    }
  }
  const mainText = () => page.locator('#main').innerText();
  const toastText = async () => ((await page.locator('.toast').count()) ? page.locator('.toast').first().innerText() : '');
  const shot = (name, fullPage) => page.screenshot({ path: path.join(SHOT_DIR, name), fullPage: !!fullPage });
  const store = () => page.evaluate(() => JSON.parse(localStorage.getItem('afp-prototype-v0')));
  async function switchUser(id, name) {
    await page.selectOption('[data-change="switch-user"]', id);
    await page.waitForFunction((n) => document.getElementById('app').innerText.includes(n), name);
  }
  async function localDate(offsetDays) {
    return page.evaluate((n) => {
      const d = new Date(); d.setDate(d.getDate() + n);
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }, offsetDays);
  }
  // 文字の大きさ（16px以上）と、ボタンの高さ（44px以上）を確かめる
  async function checkSizes(label) {
    const r = await page.evaluate(() => {
      const small = [];
      const lowButtons = [];
      document.querySelectorAll('body *').forEach((el) => {
        if (el.closest('.sr-only')) return;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        const hasText = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim());
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (hasText && fs < 16) small.push(el.tagName + ' ' + fs + 'px ' + el.textContent.trim().slice(0, 20));
        if (el.tagName === 'BUTTON' && rect.height < 44) lowButtons.push(el.textContent.trim().slice(0, 20) + ' ' + Math.round(rect.height) + 'px');
      });
      return { small, lowButtons };
    });
    check(r.small.length === 0, label + '：16px未満の文字がない', r.small.slice(0, 5));
    check(r.lowButtons.length === 0, label + '：高さ44px未満のボタンがない', r.lowButtons.slice(0, 5));
  }

  // 1. 施設長のダッシュボード ------------------------------------------
  section('1. 施設長（高木）のダッシュボード');
  await page.goto(FILE_URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expectTitle('施設の状況', '最初は施設長のダッシュボードが開く');
  check((await page.locator('#proto-bar').innerText()).includes('架空のデータです'), '「試作品・架空のデータ」の表示がある');
  const cards = page.locator('.stat-card');
  check((await cards.nth(0).locator('.stat-num').innerText()) === '2', '期限超過は2件（毎日のチェックリストは数えない）', await cards.nth(0).innerText());
  check((await cards.nth(0).innerText()).includes('うち保留中 1件'), '期限超過のうち保留中が分かる');
  check((await cards.nth(1).locator('.stat-num').innerText()) === '5', '承認待ちは施設全体で5件', await cards.nth(1).innerText());
  check((await cards.nth(1).innerText()).includes('あなた宛て 0件'), 'あなた宛ての承認待ちは0件');
  check((await cards.nth(3).locator('.stat-num').innerText()) === '2', '担当者未設定は2件');
  const checksText = await page.locator('#h-checks').locator('xpath=..').innerText();
  check(checksText.includes('AI ではありません'), '自動チェックはAIではないと明記');
  check(checksText.includes('根拠が「未確認」の行政提出'), '自動チェック：根拠が未確認の行政提出');
  check(checksText.includes('休職中・退職した職員が担当の業務'), '自動チェック：休職中の職員が担当');
  check(checksText.includes('通知が届かない人が 3名'), '自動チェック：督促しても未提出・通知が届かない人が3名', checksText);
  check((await mainText()).includes('あなたのやること'), '施設長にも「あなたのやること」がある');
  await shot('01-dashboard-1280.png', true);
  await checkSizes('ダッシュボード');

  await page.locator('.main-nav a[href="#/approvals"]').click();
  await expectTitle('承認待ち（0件）', '施設長あての承認待ちは0件');
  check((await mainText()).includes('ほかの人が確認する件（5件）'), '止まっている件を見るための一覧（5件）がある');

  // 2. 職員（山田）のホーム：スマホの幅 --------------------------------
  section('2. 職員（山田）の「今日のやること」 390px');
  await page.setViewportSize({ width: 390, height: 844 });
  await switchUser('s-yamada', '山田 花子');
  await expectTitle('今日のやること（7件）', '山田さんのホームは「今日のやること（7件）」');
  let home = await mainText();
  check(home.indexOf('差し戻し') >= 0 && home.indexOf('差し戻し') < home.indexOf('今日まで'), '差し戻しが「今日まで」より上に出る');
  check(home.includes('受診日がちがうようです'), '差し戻しの理由がそのまま見える');
  check(home.includes('新しい依頼'), '新しい依頼が出る');
  check(home.includes('今日のチェックリスト'), '今日のチェックリストが出る');
  check(!(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)), '390px幅で横にはみ出さない');
  await shot('02-staff-home-390.png', true);
  await checkSizes('職員ホーム');

  await page.getByRole('button', { name: '居室の温度・湿度の確認を完了にする' }).click();
  check((await toastText()).includes('居室の温度・湿度の確認を完了にしました'), 'チェックリストは1タップで完了');
  await expectTitle('今日のやること（6件）', '残りの件数が減る');

  // 3. 書類の提出（1画面に1つ） ----------------------------------------
  section('3. 研修レポートの提出（写真・ファイル）');
  await page.getByRole('link', { name: '提出する', exact: true }).click();
  await expectTitle('感染症の研修レポートを提出する', '1画面目：何を出すか');
  await page.getByRole('button', { name: '次へ' }).click();
  await expectTitle('書類の写真を撮ってください', '2画面目：写真を撮る・ファイルを選ぶ');
  await shot('03-submit-step2-390.png');
  await page.locator('input[type=file][data-flow]').nth(1).setInputFiles({ name: 'kenshu-report.jpg', mimeType: 'image/jpeg', buffer: Buffer.from([0xff, 0xd8, 0xff, 0xd9]) });
  await expectTitle('この内容で提出しますか', '3画面目：確認');
  check((await mainText()).includes('kenshu-report.jpg'), '選んだファイル名が見える');
  await page.getByRole('button', { name: '提出する' }).click();
  await expectTitle('提出しました', '4画面目：提出しました');
  check((await mainText()).includes('佐藤 健一さんが確認します'), 'だれが確認するかが分かる');
  await shot('04-submit-done-390.png');
  await page.getByRole('link', { name: '今日のやることに戻る' }).click();

  section('4. 健康診断の受診報告（ファイルを受け取らない区分）');
  await page.getByRole('link', { name: 'もう一度提出する' }).click();
  await expectTitle('健康診断の受診報告を提出する', '1画面目');
  check((await mainText()).includes('結果の用紙は出しません'), 'ファイルを出さないことが分かる');
  await page.getByRole('button', { name: '次へ' }).click();
  await expectTitle('健康診断を受診しましたか', '2画面目：受診したかどうか');
  check((await page.locator('input[type=file]').count()) === 0, 'ファイルを選ぶ欄がない');
  await page.getByRole('button', { name: '次へ' }).click();
  check((await mainText()).includes('「受診しました」か「まだ受診していません」を選んでください'), '何も選ばないと、直し方つきのエラーが出る');
  await page.getByLabel('まだ受診していません', { exact: true }).check();
  await page.getByRole('button', { name: '次へ' }).click();
  await expectTitle('受診してから報告してください', '「まだ」は提出扱いにしない');
  await page.getByRole('button', { name: '戻る' }).click();
  await page.getByLabel('受診しました', { exact: true }).check();
  await page.locator('#ex-date').fill(await localDate(1));
  await page.getByRole('button', { name: '次へ' }).click();
  check((await mainText()).includes('受診日は今日までの日付にしてください'), '未来の受診日はエラー');
  await page.locator('#ex-date').fill(await localDate(-7));
  await page.getByRole('button', { name: '次へ' }).click();
  await expectTitle('この内容で提出しますか', '3画面目：確認');
  await page.getByRole('button', { name: '提出する' }).click();
  await expectTitle('提出しました', '提出できた');
  await page.getByRole('link', { name: '今日のやることに戻る' }).click();
  await expectTitle('今日のやること（4件）', 'ホームの件数が4件になる');

  section('5. 依頼の確認と完了報告');
  await page.locator('article', { hasText: '物品の棚卸しの手伝い' }).getByRole('button', { name: '内容を見る' }).click();
  await expectTitle('物品の棚卸しの手伝い', '依頼の内容が開く');
  await page.getByRole('button', { name: '完了を報告する' }).click();
  check((await toastText()).includes('完了を報告しました'), '承認が要らない依頼はそのまま完了');

  // 6. 介護主任（佐藤）：その場で承認・差し戻し -------------------------
  section('6. 介護主任（佐藤）の承認・差し戻し 1280px');
  await page.setViewportSize({ width: 1280, height: 900 });
  await switchUser('s-sato', '佐藤 健一');
  await page.locator('.main-nav a[href="#/approvals"]').click();
  await expectTitle('承認待ち（3件）', '承認待ちは3件');
  await page.getByRole('button', { name: '確認する' }).first().click();
  check((await page.locator('#h-panel').innerText()) === '鈴木 一郎さんの提出', '古い順に1件目が開く', await page.locator('#h-panel').innerText());
  await shot('05-approvals-panel-1280.png', true);
  await page.getByRole('button', { name: '承認する', exact: true }).click();
  check((await page.locator('#h-panel').innerText()) === '吉田 恵さんの提出', '承認すると一覧に戻らず次の件が開く', await page.locator('#h-panel').innerText());
  await page.getByRole('button', { name: '差し戻す' }).click();
  check((await mainText()).includes('差し戻す理由を入力してください'), '理由なしでは差し戻せない');
  await page.locator('textarea[name=reason]').fill('写真が暗くて読めません。明るい場所でもう一度撮ってください。');
  await page.getByRole('button', { name: '差し戻す' }).click();
  check((await page.locator('#h-panel').innerText()) === '山田 花子さんの提出', '差し戻すと次の件が開く', await page.locator('#h-panel').innerText());
  check((await mainText()).includes('kenshu-report.jpg'), '山田さんが出したファイル名が見える');
  await page.getByRole('button', { name: '承認する', exact: true }).click();
  await expectTitle('承認待ち（0件）', 'すべて処理すると0件');

  section('7. 提出状況表（催促・代理登録・対象外）');
  await page.locator('.main-nav a[href="#/requests"]').click();
  await page.getByRole('link', { name: '感染症の研修レポート' }).click();
  await expectTitle('提出状況：感染症の研修レポート', '提出状況表が開く');
  check((await mainText()).includes('8名中 4名'), '8名中4名が提出（休職中の1名は数えない）');
  await page.getByRole('button', { name: '催促を送る' }).click();
  let dialog = page.getByRole('dialog');
  check((await dialog.innerText()).includes('未提出・差し戻しの3名に送ります'), '催促の前に件数を確認できる', await dialog.innerText());
  check((await dialog.innerText()).includes('アカウントのない1名には届かない'), '通知が届かない人が分かる');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  check(await page.evaluate(() => document.getElementById('dialog-root').contains(document.activeElement)), 'Tabキーで確認画面の外に出ない');
  await page.keyboard.press('Escape');
  check((await page.getByRole('dialog').count()) === 0, 'Escキーで閉じる');
  check((await page.evaluate(() => document.activeElement && document.activeElement.id)) === 'btn-remind', '閉じると元のボタンに戻る');
  await page.getByRole('button', { name: '催促を送る' }).click();
  await page.getByRole('dialog').getByRole('button', { name: '催促を送る' }).click();
  check((await toastText()).includes('3名に催促を送りました'), '催促を送った', await toastText());

  await page.locator('tr', { hasText: '高橋 次郎' }).getByRole('button', { name: '代理で登録' }).click();
  check((await page.locator('#h-panel').innerText()) === '高橋 次郎さんの代理登録', '代理登録の画面が横に開く');
  await page.getByRole('button', { name: '代理で登録する' }).click();
  check((await toastText()).includes('高橋 次郎さんの分を代理で登録しました'), '紙で受け取った分を代理で登録できる');
  check((await mainText()).includes('代理登録：佐藤 健一'), '代理で登録した人の名前が残る');
  await page.getByRole('button', { name: '承認する', exact: true }).click();
  check((await page.locator('tr', { hasText: '高橋 次郎' }).innerText()).includes('承認済み'), '代理登録の分も承認できる');

  await page.locator('tr', { hasText: '加藤 大輔' }).getByRole('button', { name: '対象外にする' }).click();
  await page.getByRole('button', { name: '対象外にする' }).last().click();
  check((await mainText()).includes('理由を入力してください'), '理由なしでは対象外にできない');
  await page.locator('#ex').fill('長期の研修中のため（架空）');
  await page.getByRole('button', { name: '対象外にする' }).last().click();
  check((await page.locator('tr', { hasText: '加藤 大輔' }).innerText()).includes('対象外'), '対象外にできる');
  await shot('06-status-table-1280.png', true);
  await checkSizes('提出状況表');

  // 8. 事務長（田中）：まとめて承認・行政提出 ---------------------------
  section('8. 事務長（田中）のまとめて承認');
  await switchUser('s-tanaka', '田中 由美');
  await page.locator('.main-nav a[href="#/approvals"]').click();
  await expectTitle('承認待ち（4件）', '承認待ちは4件（業務1・提出物3）');
  const boxes = page.locator('input[data-select="approvals"]');
  check((await boxes.count()) === 3, '提出物にだけ選ぶ欄がある');
  for (let i = 0; i < 3; i++) { await boxes.nth(i).click(); }
  await page.getByRole('button', { name: '選んだ3件を承認する' }).click();
  dialog = page.getByRole('dialog');
  check((await dialog.innerText()).includes('3件の提出物を承認します'), 'まとめて承認する前に件数を確認できる');
  await dialog.getByRole('button', { name: '3件を承認する' }).click();
  check((await toastText()).includes('3件を承認しました'), 'まとめて承認できた');
  await expectTitle('承認待ち（1件）', '残りは業務の1件');
  await page.getByRole('button', { name: '確認する' }).click();
  await page.getByRole('button', { name: '承認する', exact: true }).click();
  check((await toastText()).includes('承認しました：感染対策委員会の資料準備'), '業務の完了を承認できた');

  section('9. 行政提出（控えの登録が必要）');
  await page.locator('.main-nav a[href="#/tasks"]').click();
  await page.getByRole('link', { name: '○○に関する変更の届出（架空）' }).click();
  await expectTitle('○○に関する変更の届出（架空）', '行政提出の業務が開く');
  check((await mainText()).includes('必要（高木 誠さん）'), '承認する人は施設長（本人の業務は代わりの人）');
  await page.getByRole('button', { name: '完了を報告する' }).click();
  check((await mainText()).includes('提出した書類の控えを選んでください'), '控えがないと完了を報告できない');
  await page.locator('#copy').setInputFiles({ name: 'todokede-hikae.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') });
  await page.getByRole('button', { name: '完了を報告する' }).click();
  check((await toastText()).includes('高木 誠さんが確認します'), '施設長の承認待ちになる', await toastText());

  // 10. 施設長：業務・提出依頼の作成と承認 -------------------------------
  section('10. 施設長（高木）の承認と作成');
  await switchUser('s-takagi', '高木 誠');
  await page.locator('.main-nav a[href="#/approvals"]').click();
  await expectTitle('承認待ち（1件）', '施設長あての承認待ちは1件');
  await page.getByRole('button', { name: '確認する' }).click();
  check((await mainText()).includes('控え：todokede-hikae.pdf'), '承認するときに控えが見える');
  await page.getByRole('button', { name: '承認する', exact: true }).click();
  check((await toastText()).includes('承認しました：○○に関する変更の届出（架空）'), '行政提出の業務を人が承認して完了');

  await page.goto(FILE_URL + '#/tasks/new');
  await expectTitle('業務・依頼を作成', '業務・依頼の作成画面が開く');
  await page.getByRole('button', { name: '作成する' }).click();
  check((await mainText()).includes('入力内容を確認してください（1か所）'), '入力漏れの件数が出る');
  await page.locator('#f-title').fill('試作：消耗品の発注（架空）');
  await page.locator('input[name=kind][value=request]').check();
  await page.getByRole('button', { name: '作成する' }).click();
  check((await mainText()).includes('依頼する相手を選んでください'), '依頼は相手が必須');
  await page.locator('#f-asg').selectOption('staff:s-ito');
  await page.getByRole('button', { name: '作成する' }).click();
  await expectTitle('試作：消耗品の発注（架空）', '作成した依頼の詳細が開く');
  check((await toastText()).includes('依頼を送りました：試作：消耗品の発注（架空）'), '依頼を作成できた', await toastText());

  await page.goto(FILE_URL + '#/requests/new');
  await expectTitle('提出依頼を作成', '提出依頼の作成画面が開く');
  await page.getByRole('button', { name: '依頼を送る' }).click();
  check((await mainText()).includes('入力内容を確認してください（2か所）'), '名前と区分が未入力だと2か所');
  await page.locator('#q-title').fill('ストレスチェックの受検報告（架空）');
  await page.getByLabel('健康情報など', { exact: false }).check();
  await page.getByRole('button', { name: '依頼を送る' }).click();
  await expectTitle('提出状況：ストレスチェックの受検報告（架空）', '提出依頼を作成すると提出状況表が開く');
  check((await mainText()).includes('休職中'), '休職中の人は自動で対象外');

  section('11. 職員（伊藤）に新しい依頼が届く');
  await page.setViewportSize({ width: 390, height: 844 });
  await switchUser('s-ito', '伊藤 さくら');
  home = await mainText();
  check(home.includes('新しい依頼') && home.includes('ストレスチェックの受検報告（架空）'), '期限が先の依頼も「新しい依頼」に出る');
  check(home.includes('試作：消耗品の発注（架空）'), '作成した依頼も届く');
  await page.locator('article', { hasText: 'ストレスチェックの受検報告（架空）' }).getByRole('link', { name: '提出する' }).click();
  await page.getByRole('button', { name: '次へ' }).click();
  await expectTitle('「ストレスチェックの受検報告（架空）」は済みましたか', 'ファイルを受け取らない区分の質問');
  await page.getByLabel('済みました', { exact: true }).check();
  await page.locator('#ex-date').fill(await localDate(-1));
  await page.getByRole('button', { name: '次へ' }).click();
  await page.getByRole('button', { name: '提出する' }).click();
  await expectTitle('提出しました', '提出できた');
  await page.getByRole('link', { name: '今日のやることに戻る' }).click();
  check(!(await mainText()).includes('ストレスチェックの受検報告（架空）'), '提出した依頼はホームから消える');

  // 12. 日付を進める（毎日の自動処理） ------------------------------------
  section('12. 1日進める（チェックリスト・自動の督促）');
  await page.setViewportSize({ width: 1280, height: 900 });
  await switchUser('s-takagi', '高木 誠');
  const before = await store();
  await page.getByRole('button', { name: '1日進める' }).click();
  check((await page.locator('#proto-bar').innerText()).includes('1日進めています'), '日付を1日進めた');
  const after = await store();
  const tomorrow = await localDate(1);
  check(after.tasks.filter((t) => t.isChecklist && t.dueOn === tomorrow).length === 3, '次の日のチェックリストが3件できる');
  check(after.notifications.length > before.notifications.length, '期限を過ぎた提出の督促が自動で送られる');
  check((await mainText()).includes('毎日のチェックリストに、未実施が 1件'), '前日のチェックリストの未実施を自動チェックで知らせる', await mainText());
  await page.getByRole('button', { name: '1日進める' }).click();
  await page.getByRole('button', { name: '今日に戻す' }).click();
  const again = await store();
  const keys = new Set(again.tasks.filter((t) => t.seriesId).map((t) => t.seriesId + '|' + t.occurrenceDate));
  check(keys.size === again.tasks.filter((t) => t.seriesId).length, '同じ日の繰り返し業務が二重にできない');

  // 13. 保存されていること ---------------------------------------------
  section('13. 再読み込みしても残る');
  await page.reload();
  const d = await store();
  const gov = d.tasks.find((t) => t.title === '○○に関する変更の届出（架空）');
  check(gov && gov.status === 'completed' && gov.gov.copyFile === 'todokede-hikae.pdf', '行政提出の完了と控えが残る');
  check(d.audit.some((a) => a.action === '承認' && a.target === '○○に関する変更の届出（架空）' && a.actorId === 's-takagi'), '操作履歴に施設長の承認が残る');
  await page.locator('.main-nav a[href="#/audit"]').click();
  await expectTitle('操作履歴', '操作履歴の画面が開く');
  check((await mainText()).includes('代理登録'), '操作履歴の画面で代理登録が見える');

  section('14. 最初の状態に戻す');
  await page.locator('#proto-bar a[href="#/about"]').click();
  await page.getByRole('button', { name: '最初の状態に戻す' }).click();
  await page.getByRole('dialog').getByRole('button', { name: '最初の状態に戻す' }).click();
  await page.waitForFunction(() => document.getElementById('page-title').innerText === '施設の状況');
  const fresh = await store();
  check(fresh.todayOffset === 0 && !fresh.tasks.some((t) => t.title.startsWith('試作：')), '最初の架空データに戻った');

  // 14. まとめ ----------------------------------------------------------
  section('全体');
  check(errors.length === 0, 'エラー・警告が出ていない', errors);
  check(external.length === 0, 'インターネットへの通信がない', external);

  await browser.close();
  console.log('\n結果: ' + passed + '件 ok / ' + failed + '件 NG');
  console.log('画面の写し: ' + SHOT_DIR);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
