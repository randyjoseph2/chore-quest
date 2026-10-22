/* Chore Quest card - gaming themed chores + coins for Home Assistant.
 * One card, two layouts: tablet (wide) and mobile (narrow), chosen by card width.
 * No template literals, no emoji (ha-icon + inline SVG only), bare customElements.define.
 */
(function () {
  var CARD_VERSION = '2.7.1';
  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  var PALETTE = ['#ff4757', '#3b82f6', '#22c55e', '#ff9f1a', '#a855f7', '#ff5fa2', '#14b8a6', '#ffd23f'];
  var CHORE_ICONS = ['toothbrush', 'bed', 'tshirt-crew', 'dishwasher', 'trash-can', 'broom', 'vacuum', 'toy-brick',
    'teddy-bear', 'book-open-variant', 'paw', 'flower', 'watering-can', 'silverware-fork-knife', 'shower', 'hand-wash',
    'car-wash', 'basket', 'washing-machine', 'tooth', 'sprout', 'spray-bottle', 'pot-steam', 'wardrobe'];
  var PRIZE_ICONS = ['gift', 'ice-cream', 'movie-open', 'gamepad-variant', 'cookie', 'pizza', 'balloon', 'cart',
    'trophy', 'star', 'party-popper', 'teddy-bear', 'ferris-wheel', 'candy', 'cupcake', 'alarm-plus'];
  var AREA_ICONS = ['silverware-fork-knife', 'sofa', 'toilet', 'bathtub-outline', 'shower', 'bed-king', 'bed', 'teddy-bear',
    'door', 'stairs', 'garage', 'washing-machine', 'tree', 'desk', 'television', 'home'];
  var AVATARS = ['racing-helmet', 'rocket-launch', 'dinosaur', 'robot', 'star-face', 'ghost', 'cat', 'dog', 'account'];

  var COIN_SVG = '<svg viewBox="0 0 24 24" width="100%" height="100%">' +
    '<circle cx="12" cy="12" r="11" fill="#ffb300" stroke="#7a4b00" stroke-width="1.5"/>' +
    '<circle cx="12" cy="12" r="8" fill="#ffd54a" stroke="#e08e00" stroke-width="1"/>' +
    '<polygon points="12,6.2 13.6,10.2 17.9,10.4 14.5,13 15.7,17.2 12,14.8 8.3,17.2 9.5,13 6.1,10.4 10.4,10.2" fill="#e08e00"/>' +
    '</svg>';

  var CSS = [
    ':host{display:block;height:100%}',
    '*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}',
    '.wrap{position:relative;height:100%;min-height:620px}',
    '.wrap.mobile{min-height:calc(100vh - 56px)}',
    '.root{position:absolute;inset:0;display:flex;flex-direction:column;color:#fff;overflow:hidden;border-radius:18px;',
    'font-family:"Trebuchet MS","Arial Rounded MT Bold",system-ui,sans-serif;',
    'background:radial-gradient(1100px 560px at 12% -10%,#2a1b6e 0%,rgba(42,27,110,0) 60%),radial-gradient(900px 500px at 100% 0%,#0b4a8f 0%,rgba(11,74,143,0) 55%),#0a0d28}',
    '.mobile .root{border-radius:0}',
    '.flag{height:10px;flex:none;background:repeating-conic-gradient(#fff 0% 25%,#15183a 0% 50%) 0 0/20px 20px}',
    '.top{display:flex;align-items:center;gap:14px;padding:10px 18px;flex:none}',
    '.logo{font-weight:900;font-size:26px;letter-spacing:2px;text-transform:uppercase;color:#ffd23f;text-shadow:3px 3px 0 #c2260d,6px 6px 0 rgba(0,0,0,.35);white-space:nowrap}',
    '.mobile .logo{font-size:20px;text-shadow:2px 2px 0 #c2260d}',
    '.tabs{display:flex;gap:8px;margin-left:12px}',
    '.tab{border:0;cursor:pointer;display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:14px;font:inherit;font-weight:900;font-size:15px;letter-spacing:1px;text-transform:uppercase;color:#cfd6ff;background:rgba(255,255,255,.08);box-shadow:0 4px 0 rgba(0,0,0,.35)}',
    '.tab.on{background:#ffd23f;color:#2b1700;box-shadow:0 4px 0 #b8860b}',
    '.tab:active{transform:translateY(3px);box-shadow:0 1px 0 rgba(0,0,0,.35)}',
    '.clock{margin-left:auto;text-align:right;line-height:1.05}',
    '.clock b{display:block;font-size:30px;letter-spacing:2px}',
    '.clock span{font-size:13px;letter-spacing:2px;color:#9fb0ff;font-weight:800}',
    '.main{flex:1;overflow:auto;padding:6px 18px 18px;min-height:0}',
    '.mobile .main{padding:4px 12px 12px}',
    '.cols{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:14px;height:100%}',
    '.col{display:flex;flex-direction:column;gap:10px;min-width:0;background:rgba(255,255,255,.05);border:2px solid rgba(255,255,255,.1);border-radius:20px;padding:12px;overflow:auto}',
    '.mh{display:flex;align-items:center;gap:10px;padding:10px;border-radius:16px;background:linear-gradient(135deg,var(--mc),rgba(0,0,0,.4));box-shadow:0 4px 0 rgba(0,0,0,.35);flex:none}',
    '.av{width:52px;height:52px;border-radius:50%;display:grid;place-items:center;background:var(--mc,#3b82f6);border:3px solid #fff;flex:none}',
    '.av ha-icon{--mdc-icon-size:30px;color:#fff}',
    '.mi{flex:1;min-width:0}',
    '.nm{font-weight:900;font-size:20px;text-transform:uppercase;letter-spacing:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.sub{display:flex;gap:10px;align-items:center;font-size:13px;font-weight:800;color:#e6e9ff}',
    '.sub ha-icon{--mdc-icon-size:16px;color:#ffb300}',
    '.bank{display:flex;align-items:center;gap:6px;font-weight:900;font-size:24px;color:#ffd23f;text-shadow:2px 2px 0 rgba(0,0,0,.45)}',
    '.coin{display:inline-block;flex:none}',
    '.pbar{height:12px;border-radius:8px;background:rgba(0,0,0,.4);overflow:hidden;flex:none}',
    '.pbar i{display:block;height:100%;background:repeating-linear-gradient(45deg,#ffd23f 0 10px,#ffb300 10px 20px);transition:width .5s}',
    '.chore{position:relative;display:flex;align-items:center;gap:12px;padding:12px;border-radius:18px;border:3px solid var(--mc);background:rgba(255,255,255,.09);cursor:pointer;box-shadow:0 5px 0 rgba(0,0,0,.4);flex:none}',
    '.chore:active{transform:translateY(4px);box-shadow:0 1px 0 rgba(0,0,0,.4)}',
    '.ci{width:54px;height:54px;border-radius:14px;display:grid;place-items:center;background:var(--mc);flex:none}',
    '.ci ha-icon{--mdc-icon-size:32px;color:#fff}',
    '.ct{flex:1;min-width:0;font-weight:900;font-size:19px;line-height:1.1}',
    '.ct small{display:block;margin-top:3px;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#ffd23f}',
    '.ver{margin:6px 0 2px;text-align:center;font-size:12px;font-weight:800;letter-spacing:1px;color:#7f8ad0}',
    '.rw{display:flex;align-items:center;gap:4px;font-weight:900;font-size:20px;color:#ffd23f}',
    '.chore.done{opacity:.6;border-style:dashed;background:rgba(61,220,132,.14);box-shadow:none}',
    '.chore.done .ct{text-decoration:line-through}',
    '.chore.taken{opacity:.45;border-style:dotted;box-shadow:none;background:rgba(255,255,255,.04)}',
    '.chore.taken .rw ha-icon{--mdc-icon-size:30px;color:#9fb0ff}',
    '.chore.done .rw ha-icon{--mdc-icon-size:34px;color:#3ddc84}',
    '.empty{padding:24px 8px;text-align:center;color:#9fb0ff;font-weight:800;letter-spacing:1px}',
    '.empty ha-icon{--mdc-icon-size:44px;display:block;margin:0 auto 6px;color:#ffd23f}',
    '.wk{display:grid;grid-template-columns:150px repeat(7,minmax(0,1fr));gap:6px}',
    '.wh{text-align:center;font-weight:900;font-size:14px;letter-spacing:1px;padding:8px 2px;border-radius:12px;background:rgba(255,255,255,.07)}',
    '.wh.today,.dayh.today{background:#ffd23f;color:#2b1700}',
    '.wm{display:flex;align-items:center;gap:8px;padding:6px;border-radius:14px;background:linear-gradient(135deg,var(--mc),rgba(0,0,0,.4));font-weight:900;text-transform:uppercase;font-size:15px}',
    '.wm .av{width:36px;height:36px}.wm .av ha-icon{--mdc-icon-size:20px}',
    '.cell{min-height:74px;background:rgba(255,255,255,.05);border-radius:12px;padding:5px;display:flex;flex-direction:column;gap:4px;min-width:0}',
    '.cell.today{outline:2px solid #ffd23f}',
    '.chip{display:flex;align-items:center;gap:4px;font-size:12px;font-weight:800;padding:3px 6px;border-radius:8px;background:var(--mc);min-width:0}',
    '.chip span{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;flex:1}',
    '.chip ha-icon{--mdc-icon-size:14px;flex:none}',
    '.chip.done{background:rgba(61,220,132,.35)}',
    '.chip.miss{opacity:.4}',
    '.day{margin-bottom:10px;border-radius:16px;background:rgba(255,255,255,.05);padding:8px;display:flex;flex-direction:column;gap:6px}',
    '.dayh{font-weight:900;letter-spacing:1px;padding:6px 10px;border-radius:10px;background:rgba(255,255,255,.07)}',
    '.day .chip{font-size:15px;padding:8px 10px}',
    '.day .chip ha-icon{--mdc-icon-size:20px}',
    '.pickrow{position:relative;display:flex;gap:10px;overflow-x:auto;padding:6px 0 10px;flex:none}',
    '.pick{flex:none;display:flex;align-items:center;gap:8px;padding:5px 14px 5px 5px;border-radius:30px;border:3px solid transparent;background:rgba(255,255,255,.08);color:#fff;font:inherit;font-weight:900;cursor:pointer}',
    '.pick.on{border-color:var(--mc);background:rgba(255,255,255,.2)}',
    '.pick .av{width:38px;height:38px}.pick .av ha-icon{--mdc-icon-size:22px}',
    '.pick small{display:flex;align-items:center;gap:3px;color:#ffd23f;font-size:15px}',
    '.shop{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:14px;margin-top:6px}',
    '.mobile .shop{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}',
    '.prize{display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px 10px;border-radius:20px;border:3px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);box-shadow:0 5px 0 rgba(0,0,0,.4);cursor:pointer;color:#fff;font:inherit;text-align:center}',
    '.prize.can{border-color:#ffd23f;background:linear-gradient(160deg,rgba(255,210,63,.22),rgba(255,255,255,.06))}',
    '.prize:active{transform:translateY(4px);box-shadow:0 1px 0 rgba(0,0,0,.4)}',
    '.prize .pi{width:64px;height:64px;border-radius:18px;display:grid;place-items:center;background:rgba(255,255,255,.12)}',
    '.prize.can .pi{background:#ffd23f}',
    '.prize .pi ha-icon{--mdc-icon-size:38px}.prize.can .pi ha-icon{color:#4a2d00}',
    '.prize b{font-size:17px;line-height:1.1}',
    '.prize .cost{display:flex;align-items:center;gap:5px;font-weight:900;font-size:20px;color:#ffd23f}',
    '.prize .need{font-size:12px;font-weight:800;color:#9fb0ff}',
    '.h2{font-weight:900;font-size:17px;letter-spacing:2px;text-transform:uppercase;color:#ffd23f;margin:14px 0 8px}',
    '.pod{display:flex;align-items:flex-end;justify-content:center;gap:12px;margin:10px 0 16px;min-height:220px}',
    '.step{width:150px;max-width:30%;display:flex;flex-direction:column;align-items:center;gap:6px}',
    '.step .blk{width:100%;border-radius:14px 14px 0 0;display:flex;align-items:flex-start;justify-content:center;padding-top:8px;font-weight:900;font-size:34px;background:linear-gradient(180deg,var(--mc),rgba(0,0,0,.45));box-shadow:inset 0 4px 0 rgba(255,255,255,.25)}',
    '.step .nm{font-size:16px}.step .bank{font-size:20px}',
    '.step ha-icon.crown{--mdc-icon-size:34px;color:#ffd23f}',
    '.rank{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:14px;background:rgba(255,255,255,.06);margin-bottom:8px}',
    '.rank .pos{font-weight:900;font-size:22px;width:28px;color:#ffd23f}',
    '.rank .bar{flex:1;height:14px;border-radius:8px;background:rgba(0,0,0,.4);overflow:hidden}',
    '.rank .bar i{display:block;height:100%;background:var(--mc)}',
    '.rank .av{width:40px;height:40px}.rank .av ha-icon{--mdc-icon-size:22px}',
    '.champ{display:flex;align-items:center;gap:10px;padding:12px;border-radius:16px;background:rgba(255,210,63,.14);border:2px solid #ffd23f;font-weight:900;margin-bottom:8px}',
    '.champ ha-icon{--mdc-icon-size:32px;color:#ffd23f}',
    '.sec{background:rgba(255,255,255,.05);border:2px solid rgba(255,255,255,.1);border-radius:18px;padding:12px;margin-bottom:14px}',
    '.sec .h2{margin-top:0}',
    '.row{display:flex;align-items:center;gap:10px;padding:8px;border-radius:12px;background:rgba(255,255,255,.06);margin-bottom:6px}',
    '.row .ci{width:40px;height:40px;border-radius:12px}.row .ci ha-icon{--mdc-icon-size:22px}',
    '.row .rt{flex:1;min-width:0}.row .rt b{display:block}',
    '.row .rt small{color:#aab2ff;font-weight:700}',
    '.grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}',
    '.mobile .grid2{grid-template-columns:1fr}',
    '.btn{border:0;cursor:pointer;padding:12px 18px;border-radius:14px;font:inherit;font-weight:900;letter-spacing:1px;text-transform:uppercase;font-size:14px;color:#fff;background:rgba(255,255,255,.16);box-shadow:0 4px 0 rgba(0,0,0,.4)}',
    '.btn:active{transform:translateY(3px);box-shadow:0 1px 0 rgba(0,0,0,.4)}',
    '.btn.go{background:#3ddc84;color:#04210f}.btn.no{background:#ff4757}.btn.gold{background:#ffd23f;color:#2b1700}',
    '.btn.sm{padding:7px 12px;font-size:12px}',
    '.btn ha-icon{--mdc-icon-size:18px;vertical-align:middle}',
    '.ovl{position:absolute;inset:0;pointer-events:none;z-index:20}',
    '.ov{position:absolute;inset:0;background:rgba(5,6,25,.82);display:grid;place-items:center;padding:14px;overflow:auto;pointer-events:auto}',
    '.md{width:min(540px,100%);max-height:100%;overflow:auto;background:#161a4a;color:#fff;border:3px solid #ffd23f;border-radius:22px;padding:18px;box-shadow:0 8px 0 rgba(0,0,0,.5);font-family:"Trebuchet MS",system-ui,sans-serif}',
    '.mt{font-weight:900;font-size:22px;letter-spacing:1px;text-transform:uppercase;color:#ffd23f;margin-bottom:10px;text-align:center}',
    '.mrow{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:14px}',
    '.fl{display:block;font-weight:900;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#9fb0ff;margin:12px 0 6px}',
    '.inp{width:100%;padding:12px;border-radius:12px;border:2px solid rgba(255,255,255,.25);background:rgba(0,0,0,.35);color:#fff;font:inherit;font-size:16px}',
    '.chips{display:flex;flex-wrap:wrap;gap:8px}',
    '.homebtn{display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:22px;border:2px solid rgba(255,255,255,.18);background:rgba(255,255,255,.1);color:#fff;font:inherit;font-weight:800;cursor:pointer;margin-right:10px}',
    '.homebtn ha-icon{--mdc-icon-size:20px}',
    '.phase{display:flex;align-items:center;gap:8px;margin:2px 0 10px;padding:8px 14px;border-radius:16px;font-weight:900;font-size:15px;background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.12)}',
    '.phase.day{border-color:rgba(255,196,0,.55);background:rgba(255,196,0,.12)}',
    '.phase.night{border-color:rgba(130,120,255,.55);background:rgba(110,100,255,.16)}',
    '.phase ha-icon{--mdc-icon-size:22px}',
    '.phase small{margin-left:auto;font-weight:700;font-size:13px;opacity:.8}',
    '.wrap.sum{height:auto;min-height:0}',
    '.sum .root{position:relative;inset:auto;overflow:hidden;border-radius:20px;cursor:pointer;transition:transform .2s ease;border:.5px solid rgba(255,196,0,.4);box-shadow:0 0 10px rgba(255,196,0,.18);background:radial-gradient(circle at 50% 0%,rgba(255,196,0,.18) 0%,rgba(255,255,255,.06) 80%);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}',
    '.sum .root.clear{border-color:rgba(52,199,89,.4);box-shadow:0 0 10px rgba(52,199,89,.2);background:radial-gradient(circle at 50% 0%,rgba(52,199,89,.18) 0%,rgba(255,255,255,.06) 80%)}',
    '.sum .root:active{transform:scale(.98)}',
    '.sumh{display:flex;align-items:center;gap:10px;padding:12px 14px 2px;font-weight:900;font-size:17px}',
    '.sumh ha-icon{--mdc-icon-size:24px;color:#ffd23f}',
    '.sumh .ph{margin-left:auto;display:flex;align-items:center;gap:5px;font-size:13px;font-weight:800;opacity:.9}',
    '.sumh .ph ha-icon{--mdc-icon-size:18px;color:inherit}',
    '.sumh .go{opacity:.6}',
    '.sumr{display:flex;gap:4px;padding:8px 10px 12px}',
    '.sr{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:2px;text-align:center}',
    '.sr .ring{width:48px;height:48px;border-radius:50%;padding:3px;background:conic-gradient(var(--mc) calc(var(--p) * 1%),rgba(255,255,255,.16) 0)}',
    '.sr .ring .av{width:100% !important;height:100% !important}',
    '.sr b{font-size:13px;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.sr small{font-size:12px;font-weight:800;color:#ffd23f}',
    '.sr small.ok{color:#5ee08a}',
    '.sr .bank{font-size:12px}',
    '.you{margin-left:8px;font-size:11px;font-weight:900;letter-spacing:1px;padding:2px 7px;border-radius:9px;background:#ffd23f;color:#3a2a00;vertical-align:middle}',
    '.adm{display:flex;gap:16px;align-items:flex-start}',
    '.side{flex:none;width:210px;display:flex;flex-direction:column;gap:6px;position:sticky;top:0}',
    '.side button{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:14px;border:2px solid transparent;background:rgba(255,255,255,.07);color:#fff;font:inherit;font-weight:800;font-size:15px;cursor:pointer;text-align:left}',
    '.side button.on{border-color:#ffd23f;background:rgba(255,210,63,.16)}',
    '.side button em{margin-left:auto;font-style:normal;font-size:12px;opacity:.7}',
    '.adm .content{flex:1;min-width:0}',
    '.adm.narrow{flex-direction:column;gap:8px}',
    '.adm.narrow .side{width:auto;flex-direction:row;overflow-x:auto;position:static;max-width:100%}',
    '.adm.narrow .side button{flex:none;padding:9px 13px;font-size:14px}',
    '.stat{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-bottom:14px}',
    '.stat div{background:rgba(255,255,255,.08);border-radius:14px;padding:12px;text-align:center}',
    '.stat b{display:block;font-size:26px;color:#ffd23f}',
    '.grp{margin:14px 0 6px;font-weight:900;color:#ffd23f;display:flex;align-items:center;gap:6px;font-size:14px;letter-spacing:.5px;text-transform:uppercase}',
    '.abar{display:flex;flex-wrap:wrap;gap:8px;margin:4px 0 12px}',
    '.abar.sub{margin:-4px 0 12px;padding-left:10px}',
    '.ab{display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:22px;border:2px solid rgba(255,255,255,.12);background:rgba(255,255,255,.07);color:#fff;font:inherit;font-weight:800;font-size:14px;cursor:pointer}',
    '.ab ha-icon{--mdc-icon-size:18px}',
    '.ab.on{border-color:#ffd23f;background:rgba(255,210,63,.18)}',
    '.abar.sub .ab{padding:5px 11px;font-size:13px}',
    '.ab i{font-style:normal;min-width:20px;height:20px;border-radius:10px;background:#ff5a67;color:#fff;font-size:12px;display:inline-flex;align-items:center;justify-content:center;padding:0 5px}',
    '.ab i.z{background:rgba(255,255,255,.15);color:#c9d0ff}',
    '.cp{border:2px solid rgba(255,255,255,.25);background:rgba(255,255,255,.07);color:#fff;font:inherit;font-weight:800;border-radius:12px;padding:8px 12px;cursor:pointer;display:flex;align-items:center;gap:6px}',
    '.cp.on{background:#ffd23f;color:#2b1700;border-color:#ffd23f}',
    '.cp.ic{padding:8px}.cp.ic ha-icon{--mdc-icon-size:24px}',
    '.cp .dot{width:14px;height:14px;border-radius:50%;background:var(--mc)}',
    '.sw{width:34px;height:34px;border-radius:50%;border:3px solid transparent;cursor:pointer;padding:0}',
    '.sw.on{border-color:#fff;box-shadow:0 0 0 3px rgba(255,255,255,.3)}',
    '.step2{display:flex;align-items:center;gap:12px}',
    '.step2 b{font-size:26px;min-width:40px;text-align:center;color:#ffd23f}',
    '.msg{text-align:center;font-weight:800;line-height:1.35}',
    '.box{position:relative;width:130px;height:130px;margin:14px auto;border-radius:22px;display:grid;place-items:center;background:linear-gradient(135deg,#ffcf33,#ff8a00);border:5px solid #fff3b0;color:#7a3b00;font-size:76px;font-weight:900;animation:wob .5s ease-in-out 3}',
    '.box .q{animation:fade .2s linear 1.5s forwards}',
    '.box .rv{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:4px;font-size:44px;opacity:0;animation:pop .5s ease-out 1.6s both}',
    '@keyframes wob{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg)}}',
    '@keyframes fade{to{opacity:0;transform:scale(.3)}}',
    '@keyframes pop{0%{transform:scale(.2);opacity:0}70%{transform:scale(1.25);opacity:1}100%{transform:scale(1);opacity:1}}',
    '.burst{position:absolute;z-index:30;pointer-events:none;font-weight:900;font-size:30px;color:#ffd23f;text-shadow:2px 2px 0 #7a4b00;display:flex;align-items:center;gap:4px;animation:rise .95s ease-out forwards}',
    '@keyframes rise{0%{transform:translate(-50%,0) scale(.6);opacity:0}15%{opacity:1;transform:translate(-50%,-12px) scale(1.2)}100%{transform:translate(-50%,-100px) scale(1);opacity:0}}',
    '.toast{position:absolute;left:50%;bottom:78px;transform:translateX(-50%);z-index:40;background:#ff4757;color:#fff;font-weight:900;padding:10px 18px;border-radius:14px;box-shadow:0 4px 0 rgba(0,0,0,.4);max-width:90%;text-align:center}',
    '.toast.ok{background:#3ddc84;color:#04210f}',
    '.nav{display:flex;flex:none;background:rgba(0,0,0,.5);border-top:2px solid rgba(255,255,255,.12)}',
    '.nav button{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 0;border:0;background:none;color:#aab2ff;font:inherit;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1px;cursor:pointer}',
    '.nav button.on{color:#ffd23f}.nav ha-icon{--mdc-icon-size:26px}',
    '.mobile .chore{padding:14px}'
  ].join('');

  function h(tag, a, kids) {
    var el = document.createElement(tag);
    if (a) {
      for (var k in a) {
        var v = a[k];
        if (v === null || v === undefined || v === false) { continue; }
        if (k === 'cls') { el.className = v; }
        else if (k === 'text') { el.textContent = v; }
        else if (k === 'html') { el.innerHTML = v; }
        else if (k === 'style') { el.setAttribute('style', v); }
        else if (k === 'value') { el.value = v; }
        else if (k.slice(0, 2) === 'on') { el.addEventListener(k.slice(2), v); }
        else { el.setAttribute(k, v); }
      }
    }
    if (kids) {
      if (!Array.isArray(kids)) { kids = [kids]; }
      kids.forEach(function (c) {
        if (c === null || c === undefined || c === false) { return; }
        el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      });
    }
    return el;
  }
  function ic(name, size, color) {
    var e = h('ha-icon', { icon: name });
    if (size) { e.style.setProperty('--mdc-icon-size', size + 'px'); }
    if (color) { e.style.color = color; }
    return e;
  }
  function coin(sz) { return h('span', { cls: 'coin', style: 'width:' + sz + 'px;height:' + sz + 'px', html: COIN_SVG }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function isoToDate(iso) { var p = iso.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function dayLabel(iso) { var d = isoToDate(iso); return DAYS[(d.getDay() + 6) % 7] + ' ' + d.getDate(); }
  function timeLabel(ts) { var d = new Date(ts); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function avatar(m, size) {
    var a = h('div', { cls: 'av', style: '--mc:' + m.color + ';width:' + size + 'px;height:' + size + 'px' });
    a.appendChild(ic(m.icon, Math.round(size * 0.58)));
    return a;
  }
  function bankEl(n, size) {
    return h('span', { cls: 'bank', style: size ? 'font-size:' + size + 'px' : '' }, [coin(size ? size : 24), String(n)]);
  }
  function field(label, node) { return h('div', null, [h('span', { cls: 'fl', text: label }), node]); }

  function picker(options, selected, multi, onchange) {
    var sel = selected.slice();
    var box = h('div', { cls: 'chips' });
    var btns = [];
    function paint() {
      btns.forEach(function (b, i) {
        if (sel.indexOf(options[i].v) >= 0) { b.classList.add('on'); } else { b.classList.remove('on'); }
      });
    }
    options.forEach(function (o, i) {
      var kids = [];
      if (o.color) { kids.push(h('span', { cls: 'dot', style: '--mc:' + o.color })); }
      if (o.icon) { kids.push(ic('mdi:' + o.icon)); }
      if (o.label) { kids.push(o.label); }
      var b = h('button', {
        cls: 'cp' + (o.icon && !o.label ? ' ic' : ''), type: 'button',
        onclick: function () {
          var at = sel.indexOf(o.v);
          if (multi) { if (at >= 0) { sel.splice(at, 1); } else { sel.push(o.v); } }
          else { sel = [o.v]; }
          paint();
          if (onchange) { onchange(sel); }
        }
      }, kids);
      btns.push(b);
      box.appendChild(b);
    });
    paint();
    return { el: box, get: function () { return sel.slice(); }, set: function (v) { sel = v.slice(); paint(); } };
  }

  class ChoreQuestCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._cfg = {};
      this._s = null;
      this._tab = 'today';
      this._grp = '';
      this._room = '';
      this._sel = null;
      this._pin = '';
      this._unlockUntil = 0;
      this._mobile = null;
      this._hass = null;
      this._inited = false;
      this._unsub = null;
      this._timer = null;
      this._ro = null;
      this._clockEl = null;
      this._wrap = h('div', { cls: 'wrap' });
      this._root = h('div', { cls: 'root' });
      this._ovl = h('div', { cls: 'ovl' });
      this._wrap.appendChild(this._root);
      this._wrap.appendChild(this._ovl);
      this.shadowRoot.appendChild(h('style', { text: CSS }));
      this.shadowRoot.appendChild(this._wrap);
    }

    static getStubConfig() { return {}; }
    getCardSize() { return this._cfg && this._cfg.mode === 'summary' ? 3 : 12; }
    setConfig(config) {
      this._cfg = config || {};
      if (this._cfg.mode === 'summary') {
        if (this.style) { this.style.height = 'auto'; }
        this._wrap.classList.add('sum');
      } else {
        if (this.style) { this.style.height = ''; }
        this._wrap.classList.remove('sum');
      }
      this._applyLayout();
    }

    getGridOptions() {
      if (this._cfg && this._cfg.mode === 'summary') { return { columns: 12, min_columns: 4, rows: 'auto' }; }
      return { columns: 12, min_rows: 6 };
    }

    set hass(hass) {
      this._hass = hass;
      var ph = this._phase();
      if (this._s && ph !== this._lastPhase) { this._lastPhase = ph; this._render(); }
      if (!this._inited && this.isConnected) { this._init(); }
    }

    connectedCallback() {
      var self = this;
      if (this._hass && !this._inited) { this._init(); }
      if (window.ResizeObserver && !this._ro) {
        this._ro = new ResizeObserver(function () { self._applyLayout(); });
        this._ro.observe(this);
      }
      this._applyLayout();
    }

    disconnectedCallback() {
      this._inited = false;
      if (this._unsub) { try { this._unsub(); } catch (e) { /* ignore */ } this._unsub = null; }
      if (this._timer) { clearInterval(this._timer); this._timer = null; }
      if (this._ro) { this._ro.disconnect(); this._ro = null; }
    }

    _init() {
      var self = this;
      this._inited = true;
      this._hass.connection.subscribeEvents(function () { self._load(); }, 'chore_quest_updated').then(function (u) {
        if (self._inited) { self._unsub = u; } else { u(); }
      });
      this._timer = setInterval(function () {
        self._tickClock();
        self._tickCount = (self._tickCount || 0) + 1;
        if (self._tickCount % 3 === 0) { self._load(); }
      }, 20000);
      this._load();
    }

    _applyLayout() {
      var w = this.getBoundingClientRect().width || this.clientWidth || window.innerWidth;
      var mobile = this._cfg.layout === 'mobile' || (this._cfg.layout !== 'tablet' && w < 720);
      if (mobile !== this._mobile) {
        this._mobile = mobile;
        if (mobile) { this._wrap.classList.add('mobile'); } else { this._wrap.classList.remove('mobile'); }
        this._render();
      }
    }

    /* ---------------------------------------------------------- data */
    _load() {
      var self = this;
      return this._call('get').then(function () { self._render(); }).catch(function (e) { self._err(e); });
    }

    _call(action, payload) {
      var self = this;
      return this._hass.callWS({ type: 'chore_quest/action', action: action, payload: payload || {}, pin: this._pin || '', as_admin: this._cfg.mode === 'admin' }).then(function (r) {
        if (r && r.state) { self._s = r.state; }
        return r;
      });
    }

    _admin(action, payload) {
      var self = this;
      return this._call(action, payload).then(function (r) {
        self._unlockUntil = Date.now() + 5 * 60000;
        self._render();
        return r;
      }).catch(function (e) {
        if (e && e.message === 'bad_pin') { self._unlockUntil = 0; self._pin = ''; self._render(); }
        throw e;
      });
    }

    _err(e) {
      var msg = (e && e.message) ? e.message : 'Something went wrong';
      if (msg === 'bad_pin') { msg = 'Wrong PIN'; }
      this._toast(msg, false);
    }

    _toast(msg, ok) {
      var self = this;
      if (this._toastEl) { this._toastEl.remove(); }
      this._toastEl = h('div', { cls: 'toast' + (ok ? ' ok' : ''), text: msg });
      this._wrap.appendChild(this._toastEl);
      setTimeout(function () { if (self._toastEl) { self._toastEl.remove(); self._toastEl = null; } }, 2600);
    }

    _member(id) {
      var l = this._s.members;
      for (var i = 0; i < l.length; i++) { if (l[i].id === id) { return l[i]; } }
      return null;
    }
    _chore(id) {
      var l = this._s.chores;
      for (var i = 0; i < l.length; i++) { if (l[i].id === id) { return l[i]; } }
      return null;
    }
    _unlocked() { return this._cfg.mode === 'admin' || !this._s.settings.has_pin || Date.now() < this._unlockUntil; }
    _persons() {
      var st = (this._hass && this._hass.states) || {};
      return Object.keys(st).filter(function (k) { return k.indexOf('person.') === 0; }).map(function (k) {
        return { id: k, name: (st[k].attributes && st[k].attributes.friendly_name) || k, user: st[k].attributes && st[k].attributes.user_id };
      });
    }

    _viewer() {
      if (this._cfg.snap === false || !this._s || !this._hass || !this._hass.user) { return null; }
      var uid = this._hass.user.id;
      var mine = this._persons().filter(function (p) { return p.user === uid; })[0];
      if (!mine) { return null; }
      var found = null;
      this._s.members.forEach(function (m) { if (!found && m.person === mine.id) { found = m; } });
      if (found) { return found; }
      var pn = String(mine.name).toLowerCase().split(' ')[0];
      this._s.members.forEach(function (m) {
        var mn = String(m.name).toLowerCase();
        if (!found && !m.person && m.role === 'adult' && pn && (pn.indexOf(mn) === 0 || mn.indexOf(pn) === 0)) { found = m; }
      });
      return found;
    }

    _selected() {
      var s = this._s;
      if (!this._sel || !this._member(this._sel)) {
        var v = this._viewer();
        this._sel = v ? v.id : (s.members.length ? s.members[0].id : null);
      }
      return this._member(this._sel);
    }

    _ordered() {
      var v = this._viewer();
      var list = this._s.members.slice();
      if (v) { list.sort(function (a, b) { return (a.id === v.id ? 0 : 1) - (b.id === v.id ? 0 : 1); }); }
      return list;
    }

    /* ---------------------------------------------------------- shell */
    _render() {
      var s = this._s;
      var root = this._root;
      var keep = this._mainEl ? this._mainEl.scrollTop : 0;
      var keepPick = this._pickScroll || 0;
      root.textContent = '';
      this._clockEl = null;
      this._pickEl = null;
      this._pickSelEl = null;
      if (!s) { root.appendChild(h('div', { cls: 'empty', text: 'Loading...' })); return; }
      if (this._cfg.mode === 'summary') { this._renderSummary(); return; }
      root.className = 'root';
      root.onclick = null;
      var mobile = !!this._mobile;
      root.appendChild(h('div', { cls: 'flag' }));
      if (this._cfg.mode === 'admin') {
        root.appendChild(h('div', { cls: 'top' }, [h('div', { cls: 'logo', text: this._cfg.title || 'Chore Quest Admin' })]));
      } else {
        root.appendChild(mobile ? this._mobileTop() : this._tabletTop());
      }
      var main = h('div', { cls: 'main' });
      this._mainEl = main;
      var view;
      if (this._tab === 'week') { view = this._weekView(); }
      else if (this._tab === 'shop') { view = this._shopView(); }
      else if (this._tab === 'cup') { view = this._cupView(); }
      else if (this._tab === 'parent' && this._cfg.parent_tab !== false) { view = this._parentView(); }
      else { view = this._todayView(); }
      if (this._cfg.mode === 'admin') { view = this._adminView(); }
      main.appendChild(view);
      root.appendChild(main);
      if (mobile && this._cfg.mode !== 'admin') { root.appendChild(this._nav()); }
      main.scrollTop = keep;
      this._fixPickRow(keepPick);
      this._tickClock();
    }

    _renderSummary() {
      var self = this;
      var s = this._s;
      var root = this._root;
      root.textContent = '';
      var cur = this._phase();
      var items = s.week[s.today] || [];
      var all = 0;
      var rows = h('div', { cls: 'sumr' });
      this._ordered().forEach(function (m) {
        var mine = items.filter(function (i) { return i.member_id === m.id && !i.taken_by; });
        var left = mine.filter(function (i) { return !i.done; });
        var now = left.filter(function (i) { return self._inPhase(i); }).length;
        all += left.length;
        var pct = mine.length ? Math.round((mine.length - left.length) * 100 / mine.length) : 100;
        var label = !left.length ? 'Done' : (now ? now + ' left' : 'Clear');
        var ring = h('div', { cls: 'ring', style: '--mc:' + m.color + ';--p:' + pct }, [avatar(m, 42)]);
        rows.appendChild(h('div', { cls: 'sr' }, [ring, h('b', { text: m.name }), h('small', { cls: left.length ? '' : 'ok', text: label }), bankEl(m.coins, 12)]));
      });
      var head = [ic('mdi:flag-checkered'), this._cfg.title || 'Chore Quest'];
      if (cur) { head.push(h('span', { cls: 'ph' }, [ic(cur === 'day' ? 'mdi:white-balance-sunny' : 'mdi:weather-night'), cur === 'day' ? 'Day' : 'Night'])); }
      head.push(h('span', { cls: cur ? 'go' : 'ph go' }, [ic('mdi:chevron-right')]));
      root.className = 'root' + (all === 0 ? ' clear' : '');
      root.appendChild(h('div', { cls: 'sumh' }, head));
      root.appendChild(rows);
      root.onclick = function () { self._navigate(self._cfg.open_path); };
    }

    _fixPickRow(saved) {
      var row = this._pickEl;
      var btn = this._pickSelEl;
      if (!row) { return; }
      row.scrollLeft = saved;
      if (btn) {
        var left = btn.offsetLeft;
        var right = left + btn.offsetWidth;
        if (left < row.scrollLeft) { row.scrollLeft = Math.max(0, left - 12); }
        else if (right > row.scrollLeft + row.clientWidth) { row.scrollLeft = right - row.clientWidth + 12; }
      }
      this._pickScroll = row.scrollLeft;
    }

    _tabs() {
      var all = this._allTabs();
      if (this._cfg.parent_tab === false) { all = all.filter(function (t) { return t.id !== 'parent'; }); }
      return all;
    }

    _allTabs() {
      return [
        { id: 'today', label: 'Quests', icon: 'mdi:flag-checkered' },
        { id: 'week', label: 'Week', icon: 'mdi:calendar-week' },
        { id: 'shop', label: 'Shop', icon: 'mdi:storefront' },
        { id: 'cup', label: 'Cup', icon: 'mdi:trophy' },
        { id: 'parent', label: 'Parent', icon: 'mdi:shield-crown' }
      ];
    }

    _setTab(id) { this._tab = id; this._render(); }

    _goHome() { this._navigate(this._cfg.back_path); }

    _navigate(path) {
      if (!path) { return; }
      try {
        history.pushState(null, '', path);
        window.dispatchEvent(new CustomEvent('location-changed', { detail: { replace: false }, bubbles: true, composed: true }));
      } catch (e) { /* ignore */ }
    }

    _homeBtn() {
      var self = this;
      if (!this._cfg.back_path) { return null; }
      return h('button', { cls: 'homebtn', type: 'button', onclick: function () { self._goHome(); } }, [ic('mdi:home'), 'Home']);
    }

    _tabletTop() {
      var self = this;
      var tabs = h('div', { cls: 'tabs' });
      this._tabs().forEach(function (t) {
        tabs.appendChild(h('button', { cls: 'tab' + (self._tab === t.id ? ' on' : ''), onclick: function () { self._setTab(t.id); } }, [ic(t.icon), t.label]));
      });
      this._clockEl = h('div', { cls: 'clock' }, [h('b'), h('span')]);
      return h('div', { cls: 'top' }, [this._homeBtn(), h('div', { cls: 'logo', text: this._cfg.title || 'Chore Quest' }), tabs, this._clockEl]);
    }

    _mobileTop() {
      var m = this._selected();
      var kids = [h('div', { cls: 'logo', text: this._cfg.title || 'Chore Quest' })];
      var hb = this._homeBtn();
      if (hb) { kids.unshift(hb); }
      if (m) { kids.push(h('div', { style: 'margin-left:auto' }, [bankEl(m.coins, 22)])); }
      return h('div', { cls: 'top' }, kids);
    }

    _nav() {
      var self = this;
      var nav = h('div', { cls: 'nav' });
      this._tabs().forEach(function (t) {
        nav.appendChild(h('button', { cls: self._tab === t.id ? 'on' : '', onclick: function () { self._setTab(t.id); } }, [ic(t.icon), t.label]));
      });
      return nav;
    }

    _tickClock() {
      if (!this._clockEl) { return; }
      var d = new Date();
      this._clockEl.children[0].textContent = pad(d.getHours()) + ':' + pad(d.getMinutes());
      this._clockEl.children[1].textContent = DAYS[(d.getDay() + 6) % 7].toUpperCase() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getDate();
    }

    _pickRow(onSelect) {
      var self = this;
      var cur = this._selected();
      var row = h('div', { cls: 'pickrow' });
      row.addEventListener('scroll', function () { self._pickScroll = row.scrollLeft; });
      this._pickEl = row;
      this._s.members.forEach(function (m) {
        var on = cur && cur.id === m.id;
        var btn = h('button', {
          cls: 'pick' + (on ? ' on' : ''), style: '--mc:' + m.color,
          onclick: function () { self._sel = m.id; if (onSelect) { onSelect(); } else { self._render(); } }
        }, [avatar(m, 38), m.name, h('small', null, [coin(16), String(m.coins)])]);
        if (on) { self._pickSelEl = btn; }
        row.appendChild(btn);
      });
      return row;
    }


    /* ---------------------------------------------------------- time of day */
    _phase() {
      if (this._cfg.phase_filter === false || !this._s) { return null; }
      var set = this._s.settings || {};
      if (set.phase_filter === false) { return null; }
      var eid = set.phase_entity;
      var st = eid && this._hass && this._hass.states ? this._hass.states[eid] : null;
      var word = st ? String(st.state || '').toLowerCase().match(/[a-z]+/) : null;
      word = word ? word[0] : '';
      if (word === 'morning' || word === 'afternoon' || word === 'day' || word === 'am') { return 'day'; }
      if (word === 'evening' || word === 'night' || word === 'pm') { return 'night'; }
      return this._s.phase || null;
    }

    _inPhase(it) {
      var cur = this._phase();
      return !cur || !it.phase || it.phase === cur;
    }

    _phaseBar() {
      var cur = this._phase();
      if (!cur) { return h('div'); }
      var s = this._s;
      var later = (s.week[s.today] || []).filter(function (i) { return !i.done && !i.taken_by && i.phase && i.phase !== cur; }).length;
      var kids = [ic(cur === 'day' ? 'mdi:white-balance-sunny' : 'mdi:weather-night'), cur === 'day' ? 'Day quests' : 'Night quests'];
      if (later) { kids.push(h('small', { text: later + (cur === 'day' ? ' waiting for tonight' : ' waiting for tomorrow') })); }
      return h('div', { cls: 'phase ' + cur }, kids);
    }

    /* ---------------------------------------------------------- rooms */
    _area(id) {
      var a = this._s.areas || [];
      for (var i = 0; i < a.length; i++) { if (a[i].id === id) { return a[i]; } }
      return null;
    }

    _groups() {
      var out = [];
      (this._s.areas || []).forEach(function (a) {
        var g = a.group || a.name;
        if (out.indexOf(g) < 0) { out.push(g); }
      });
      return out;
    }

    _inFilter(ch) {
      if (!ch) { return false; }
      if (!this._grp) { return true; }
      var a = this._area(ch.area);
      if (this._grp === '__other') { return !a; }
      if (!a) { return false; }
      if ((a.group || a.name) !== this._grp) { return false; }
      return !this._room || ch.area === this._room;
    }

    _areaBar() {
      var self = this;
      var s = this._s;
      var groups = this._groups();
      var hasOther = s.chores.some(function (c) { return !self._area(c.area); });
      if (this._grp && this._grp !== '__other' && groups.indexOf(this._grp) < 0) { this._grp = ''; this._room = ''; }
      if (this._room && !this._area(this._room)) { this._room = ''; }
      var wrap = h('div');
      if (!groups.length) { return wrap; }
      var todo = {};
      var seen = {};
      (s.week[s.today] || []).forEach(function (it) {
        if (it.done || it.taken_by) { return; }
        var ch = self._chore(it.chore_id);
        if (!ch) { return; }
        var a = self._area(ch.area);
        var key = a ? (a.group || a.name) : '__other';
        todo[key] = (todo[key] || 0) + 1;
        todo['*'] = (todo['*'] || 0) + 1;
        if (a) { seen[a.id] = (seen[a.id] || 0) + 1; }
      });
      function btn(label, icon, on, n, fn) {
        var kids = [];
        if (icon) { kids.push(ic(icon)); }
        kids.push(label);
        if (n !== null) { kids.push(h('i', { cls: n ? '' : 'z', text: String(n) })); }
        return h('button', { cls: 'ab' + (on ? ' on' : ''), type: 'button', onclick: fn }, kids);
      }
      var bar = h('div', { cls: 'abar' });
      bar.appendChild(btn('All', 'mdi:home-variant', !this._grp, todo['*'] || 0, function () { self._grp = ''; self._room = ''; self._render(); }));
      var gIcons = {};
      s.areas.forEach(function (a) { var g = a.group || a.name; if (!gIcons[g]) { gIcons[g] = a.icon; } });
      groups.forEach(function (g) {
        bar.appendChild(btn(g, gIcons[g], self._grp === g, todo[g] || 0, function () { self._grp = g; self._room = ''; self._render(); }));
      });
      if (hasOther) {
        bar.appendChild(btn('Other', 'mdi:dots-horizontal', this._grp === '__other', todo.__other || 0, function () { self._grp = '__other'; self._room = ''; self._render(); }));
      }
      wrap.appendChild(bar);
      if (this._grp && this._grp !== '__other') {
        var rooms = s.areas.filter(function (a) { return (a.group || a.name) === self._grp; });
        if (rooms.length > 1) {
          var sub = h('div', { cls: 'abar sub' });
          sub.appendChild(btn('All ' + this._grp, null, !this._room, null, function () { self._room = ''; self._render(); }));
          rooms.forEach(function (a) {
            sub.appendChild(btn(a.name, a.icon, self._room === a.id, seen[a.id] || 0, function () { self._room = a.id; self._render(); }));
          });
          wrap.appendChild(sub);
        }
      }
      return wrap;
    }

    _roomLabel(ch) {
      var a = this._area(ch.area);
      if (!a) { return ''; }
      if (this._room === a.id) { return ''; }
      return a.name;
    }

    /* ---------------------------------------------------------- today */
    _todayView() {
      var self = this;
      var s = this._s;
      if (!s.members.length) { return h('div', { cls: 'empty', text: 'Add racers in the Parent tab' }); }
      if (this._mobile) {
        var m = this._selected();
        var wrap = h('div');
        wrap.appendChild(this._pickRow());
        wrap.appendChild(this._phaseBar());
        wrap.appendChild(this._areaBar());
        wrap.appendChild(this._memberColumn(m, true));
        return wrap;
      }
      var all = h('div');
      all.appendChild(this._phaseBar());
      all.appendChild(this._areaBar());
      var cols = h('div', { cls: 'cols' });
      this._ordered().forEach(function (mm) { cols.appendChild(self._memberColumn(mm, false)); });
      all.appendChild(cols);
      return all;
    }

    _memberColumn(m, bare) {
      var self = this;
      var s = this._s;
      var items = (s.week[s.today] || []).filter(function (i) { return i.member_id === m.id && self._inFilter(self._chore(i.chore_id)) && self._inPhase(i); });
      function rank(i) { return i.taken_by ? 2 : (i.done ? 1 : 0); }
      items.sort(function (a, b) { return rank(a) - rank(b); });
      var done = m.total - m.left;
      var col = h('div', { cls: bare ? '' : 'col', style: '--mc:' + m.color });
      var subs = [h('span', null, [done + '/' + m.total + ' done'])];
      if (m.streak > 0) { subs.push(h('span', { style: 'display:flex;align-items:center;gap:2px' }, [ic('mdi:fire'), m.streak + ' day streak'])); }
      col.appendChild(h('div', { cls: 'mh', style: bare ? 'margin-bottom:10px' : '' }, [
        avatar(m, 52),
        h('div', { cls: 'mi' }, [h('div', { cls: 'nm' }, [m.name, (self._viewer() && self._viewer().id === m.id) ? h('span', { cls: 'you', text: 'YOU' }) : null]), h('div', { cls: 'sub' }, subs)]),
        bankEl(m.coins)
      ]));
      var pct = m.total ? Math.round(done * 100 / m.total) : 0;
      col.appendChild(h('div', { cls: 'pbar', style: bare ? 'margin-bottom:10px' : '' }, [h('i', { style: 'width:' + pct + '%' })]));
      if (!items.length) {
        col.appendChild(h('div', { cls: 'empty' }, [ic('mdi:flag-checkered'), this._grp ? 'Nothing here right now' : (this._phase() ? 'All clear for now' : 'No quests today')]));
      }
      items.forEach(function (it) {
        var ch = self._chore(it.chore_id);
        if (!ch) { return; }
        var taker = it.taken_by ? self._member(it.taken_by) : null;
        var right = taker ? h('div', { cls: 'rw' }, [ic('mdi:account-check')]) : (it.done ? h('div', { cls: 'rw' }, [ic('mdi:check-circle')]) : h('div', { cls: 'rw' }, [coin(26), '+' + ch.coins]));
        var sub = it.label || '';
        var rl = self._roomLabel(ch);
        if (rl) { sub = (sub ? sub + ' - ' : '') + rl; }
        if (taker) { sub = (sub ? sub + ' - ' : '') + taker.name + ' got it'; }
        var tile = h('div', {
          cls: 'chore' + (it.done ? ' done' : '') + (taker ? ' taken' : ''), style: '--mc:' + m.color,
          onclick: function (ev) {
            if (taker) { self._toast(taker.name + ' already did that one', false); return; }
            self._tapChore(ch, m, it.done, ev, it.slot || 0, it.label || '');
          }
        }, [h('div', { cls: 'ci' }, [ic(ch.icon)]), h('div', { cls: 'ct' }, [ch.name, sub ? h('small', { text: sub }) : null]), right]);
        if (bare) { tile.style.marginBottom = '10px'; }
        col.appendChild(tile);
      });
      return col;
    }

    _tapChore(ch, m, isDone, ev, slot, label) {
      var self = this;
      if (isDone) {
        this._openModal({
          title: 'Undo quest?',
          body: [h('div', { cls: 'msg', text: m.name + ' did not finish "' + ch.name + (label ? ' - ' + label : '') + '" yet?' })],
          actions: [
            { label: 'Keep it', cls: 'alt' },
            { label: 'Undo', cls: 'no', fn: function () {
              return self._call('uncomplete', { chore_id: ch.id, member_id: m.id, slot: slot || 0 }).then(function () { self._render(); });
            } }
          ]
        });
        return;
      }
      var rect = this._wrap.getBoundingClientRect();
      var x = ev.clientX - rect.left;
      var y = ev.clientY - rect.top;
      var b = h('div', { cls: 'burst', style: 'left:' + x + 'px;top:' + y + 'px' }, [coin(30), '+' + ch.coins]);
      this._wrap.appendChild(b);
      setTimeout(function () { b.remove(); }, 1000);
      this._call('complete', { chore_id: ch.id, member_id: m.id, slot: slot || 0 }).then(function (r) {
        self._render();
        if (r.result && r.result.all_done) { self._celebrate(r.result); }
      }).catch(function (e) { self._err(e); self._load(); });
    }

    _celebrate(res) {
      var m = this._member(res.member_id);
      var body = [
        h('div', { style: 'text-align:center;margin:6px 0' }, [ic('mdi:trophy', 80, '#ffd23f')]),
        h('div', { cls: 'msg', text: (m ? m.name : 'Racer') + ' cleared every quest today!' })
      ];
      if (res.bonus > 0) {
        body.push(h('div', { cls: 'msg', style: 'color:#ffd23f;margin-top:8px;display:flex;align-items:center;justify-content:center;gap:6px' }, [coin(24), '+' + res.bonus + ' bonus']));
      }
      if (res.streak > 1) {
        body.push(h('div', { cls: 'msg', style: 'color:#ffd23f;margin-top:8px' }, [ic('mdi:fire', 20), ' ' + res.streak + ' day streak!']));
      }
      this._openModal({ title: 'Finish line!', body: body, actions: [{ label: 'Nice!', cls: 'go' }] });
    }

    /* ---------------------------------------------------------- week */
    _chipFor(it, m, iso) {
      var s = this._s;
      var ch = this._chore(it.chore_id);
      if (!ch) { return null; }
      var cls = 'chip';
      var icon = ch.icon;
      if (it.done) { cls += ' done'; icon = 'mdi:check-circle'; }
      else if (it.taken_by) { cls += ' miss'; icon = 'mdi:account-check'; }
      else if (iso < s.today) { cls += ' miss'; }
      var taker = it.taken_by ? this._member(it.taken_by) : null;
      var txt = ch.name + (it.label ? ' - ' + it.label : '') + (taker ? ' (' + taker.name + ')' : '');
      var rl = this._roomLabel(ch);
      if (rl) { txt += ' @ ' + rl; }
      return h('div', { cls: cls, style: '--mc:' + m.color, title: txt }, [ic(icon), h('span', { text: txt })]);
    }

    _weekView() {
      var self = this;
      var s = this._s;
      if (this._mobile) {
        var m = this._selected();
        var wrap = h('div');
        wrap.appendChild(this._pickRow());
        wrap.appendChild(this._areaBar());
        s.week_dates.forEach(function (iso) {
          var items = (s.week[iso] || []).filter(function (i) { return i.member_id === m.id && self._inFilter(self._chore(i.chore_id)); });
          var d = h('div', { cls: 'day' }, [h('div', { cls: 'dayh' + (iso === s.today ? ' today' : ''), text: dayLabel(iso) })]);
          if (!items.length) { d.appendChild(h('div', { cls: 'sub', style: 'padding:4px 10px;color:#7f8ad0', text: 'Rest day' })); }
          items.forEach(function (it) { var c = self._chipFor(it, m, iso); if (c) { d.appendChild(c); } });
          wrap.appendChild(d);
        });
        return wrap;
      }
      var outer = h('div');
      outer.appendChild(this._areaBar());
      var grid = h('div', { cls: 'wk' });
      outer.appendChild(grid);
      grid.appendChild(h('div'));
      s.week_dates.forEach(function (iso) { grid.appendChild(h('div', { cls: 'wh' + (iso === s.today ? ' today' : ''), text: dayLabel(iso).toUpperCase() })); });
      this._ordered().forEach(function (m) {
        grid.appendChild(h('div', { cls: 'wm', style: '--mc:' + m.color }, [avatar(m, 36), m.name]));
        s.week_dates.forEach(function (iso) {
          var cell = h('div', { cls: 'cell' + (iso === s.today ? ' today' : '') });
          (s.week[iso] || []).filter(function (i) { return i.member_id === m.id && self._inFilter(self._chore(i.chore_id)); }).forEach(function (it) {
            var c = self._chipFor(it, m, iso);
            if (c) { cell.appendChild(c); }
          });
          grid.appendChild(cell);
        });
      });
      return outer;
    }

    /* ---------------------------------------------------------- shop */
    _shopView() {
      var self = this;
      var s = this._s;
      var m = this._selected();
      var wrap = h('div');
      wrap.appendChild(h('div', { cls: 'h2', text: 'Who is shopping?', style: 'margin-top:4px' }));
      wrap.appendChild(this._pickRow());
      if (!s.prizes.length) { wrap.appendChild(h('div', { cls: 'empty', text: 'No prizes yet - add some in the Parent tab' })); }
      var shop = h('div', { cls: 'shop' });
      s.prizes.slice().sort(function (a, b) { return a.cost - b.cost; }).forEach(function (p) {
        var can = m && m.coins >= p.cost;
        var kids = [h('div', { cls: 'pi' }, [ic(p.icon)]), h('b', { text: p.name }), h('div', { cls: 'cost' }, [coin(22), String(p.cost)])];
        if (m && !can) { kids.push(h('div', { cls: 'need', text: (p.cost - m.coins) + ' more to go' })); }
        shop.appendChild(h('button', { cls: 'prize' + (can ? ' can' : ''), onclick: function () { self._buy(p, m); } }, kids));
      });
      wrap.appendChild(shop);
      var recent = s.recent.filter(function (e) { return e.kind === 'redeem'; }).slice(0, 5);
      if (recent.length) {
        wrap.appendChild(h('div', { cls: 'h2', text: 'Recently redeemed' }));
        recent.forEach(function (e) {
          var mm = self._member(e.member);
          wrap.appendChild(h('div', { cls: 'row' }, [h('div', { cls: 'rt' }, [h('b', { text: (mm ? mm.name : '?') + ' got ' + e.label }), h('small', { text: e.date + ' ' + timeLabel(e.ts) })]), bankEl(-e.delta, 18)]));
        });
      }
      return wrap;
    }

    _buy(p, m) {
      var self = this;
      if (!m) { return; }
      if (m.coins < p.cost) {
        this._toast(m.name + ' needs ' + (p.cost - m.coins) + ' more coins', false);
        return;
      }
      this._openModal({
        title: 'Spend coins?',
        body: [
          h('div', { cls: 'prize can', style: 'cursor:default;margin:0 auto;max-width:240px' }, [h('div', { cls: 'pi' }, [ic(p.icon)]), h('b', { text: p.name }), h('div', { cls: 'cost' }, [coin(22), String(p.cost)])]),
          h('div', { cls: 'msg', style: 'margin-top:12px', text: m.name + ' will have ' + (m.coins - p.cost) + ' coins left.' })
        ],
        actions: [
          { label: 'Not now', cls: 'alt' },
          { label: 'Redeem', cls: 'go', fn: function () {
            return self._call('redeem', { prize_id: p.id, member_id: m.id }).then(function () {
              self._render();
              self._toast('Redeemed ' + p.name + '!', true);
            });
          } }
        ]
      });
    }

    /* ---------------------------------------------------------- cup */
    _cupView() {
      var s = this._s;
      var self = this;
      var wrap = h('div');
      var st = s.standings;
      var rows = st.this_week;
      var top = Math.max.apply(null, rows.map(function (r) { return r.coins; }).concat([1]));
      wrap.appendChild(h('div', { cls: 'h2', text: 'Grand Prix - this week', style: 'margin-top:4px' }));
      if (st.last_champion) {
        var cm = this._member(st.last_champion.member_id);
        if (cm) {
          wrap.appendChild(h('div', { cls: 'champ' }, [ic('mdi:trophy'), h('div', { text: 'Last week champion: ' + cm.name + ' with ' + st.last_champion.coins + ' coins' })]));
        }
      }
      var any = rows.some(function (r) { return r.coins > 0; });
      if (!any) {
        wrap.appendChild(h('div', { cls: 'empty' }, [ic('mdi:flag-checkered'), 'Race starts now - finish quests to earn coins!']));
      } else {
        var order = [1, 0, 2];
        var heights = { 0: 170, 1: 125, 2: 90 };
        var pod = h('div', { cls: 'pod' });
        order.forEach(function (idx) {
          var r = rows[idx];
          if (!r || r.coins <= 0) { return; }
          var m = self._member(r.member_id);
          if (!m) { return; }
          var kids = [];
          if (idx === 0) { kids.push(ic('mdi:crown', 34, '#ffd23f')); }
          kids.push(avatar(m, 58), h('div', { cls: 'nm', text: m.name }), bankEl(r.coins, 20), h('div', { cls: 'blk', style: '--mc:' + m.color + ';height:' + heights[idx] + 'px', text: String(idx + 1) }));
          pod.appendChild(h('div', { cls: 'step' }, kids));
        });
        wrap.appendChild(pod);
      }
      rows.forEach(function (r, i) {
        var m = self._member(r.member_id);
        if (!m) { return; }
        wrap.appendChild(h('div', { cls: 'rank', style: '--mc:' + m.color }, [
          h('div', { cls: 'pos', text: String(i + 1) }), avatar(m, 40),
          h('div', { style: 'min-width:80px;font-weight:900;text-transform:uppercase', text: m.name }),
          h('div', { cls: 'bar' }, [h('i', { style: 'width:' + Math.round(r.coins * 100 / top) + '%' })]),
          bankEl(r.coins, 20)
        ]));
      });
      wrap.appendChild(h('div', { cls: 'h2', text: 'Coin bank' }));
      var bank = h('div', { cls: 'chips' });
      s.members.forEach(function (m) {
        bank.appendChild(h('div', { cls: 'pick', style: '--mc:' + m.color }, [avatar(m, 38), m.name, h('small', null, [coin(16), String(m.coins)])]));
      });
      wrap.appendChild(bank);
      return wrap;
    }

    /* ---------------------------------------------------------- parent */
    _parentView() {
      var self = this;
      var s = this._s;
      if (!this._unlocked()) {
        var inp = h('input', { cls: 'inp', type: 'password', inputmode: 'numeric', placeholder: 'PIN', style: 'max-width:220px;text-align:center;font-size:24px;letter-spacing:6px' });
        var go = function () {
          self._pin = inp.value;
          self._call('verify_pin').then(function () {
            self._unlockUntil = Date.now() + 5 * 60000;
            self._render();
          }).catch(function (e) { self._pin = ''; self._err(e); });
        };
        inp.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { go(); } });
        return h('div', { cls: 'empty' }, [ic('mdi:lock'), h('div', { text: 'Parent zone', style: 'margin-bottom:12px' }), inp, h('div', { style: 'margin-top:12px' }, [h('button', { cls: 'btn gold', text: 'Unlock', onclick: go })])]);
      }
      var wrap = h('div');
      var lockBtn = s.settings.has_pin ? h('button', { cls: 'btn sm', onclick: function () { self._unlockUntil = 0; self._pin = ''; self._render(); } }, [ic('mdi:lock'), ' Lock']) : null;
      wrap.appendChild(h('div', { style: 'display:flex;gap:8px;justify-content:flex-end;margin:4px 0 10px' }, [
        h('button', { cls: 'btn sm', onclick: function () { self._settingsForm(); } }, [ic('mdi:cog'), ' Settings']), lockBtn
      ]));
      var grid = h('div', { cls: 'grid2' });

      grid.appendChild(this._secQuests(false));

      grid.appendChild(this._secPrizes());
      wrap.appendChild(grid);

      wrap.appendChild(this._secRooms());

      var grid2 = h('div', { cls: 'grid2' });
      grid2.appendChild(this._secRacers());

      grid2.appendChild(this._secHistory());
      wrap.appendChild(grid2);
      wrap.appendChild(h('div', { cls: 'ver', text: 'CHORE QUEST - CARD v' + CARD_VERSION + ' - INTEGRATION v' + (s.version || '?') }));
      return wrap;
    }


    _secQuests(grouped) {
      var self = this;
      var s = this._s;
      var chores = h('div', { cls: 'sec' }, [h('div', { cls: 'h2', text: 'Quests' })]);
      var order = {};
      (s.areas || []).forEach(function (a, i) { order[a.id] = i; });
      var lastG = null;
      s.chores.slice().sort(function (a, b) {
        var oa = order[a.area] === undefined ? 999 : order[a.area];
        var ob = order[b.area] === undefined ? 999 : order[b.area];
        return oa - ob;
      }).forEach(function (ch) {
        var rowEl = h('div', { cls: 'row' }, [
          h('div', { cls: 'ci', style: '--mc:#3b4fd8' }, [ic(ch.icon)]),
          h('div', { cls: 'rt' }, [h('b', { text: ch.name }), h('small', { text: self._describe(ch) })]),
          bankEl(ch.coins, 18),
          h('button', { cls: 'btn sm', onclick: function () { self._choreForm(ch); } }, [ic('mdi:pencil')])
        ]);
        if (grouped) {
          var ar = self._area(ch.area);
          var gname = ar ? ar.name : 'No room';
          if (gname !== lastG) { chores.appendChild(h('div', { cls: 'grp' }, [ic(ar ? ar.icon : 'mdi:dots-horizontal', 18), gname])); lastG = gname; }
        }
        chores.appendChild(rowEl);
      });
      chores.appendChild(h('button', { cls: 'btn go', style: 'width:100%;margin-top:6px', onclick: function () { self._choreForm(null); } }, [ic('mdi:plus'), ' New quest']));
      return chores;
    }

    _secPrizes() {
      var self = this;
      var s = this._s;
      var prizes = h('div', { cls: 'sec' }, [h('div', { cls: 'h2', text: 'Prizes' })]);
      s.prizes.forEach(function (p) {
        prizes.appendChild(h('div', { cls: 'row' }, [
          h('div', { cls: 'ci', style: '--mc:#d98a00' }, [ic(p.icon)]),
          h('div', { cls: 'rt' }, [h('b', { text: p.name })]),
          bankEl(p.cost, 18),
          h('button', { cls: 'btn sm', onclick: function () { self._prizeForm(p); } }, [ic('mdi:pencil')])
        ]));
      });
      prizes.appendChild(h('button', { cls: 'btn go', style: 'width:100%;margin-top:6px', onclick: function () { self._prizeForm(null); } }, [ic('mdi:plus'), ' New prize']));
      return prizes;
    }

    _secRooms() {
      var self = this;
      var s = this._s;
      var rooms = h('div', { cls: 'sec' }, [h('div', { cls: 'h2', text: 'Rooms' })]);
      (s.areas || []).forEach(function (a) {
        var n = s.chores.filter(function (c) { return c.area === a.id; }).length;
        rooms.appendChild(h('div', { cls: 'row' }, [
          h('div', { cls: 'ci', style: '--mc:#1aa39a' }, [ic(a.icon)]),
          h('div', { cls: 'rt' }, [h('b', { text: a.name }), h('small', { text: (a.group || a.name) + ' - ' + n + (n === 1 ? ' quest' : ' quests') })]),
          h('button', { cls: 'btn sm', onclick: function () { self._areaForm(a); } }, [ic('mdi:pencil')])
        ]));
      });
      rooms.appendChild(h('button', { cls: 'btn go', style: 'width:100%;margin-top:6px', onclick: function () { self._areaForm(null); } }, [ic('mdi:plus'), ' New room']));
      return rooms;
    }

    _secRacers() {
      var self = this;
      var s = this._s;
      var racers = h('div', { cls: 'sec' }, [h('div', { cls: 'h2', text: 'Racers' })]);
      s.members.forEach(function (m) {
        racers.appendChild(h('div', { cls: 'row', style: '--mc:' + m.color }, [
          avatar(m, 40),
          h('div', { cls: 'rt' }, [h('b', { text: m.name }), h('small', { text: (m.role === 'adult' ? 'Adult' : 'Kid') + (m.person ? ' - ' + m.person : '') })]),
          bankEl(m.coins, 18),
          h('button', { cls: 'btn sm gold', onclick: function () { self._adjustForm(m); } }, [ic('mdi:plus-minus-variant')]),
          h('button', { cls: 'btn sm', onclick: function () { self._memberForm(m); } }, [ic('mdi:pencil')])
        ]));
      });
      racers.appendChild(h('button', { cls: 'btn go', style: 'width:100%;margin-top:6px', onclick: function () { self._memberForm(null); } }, [ic('mdi:plus'), ' New racer']));
      return racers;
    }

    _secHistory() {
      var self = this;
      var s = this._s;
      var hist = h('div', { cls: 'sec' }, [h('div', { cls: 'h2', text: 'History' })]);
      s.recent.slice(0, 14).forEach(function (e) {
        var m = self._member(e.member);
        hist.appendChild(h('div', { cls: 'row' }, [
          h('div', { cls: 'rt' }, [h('b', { text: (m ? m.name : '?') + ' - ' + e.label }), h('small', { text: e.date + ' ' + timeLabel(e.ts) })]),
          h('b', { style: 'color:' + (e.delta >= 0 ? '#3ddc84' : '#ff6b78'), text: (e.delta >= 0 ? '+' : '') + e.delta })
        ]));
      });
      if (!s.recent.length) { hist.appendChild(h('div', { cls: 'sub', text: 'Nothing yet' })); }
      return hist;
    }

    _describe(ch) {
      var self = this;
      var names = (ch.assignees || []).map(function (id) { var m = self._member(id); return m ? m.name : '?'; });
      var who = names.length ? names.join(', ') : 'Nobody';
      var ar = this._area(ch.area);
      if (ar) { who = ar.name + ' - ' + who; }
      var when = ch.freq === 'daily' ? 'every day' : (ch.freq === 'once' ? ch.date : (ch.days || []).map(function (d) { return DAYS[d]; }).join(' '));
      var turns = ch.rotate === 'daily' ? ' - taking turns daily' : (ch.rotate === 'weekly' ? ' - taking turns weekly' : '');
      var times = (ch.slots && ch.slots.length) ? ' - ' + ch.slots.join(' + ') : '';
      var race = (ch.claim === 'first' && (ch.assignees || []).length > 1 && ch.rotate !== 'daily' && ch.rotate !== 'weekly') ? ' - first to tap wins' : '';
      return who + ' - ' + when + times + turns + race;
    }


    /* ---------------------------------------------------------- admin */
    _adminMenu() {
      var s = this._s;
      return [
        { id: 'overview', label: 'Overview', icon: 'mdi:view-dashboard' },
        { id: 'quests', label: 'Quests', icon: 'mdi:flag-checkered', n: s.chores.length },
        { id: 'rooms', label: 'Rooms', icon: 'mdi:door', n: (s.areas || []).length },
        { id: 'prizes', label: 'Prizes', icon: 'mdi:gift', n: s.prizes.length },
        { id: 'racers', label: 'Racers', icon: 'mdi:racing-helmet', n: s.members.length },
        { id: 'history', label: 'History', icon: 'mdi:history' },
        { id: 'settings', label: 'Settings', icon: 'mdi:cog' }
      ];
    }

    _adminView() {
      var self = this;
      var s = this._s;
      var narrow = !!this._mobile;
      if (!this._amenu) {
        try { this._amenu = window.localStorage.getItem('chore_quest_admin_menu') || ''; } catch (e) { /* ignore */ }
        if (!this._amenu) { this._amenu = 'overview'; }
      }
      var menu = this._amenu;
      var side = h('div', { cls: 'side' });
      this._adminMenu().forEach(function (it) {
        side.appendChild(h('button', { cls: menu === it.id ? 'on' : '', onclick: function () { self._gotoMenu(it.id); } },
          [ic(it.icon), it.label, it.n !== undefined ? h('em', { text: String(it.n) }) : null]));
      });
      var content = h('div', { cls: 'content' });
      if (menu === 'quests') {
        content.appendChild(this._secQuests(true));
      } else if (menu === 'rooms') {
        content.appendChild(this._secRooms());
      } else if (menu === 'prizes') {
        content.appendChild(this._secPrizes());
      } else if (menu === 'racers') {
        content.appendChild(this._secRacers());
      } else if (menu === 'history') {
        content.appendChild(this._secHistory());
      } else if (menu === 'settings') {
        content.appendChild(this._secSettings());
      } else {
        content.appendChild(this._secOverview());
      }
      return h('div', { cls: 'adm' + (narrow ? ' narrow' : '') }, [side, content]);
    }

    _gotoMenu(id) {
      if (id === this._amenu) { return; }
      this._ascroll = this._ascroll || {};
      if (this._mainEl) { this._ascroll[this._amenu] = this._mainEl.scrollTop; }
      this._amenu = id;
      try { window.localStorage.setItem('chore_quest_admin_menu', id); } catch (e) { /* ignore */ }
      this._render();
      if (this._mainEl) { this._mainEl.scrollTop = this._ascroll[id] || 0; }
    }

    _secOverview() {
      var self = this;
      var s = this._s;
      var items = s.week[s.today] || [];
      var done = items.filter(function (i) { return i.done; }).length;
      var box = h('div');
      var stat = h('div', { cls: 'stat' });
      [['Quests', s.chores.length], ['Rooms', (s.areas || []).length], ['Prizes', s.prizes.length], ['Done today', done + '/' + items.length]].forEach(function (x) {
        stat.appendChild(h('div', null, [h('b', { text: String(x[1]) }), x[0]]));
      });
      box.appendChild(stat);
      var sec = h('div', { cls: 'sec' }, [h('div', { cls: 'h2', text: 'Racers today' })]);
      s.members.forEach(function (m) {
        var warn = (m.role === 'adult' && !m.person) ? ' - not linked to a person (matches by name)' : '';
        sec.appendChild(h('div', { cls: 'row', style: '--mc:' + m.color }, [
          avatar(m, 40),
          h('div', { cls: 'rt' }, [h('b', { text: m.name }), h('small', { text: (m.total - m.left) + '/' + m.total + ' done' + (m.person ? ' - ' + m.person : warn) })]),
          bankEl(m.coins, 18)
        ]));
      });
      box.appendChild(sec);
      box.appendChild(h('div', { cls: 'ver', text: 'CHORE QUEST - CARD v' + CARD_VERSION + ' - INTEGRATION v' + (s.version || '?') }));
      return box;
    }

    _secSettings() {
      var self = this;
      var st = this._s.settings;
      var sec = h('div', { cls: 'sec' }, [h('div', { cls: 'h2', text: 'Settings' })]);
      sec.appendChild(h('div', { cls: 'row' }, [h('div', { cls: 'rt' }, [h('b', { text: 'Parent PIN' }), h('small', { text: st.has_pin ? 'Set (only used on the kid dashboards)' : 'Not set' })])]));
      sec.appendChild(h('div', { cls: 'row' }, [h('div', { cls: 'rt' }, [h('b', { text: 'Bonus for clearing every quest' }), h('small', { text: String(st.all_done_bonus || 0) + ' coins' })])]));
      var now = this._phase();
      sec.appendChild(h('div', { cls: 'row' }, [h('div', { cls: 'rt' }, [h('b', { text: 'Day and night quests' }), h('small', { text: (st.phase_filter === false ? 'Off' : 'On') + ' - ' + (st.phase_entity || 'no entity') + (now ? ' - now: ' + now : '') })])]));
      sec.appendChild(h('div', { cls: 'row' }, [h('div', { cls: 'rt' }, [h('b', { text: 'Prize notifications' }), h('small', { text: st.notify_service || 'Off' })])]));
      sec.appendChild(h('button', { cls: 'btn go', style: 'width:100%;margin-top:6px', onclick: function () { self._settingsForm(); } }, [ic('mdi:pencil'), ' Edit settings']));
      return sec;
    }

    /* ---------------------------------------------------------- modal */
    _openModal(opts) {
      var self = this;
      this._ovl.textContent = '';
      var box = h('div', { cls: 'md' });
      if (opts.title) { box.appendChild(h('div', { cls: 'mt', text: opts.title })); }
      (opts.body || []).forEach(function (n) { if (n) { box.appendChild(n); } });
      var row = h('div', { cls: 'mrow' });
      (opts.actions || []).forEach(function (a) {
        row.appendChild(h('button', {
          cls: 'btn ' + (a.cls || 'alt'), type: 'button', text: a.label,
          onclick: function () {
            var r = a.fn ? a.fn() : true;
            if (r && typeof r.then === 'function') {
              r.then(function (x) { if (x !== false) { self._closeModal(); } }).catch(function (e) { self._err(e); });
            } else if (r !== false) { self._closeModal(); }
          }
        }));
      });
      box.appendChild(row);
      var ov = h('div', { cls: 'ov', onclick: function (e) { if (e.target === ov) { self._closeModal(); } } }, [box]);
      this._ovl.appendChild(ov);
    }

    _closeModal() { this._ovl.textContent = ''; }

    _confirm(msg, fn) {
      this._openModal({
        title: 'Are you sure?',
        body: [h('div', { cls: 'msg', text: msg })],
        actions: [{ label: 'Cancel', cls: 'alt' }, { label: 'Delete', cls: 'no', fn: fn }]
      });
    }

    _iconGrid(list, current, onpick) {
      var box = h('div', { cls: 'chips' });
      var btns = [];
      list.forEach(function (n) {
        var b = h('button', {
          cls: 'cp ic' + (current.value === 'mdi:' + n ? ' on' : ''), type: 'button',
          onclick: function () {
            current.value = 'mdi:' + n;
            btns.forEach(function (x) { x.classList.remove('on'); });
            b.classList.add('on');
            if (onpick) { onpick(); }
          }
        }, [ic('mdi:' + n)]);
        btns.push(b);
        box.appendChild(b);
      });
      return box;
    }

    _choreForm(ch) {
      var self = this;
      var s = this._s;
      var c = ch || { name: '', icon: 'mdi:star', coins: 1, assignees: [], freq: 'daily', days: [], date: s.today, rotate: 'none' };
      var name = h('input', { cls: 'inp', type: 'text', value: c.name, placeholder: 'Quest name', maxlength: '40' });
      var iconIn = h('input', { cls: 'inp', type: 'text', value: c.icon, placeholder: 'mdi:icon-name' });
      var coins = c.coins;
      var coinNum = h('b', { text: String(coins) });
      var stepper = h('div', { cls: 'step2' }, [
        h('button', { cls: 'btn sm', type: 'button', text: '-', onclick: function () { coins = Math.max(0, coins - 1); coinNum.textContent = String(coins); } }),
        coinNum, coin(26),
        h('button', { cls: 'btn sm', type: 'button', text: '+', onclick: function () { coins = Math.min(100, coins + 1); coinNum.textContent = String(coins); } })
      ]);
      var who = picker(s.members.map(function (m) { return { v: m.id, label: m.name, color: m.color }; }), c.assignees, true);
      var slotsIn = h('input', { cls: 'inp', type: 'text', value: (c.slots || []).join(', '), placeholder: 'Blank = once a day' });
      var slotQuick = h('div', { cls: 'chips', style: 'margin-top:8px' });
      [['Once a day', ''], ['Morning + Night', 'Morning, Night'], ['Night only', 'Night'], ['Morning, Afternoon, Night', 'Morning, Afternoon, Night']].forEach(function (q) {
        slotQuick.appendChild(h('button', { cls: 'cp', type: 'button', text: q[0], onclick: function () { slotsIn.value = q[1]; } }));
      });
      var slotsBox = h('div', null, [slotsIn, slotQuick]);
      var claim = picker([{ v: 'each', label: 'Everyone assigned does it' }, { v: 'first', label: 'First to tap gets it' }], [c.claim === 'first' ? 'first' : 'each'], false);
      var daysRow = h('div');
      var dateRow = h('div');
      var freq = picker([{ v: 'daily', label: 'Every day' }, { v: 'days', label: 'Certain days' }, { v: 'once', label: 'One time' }], [c.freq], false, function (v) { showHide(v[0]); });
      var days = picker(DAYS.map(function (d, i) { return { v: i, label: d }; }), c.days || [], true);
      var dateIn = h('input', { cls: 'inp', type: 'date', value: c.date || s.today });
      daysRow.appendChild(field('Which days', days.el));
      dateRow.appendChild(field('Date', dateIn));
      var areaOpts = [{ v: '', label: 'No room' }].concat((s.areas || []).map(function (a) { return { v: a.id, label: a.name }; }));
      var areaPick = picker(areaOpts, [c.area || ''], false);
      var rotate = picker([{ v: 'none', label: 'Everyone does it' }, { v: 'daily', label: 'Turns - daily' }, { v: 'weekly', label: 'Turns - weekly' }], [c.rotate || 'none'], false);
      function showHide(f) {
        daysRow.style.display = f === 'days' ? '' : 'none';
        dateRow.style.display = f === 'once' ? '' : 'none';
      }
      showHide(c.freq);
      var actions = [{ label: 'Cancel', cls: 'alt' }];
      if (ch) {
        actions.push({ label: 'Delete', cls: 'no', fn: function () {
          self._confirm('Delete "' + ch.name + '"?', function () { return self._admin('delete_chore', { id: ch.id }); });
          return false;
        } });
      }
      actions.push({ label: 'Save', cls: 'go', fn: function () {
        return self._admin('save_chore', {
          id: ch ? ch.id : null, name: name.value, icon: iconIn.value, coins: coins,
          assignees: who.get(), freq: freq.get()[0] || 'daily', days: days.get(), date: dateIn.value, rotate: rotate.get()[0] || 'none',
          slots: slotsIn.value.split(',').map(function (x) { return x.trim(); }).filter(function (x) { return x; }),
          claim: claim.get()[0] || 'each', area: areaPick.get()[0] || ''
        });
      } });
      this._openModal({
        title: ch ? 'Edit quest' : 'New quest',
        body: [
          field('Name', name), field('Room', areaPick.el), field('Icon', this._iconGrid(CHORE_ICONS, iconIn)), field('Or type any mdi icon', iconIn),
          field('Coins earned', stepper), field('Who does it', who.el), field('How often', freq.el), daysRow, dateRow,
          field('Times per day (each one earns coins). Morning and Afternoon show during the day, Evening and Night show at night', slotsBox),
          field('Shared quests', rotate.el),
          field('Who gets the coins', claim.el)
        ],
        actions: actions
      });
    }

    _areaForm(a) {
      var self = this;
      var c = a || { name: '', group: '', icon: 'mdi:door' };
      var name = h('input', { cls: 'inp', type: 'text', value: c.name, placeholder: 'Room name', maxlength: '30' });
      var group = h('input', { cls: 'inp', type: 'text', value: c.group || '', placeholder: 'Group (e.g. Bathrooms)', maxlength: '20' });
      var quick = h('div', { cls: 'chips', style: 'margin-top:8px' });
      this._groups().forEach(function (g) {
        quick.appendChild(h('button', { cls: 'cp', type: 'button', text: g, onclick: function () { group.value = g; } }));
      });
      var iconIn = h('input', { cls: 'inp', type: 'text', value: c.icon });
      var actions = [{ label: 'Cancel', cls: 'alt' }];
      if (a) {
        actions.push({ label: 'Delete', cls: 'no', fn: function () {
          self._confirm('Delete "' + a.name + '"? Its quests stay, just without a room.', function () { return self._admin('delete_area', { id: a.id }); });
          return false;
        } });
      }
      actions.push({ label: 'Save', cls: 'go', fn: function () {
        return self._admin('save_area', { id: a ? a.id : null, name: name.value, group: group.value, icon: iconIn.value });
      } });
      this._openModal({
        title: a ? 'Edit room' : 'New room',
        body: [field('Name', name), field('Group (rooms sharing a group show under one button)', group), quick, field('Icon', this._iconGrid(AREA_ICONS, iconIn)), field('Or type any mdi icon', iconIn)],
        actions: actions
      });
    }

    _prizeForm(p) {
      var self = this;
      var c = p || { name: '', icon: 'mdi:gift', cost: 10 };
      var name = h('input', { cls: 'inp', type: 'text', value: c.name, placeholder: 'Prize name', maxlength: '40' });
      var iconIn = h('input', { cls: 'inp', type: 'text', value: c.icon });
      var cost = h('input', { cls: 'inp', type: 'number', value: String(c.cost), min: '1', max: '1000', inputmode: 'numeric' });
      var actions = [{ label: 'Cancel', cls: 'alt' }];
      if (p) {
        actions.push({ label: 'Delete', cls: 'no', fn: function () {
          self._confirm('Delete "' + p.name + '"?', function () { return self._admin('delete_prize', { id: p.id }); });
          return false;
        } });
      }
      actions.push({ label: 'Save', cls: 'go', fn: function () {
        return self._admin('save_prize', { id: p ? p.id : null, name: name.value, icon: iconIn.value, cost: parseInt(cost.value, 10) || 10 });
      } });
      this._openModal({
        title: p ? 'Edit prize' : 'New prize',
        body: [field('Name', name), field('Icon', this._iconGrid(PRIZE_ICONS, iconIn)), field('Or type any mdi icon', iconIn), field('Cost in coins', cost)],
        actions: actions
      });
    }

    _memberForm(m) {
      var self = this;
      var c = m || { name: '', role: 'kid', color: PALETTE[0], icon: 'mdi:racing-helmet' };
      var name = h('input', { cls: 'inp', type: 'text', value: c.name, placeholder: 'Name', maxlength: '20' });
      var role = picker([{ v: 'kid', label: 'Kid' }, { v: 'adult', label: 'Adult' }], [c.role], false);
      var color = c.color;
      var sws = h('div', { cls: 'chips' });
      var swBtns = [];
      PALETTE.forEach(function (col) {
        var b = h('button', { cls: 'sw' + (col === color ? ' on' : ''), type: 'button', style: 'background:' + col, onclick: function () {
          color = col;
          swBtns.forEach(function (x) { x.classList.remove('on'); });
          b.classList.add('on');
        } });
        swBtns.push(b);
        sws.appendChild(b);
      });
      var iconIn = h('input', { cls: 'inp', type: 'text', value: c.icon });
      var personOpts = [{ v: '', label: 'Match by name' }].concat(this._persons().map(function (x) { return { v: x.id, label: x.name }; }));
      var personPick = picker(personOpts, [c.person || ''], false);
      var actions = [{ label: 'Cancel', cls: 'alt' }];
      if (m) {
        actions.push({ label: 'Delete', cls: 'no', fn: function () {
          self._confirm('Delete ' + m.name + ' and their coins?', function () { return self._admin('delete_member', { id: m.id }); });
          return false;
        } });
      }
      actions.push({ label: 'Save', cls: 'go', fn: function () {
        return self._admin('save_member', { id: m ? m.id : null, name: name.value, role: role.get()[0] || 'kid', color: color, icon: iconIn.value, person: personPick.get()[0] || '' });
      } });
      this._openModal({
        title: m ? 'Edit racer' : 'New racer',
        body: [field('Name', name), field('Who', role.el), field('Logged-in person (opens on their name)', personPick.el), field('Color', sws), field('Avatar', this._iconGrid(AVATARS, iconIn)), field('Or type any mdi icon', iconIn)],
        actions: actions
      });
    }

    _adjustForm(m) {
      var self = this;
      var amt = h('input', { cls: 'inp', type: 'number', value: '1', inputmode: 'numeric' });
      var why = h('input', { cls: 'inp', type: 'text', placeholder: 'Reason (optional)', maxlength: '40' });
      var quick = h('div', { cls: 'chips' });
      [-5, -1, 1, 5, 10].forEach(function (n) {
        quick.appendChild(h('button', { cls: 'cp', type: 'button', text: (n > 0 ? '+' : '') + n, onclick: function () { amt.value = String(n); } }));
      });
      this._openModal({
        title: m.name + ' has ' + m.coins + ' coins',
        body: [field('Add or remove coins', amt), quick, field('Reason', why)],
        actions: [{ label: 'Cancel', cls: 'alt' }, { label: 'Apply', cls: 'go', fn: function () {
          return self._admin('adjust', { member_id: m.id, delta: parseInt(amt.value, 10) || 0, label: why.value });
        } }]
      });
    }

    _settingsForm() {
      var self = this;
      var st = this._s.settings;
      var pin = h('input', { cls: 'inp', type: 'text', inputmode: 'numeric', placeholder: 'Blank = no PIN', maxlength: '8' });
      var bonus = h('input', { cls: 'inp', type: 'number', value: String(st.all_done_bonus || 0), min: '0', max: '20', inputmode: 'numeric' });
      var svc = h('input', { cls: 'inp', type: 'text', value: st.notify_service || '', placeholder: 'notify.mobile_app_...' });
      var dayStart = h('input', { cls: 'inp', type: 'number', value: String(st.day_start_hour === undefined ? 2 : st.day_start_hour), min: '0', max: '6', inputmode: 'numeric' });
      var phaseIn = h('input', { cls: 'inp', type: 'text', value: st.phase_entity || '', placeholder: 'input_select.timeofday' });
      var phaseOn = picker([{ v: 'on', label: 'On - show only quests for now' }, { v: 'off', label: 'Off - show every quest' }], [st.phase_filter === false ? 'off' : 'on'], false);
      this._openModal({
        title: 'Settings',
        body: [
          field(st.has_pin ? 'New parent PIN (leave empty to keep)' : 'Parent PIN', pin),
          field('Bonus coins for clearing every quest (0 = off)', bonus),
          field('Notify when a prize is redeemed', svc),
          field('New chore day starts at (hour, 0 to 6)', dayStart),
          field('Day and night quests', phaseOn.el),
          field('Time of day entity (Morning/Afternoon = day, Evening/Night = night)', phaseIn)
        ],
        actions: [{ label: 'Cancel', cls: 'alt' }, { label: 'Save', cls: 'go', fn: function () {
          var payload = {
            all_done_bonus: parseInt(bonus.value, 10) || 0, notify_service: svc.value,
            day_start_hour: parseInt(dayStart.value, 10) || 0, phase_entity: phaseIn.value, phase_filter: (phaseOn.get()[0] || 'on') === 'on'
          };
          var newPin = pin.value.replace(/\D/g, '');
          if (newPin) { payload.pin = newPin; }
          return self._admin('set_settings', payload).then(function () {
            if (newPin) { self._pin = newPin; self._unlockUntil = Date.now() + 5 * 60000; }
          });
        } }]
      });
    }
  }

  if (!customElements.get('chore-quest-card')) { customElements.define('chore-quest-card', ChoreQuestCard); }
  window.customCards = window.customCards || [];
  window.customCards.push({ type: 'chore-quest-card', name: 'Chore Quest', description: 'Gaming themed chores and coins' });
})();
