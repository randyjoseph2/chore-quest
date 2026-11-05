# Changelog

## 3.6.1
- The Fine screen now has a red "trouble" look with a turning gear and a gavel on top, red selected buttons, and a red Fine button. Amounts show as negative (-1, -5, -10, -25) to read as a loss.
- New "Fined by" choice (the adults). When Randy or Sam opens it logged in, their own name is already selected; on the shared tablet nothing is selected, so a parent picks. The name is saved in History, the Nabu Flow banner and the `chore_quest_fined` event (`by`).
- The Coin bank header (Send coins and Fine buttons) is tidied: the buttons sit together on the right, and wrap neatly on narrow screens.

## 3.6.0
- **Fines.** A new Fine button (Cup tab and Parent tab, gavel icon) takes coins from a racer for bad behavior. Pick the racer, an amount, and a required reason (quick chips like "Not listening" or type your own). It uses the Parent PIN, same as Send coins, and the fine shows in Today's history in red.
- A fine raises a 15 minute alert in the Nabu Flow bar ("Parker fined 4 coins: Hitting"), the same way prizes do, and sends a Nabu Flow notification. Turn the alert off in Settings.
- A fine never takes more than the racer has (the balance stops at 0). Lifetime fined coins are tracked per racer.
- New `chore_quest_fined` event for automations.

## 3.5.3
- The card is now registered as a Lovelace dashboard resource (the same way HACS cards are), and kept up to date by the integration on every version. Before, it was injected as an extra page script, which could finish loading after the dashboard had drawn its cards, leaving the red "Custom element doesn't exist" box on the compact tile and the big chores page. If your Home Assistant uses YAML-mode resources, it falls back to the old way.
- Loading the card file twice (resource plus the old script) is now harmless.

## 3.5.2
- Reliability fixes for the compact (and full) card on dashboards:
  - If the first load fails (Home Assistant still starting, a websocket blip) the card now retries on its own with growing delays and shows "reconnecting" instead of sitting on "Loading..." for up to a minute.
  - The last good state is remembered in the browser, so the card draws instantly on page load and during a short outage instead of flashing empty.
  - The card file is now served with cache headers (the URL changes with every version), so phones and the wall tablet stop re-downloading 100 KB on every page load, which was the likeliest cause of the red "custom element doesn't exist" error on slow connections.
  - A failed render can no longer throw inside the dashboard's update loop.

## 3.5.1
- With `theme: dashboard` the card now stretches to fill the screen below the top bar (and follows window resizes), so the quest columns use the whole height instead of stopping part way. Set `fill: false` to turn it off.

## 3.5.0
- Prize notifications now go through Nabu Flow when it is installed: the `chore_quest` Discord channel plus a phone push, using your Nabu people, presence and quiet-mode rules. If Nabu Flow is missing, or the new setting is off (Parent > Settings), the old notify service is used as before.

## 3.4.0
- **Nabu Flow sync.** If Nabu Flow is installed, Chore Quest now talks to it:
  - An alert in the Nabu bar while quests are still open in the current day or night half ("13 quests left tonight (Parker 3, Jacob 4...)"). It clears itself when everyone is done.
  - A short alert when a prize is redeemed.
  - An optional Discord reminder (through your `chore_quest` channel) at a set time, only if quests are still open.
  - All three can be turned off, and the reminder time changed, under Parent > Settings.
- New sensor `sensor.chore_quest_open`: the number of open quests right now (a first-to-tap race counts once), with a per-person breakdown. Use it for Nabu Flow alert rules, the top bar badge or your own automations.

## 3.3.0
- New card option `theme: dashboard`. The card drops its own blue game background, checkered flag, logo, Home button and clock, and sits on the dashboard's own background. Tabs become the same pill style as the Nabu Flow top bar (accent `--cq-accent`, default gold, text `--cq-ink`). Panels turn into soft glass and text follows the dashboard theme. Meant for Tablet 5.0 / NextGen UI, where the top bar already provides navigation. The default look is unchanged.

## 3.2.1
- Fix: events are now fired from the correct thread, which removes the "calls async_fire from a thread other than the event loop" errors in the log.
- Fix: live updates now work for non-admin users (wall tablet user, family accounts). The card uses a new `chore_quest/subscribe` websocket command instead of a raw event subscription, which Home Assistant refuses for non-admins. Polling every 60 seconds remains as a fallback.

## 3.2.0
- Edit lifetime stats: a chart button on each racer in the admin Racers menu opens a form to correct coins earned, spent, gifts received and quests done (for testing leftovers or back pay). It only changes the stats, never the coin balance.
- New `chore_quest.set_stats` service and a `lifetime_gifted` sensor attribute.

## 3.1.0
- More stats on the Cup tab: completion rate over the last four weeks, average coins per week, favorite quest, race wins (first-to-tap), Grand Prix weekly wins, and a household line for the most bumped quest.
- Grand Prix wins are counted when each week closes, and counted back through your existing history the first time this version starts.

## 3.0.0
- **Lifetime stats** on the Cup tab: coins earned, coins spent, quests done, best day and best streak for every racer, with a crown on the top earner. The counters are kept forever in a few numbers per racer, so they stay tiny even as the history is trimmed. Existing history is counted in the first time this version starts.
- **Send coins.** A Send coins button on the Cup tab (and in the admin Racers menu) moves coins from one racer to another, for example paying the boys from a parent's balance, or hands coins out from the bank at no cost to anyone. A PIN is asked for when one is set. Transfers show in Today's history and do not count as earned, so the Earned stat stays honest. Racers get a Gifts line when they receive some.
- New sensor attributes: `lifetime_earned` and `lifetime_spent`.

## 2.12.0
- **Bump a quest.** A small skip button on each open quest takes it off today's list without awarding coins, after a quick confirmation. The quest counts disappear from that person's totals, and nothing is awarded for it. Bumps show in Today's history with an Undo button. Bumping a first-to-tap quest removes it for everyone. Tapping the quest again after an undo, or finishing it by service, brings it back.
- New `bump: false` card option hides the button.

## 2.11.4
- Fix intermittent iOS/Safari config error: replaced `if (!customElements.get(...))` guard with bare `customElements.define()`. The guarded form returns `undefined` on iOS WebView for already-registered elements, causing the define to never run and the card to fail with a config error on reload.

## 2.11.3
- Room filter counts (All, Kitchen, ...) now count only the quests due in the current half of the day, matching what is on screen.
- The Day/Night banner is a slim one-line bar everywhere. A style clash with the Week view's day rows made it tall on the tablet.

## 2.11.2
- Cup tab history now shows only the current chore day and starts fresh at the new-day hour.

## 2.11.1
- Fixed History day grouping: every entry, old or new, is now placed in its chore day from its timestamp, so after midnight and before 2 AM entries stay under Today instead of splitting into a second group. The weekly standings use the same rule.

## 2.11.0
- Cup tab: a History list under the Coin bank showing who did what, when, and how many coins it earned, grouped into Today and Yesterday, with a quiet note about when the new day starts.
- History entries are now dated by chore day, so a 1 AM quest counts for the day before.

## 2.10.0
- New **Every other day** frequency with a "last time it was done" date. The quest shows up two days after that date and every second day from there.

## 2.9.0
- Drag to reorganize quests in the admin Quests menu. Grab the handle on the left of a quest and drop it above or below another quest, or onto a room header to move it into that room. The order carries through to the family board.

## 2.8.3
- Admin Quests menu: each room header now has a small **Add quest** button that opens the quest form with that room selected. Rooms with no quests yet are listed too. The Rooms menu is back to plain rooms.

## 2.8.2
- Alternating weeks are now called **Week A** (off weekend) and **Week B** (work weekend) in the quest form, quest list and Settings. Settings shows which week it is now.

## 2.8.1
- Work and off weeks: Settings has one date that marks a week you work the weekend. Every other week quests can now be set to **Weeks I work weekends** or **Weeks I am off**, so the whole set flips together with one setting.

## 2.8.0
- New **Every other week** frequency: pick the days and which week is ON (this week or next) and the quest repeats on alternating weeks. Built for alternating work and off weekends.
- Admin Rooms menu: each room now lists its quests and has an **Add quest** button that opens the quest form with that room already chosen.

## 2.7.4
- GitHub releases are now published automatically for each new version, so HACS shows proper version numbers and these notes.

## 2.7.3
- Each person's header now shows how many of their quests are waiting for the other half of the day (for example "2 for tonight").

## 2.7.2
- Chore form: tap-to-toggle Morning, Afternoon, Evening and Night buttons (any combination, including Morning only) replace the fixed presets.

## 2.7.1
- New CQ icon and logo for the integration (shown in Settings > Devices & Services and HACS).
- Release notes file added so each update has readable highlights.

## 2.7.0
- New `mode: summary` overview tile for Home screens, with `open_path` to jump to the full page.

## 2.6.1
- The chore day now rolls over at 2 AM by default instead of midnight (setting: New chore day starts at). Night quests stay open until then.
- Admin dashboard remembers each menu's scroll position and reopens on the menu you were last using.

## 2.6.0
- Day and night quests: the family card shows only the quests for the current half of the day, from a time-of-day entity. Morning and Afternoon are day, Evening and Night are night. Taps on the other half are refused by the server.
- New `chores_left_now` sensor attribute.
- New Settings fields for the time-of-day entity and an on/off switch, plus a `phase_filter: false` card option.

## 2.5.2
- New `parent_tab: false` card option hides the Parent tab (use the admin dashboard instead).

## 2.5.1
- New `back_path` card option adds a Home button to the top bar, for kiosk layouts with no header.

## 2.5.0
- Packaged for HACS. The integration now serves its own card and loads it automatically; no Lovelace resource or `/config/www` copy is needed.

## 2.4.0
- Per-user snap: the card opens on the logged-in person's racer, and their column leads on the tablet.
- Admin layout (`mode: admin`) with Overview, Quests, Rooms, Prizes, Racers, History and Settings menus. Home Assistant admins skip the PIN there.
- Racers can be linked to a Home Assistant person.

## 2.3.1
- Manage Laundry is a universal daily quest. Take Out the Trash is a Tuesday first-to-tap quest.

## 2.3.0
- Rooms and groups with filter buttons on the Quests and Week tabs.
- New sample quests for bathrooms, bedrooms and each child's room.

## 2.2.0
- First-to-tap quests (the dishwasher race).

## 2.1.0
- Times per day (Morning and Night), adult sample quests, and rotating shared quests.

## 2.0.0
- Fixed, optional all-done bonus replaces random bonuses.
