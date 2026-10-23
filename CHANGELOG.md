# Changelog

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
