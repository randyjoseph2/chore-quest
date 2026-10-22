# Changelog

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
