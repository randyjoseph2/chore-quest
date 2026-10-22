<p align="center"><img src="https://raw.githubusercontent.com/randyjoseph2/chore-quest/main/icon.png" width="96" alt="Chore Quest"></p>

# Chore Quest

A gaming-themed family chore and rewards system for Home Assistant. Kids and adults tap quests to earn **coins** (Mario Kart style), then spend them in a prize shop. Everything runs inside Home Assistant: no cloud, no extra add-on, no YAML to maintain.

Built for a wall tablet and phones from a single card, with an admin-only sidebar dashboard for managing everything.

## Features

- **Tap to earn.** Coins are awarded the moment a quest is tapped (a trust system). Tap again to undo.
- **Racers.** Kids and adults each get a column or tab, with their own coin bank, daily progress and streak.
- **Flexible quests.** Every day, certain weekdays, or one time only. Up to four **times per day** (Morning, Night, ...) and each one earns coins.
- **Shared quests.** Assign a quest to several people and choose how it plays out:
  - everyone does it,
  - take turns daily or weekly,
  - **first to tap wins** (one person gets the coins, the others see "Sam got it").
- **Rooms and groups.** Organise quests by room (Kitchen, Boys Bath, ...) and group rooms (Bathrooms, Bedrooms, ...). Filter buttons on the Quests and Week tabs show what is still open per group.
- **Day and night quests.** Point Chore Quest at a time-of-day entity and the family card only shows (and only lets people tap) the quests for the current half of the day. Morning and Afternoon quests are the day half, Evening and Night quests are the night half. Quests with no time of day are always available.
- **Prize shop.** Parents add prizes with a coin cost. Redeeming can send a phone notification.
- **Week view and Cup.** A week-at-a-glance board and a standings screen.
- **Per-user snap.** When a logged-in person matches a racer, the card opens on their name (phone) or moves their column first with a YOU tag (tablet).
- **Admin dashboard.** A sidebar-ready layout with Overview, Quests, Rooms, Prizes, Racers, History and Settings menus. Skips the PIN for Home Assistant admins.
- **Optional bonuses.** A fixed bonus for clearing every quest in a day, plus streak tracking.
- **Automation friendly.** Services, events and per-racer sensors (see below).

## Installation

### With HACS (recommended)

1. HACS > three-dot menu > **Custom repositories**.
2. Add `https://github.com/randyjoseph2/chore-quest` with category **Integration**.
3. Install **Chore Quest** and restart Home Assistant.

Updates then appear in HACS like any other integration.

### Manual

Copy `custom_components/chore_quest` into your `/config/custom_components/` folder and restart.

The integration serves its own card and loads it on every dashboard automatically. You do not need to add a Lovelace resource.

> **Upgrading from a hand-installed copy?** Remove the old `/local/chore-quest-card.js` dashboard resource (Settings > Dashboards > Resources) so only one copy loads, and delete `/config/www/chore-quest-card.js`.

There is no config flow. The integration sets itself up when Home Assistant starts, and creates its sample data on first run.

## Adding the card

Add a **Panel** (single card) view and use:

```yaml
type: custom:chore-quest-card
```

The layout follows the card's width: under 720 px you get the phone layout with a bottom tab bar, wider gets the tablet layout with all racers side by side.

| Option | Values | Default | What it does |
|---|---|---|---|
| `layout` | `tablet`, `mobile` | auto | Force a layout instead of using the width. |
| `mode` | `admin` | none | Show the admin sidebar layout instead of the family view. |
| `snap` | `true`, `false` | `true` | Open on the logged-in person's racer. |
| `title` | text | Chore Quest | Header title. |
| `phase_filter` | `false` | on | Show every quest on this card, ignoring the time of day. |
| `parent_tab` | `false` | shown | Hide the Parent tab on the family card. |
| `mode` (summary) | `summary` | none | Compact overview tile for a Home screen: a coin and progress ring per racer, the day or night banner, and one tap to open the full page. |
| `open_path` | dashboard path, for example `/tablet-4-0/chores` | none | Where the summary tile navigates when tapped. |
| `back_path` | dashboard path, for example `/tablet-4-0/0` | none | Adds a Home button that navigates there. |

### Overview tile for a Home screen

```yaml
type: custom:chore-quest-card
mode: summary
open_path: /tablet-4-0/chores
grid_options:
  columns: full
  rows: auto
```

It shows each racer's progress ring, quests left for the current half of the day, and coins, and opens the full card when tapped.

### Admin dashboard

Create a dashboard (Settings > Dashboards), turn on **Show in sidebar** and **Require admin**, add a panel view, and use:

```yaml
type: custom:chore-quest-card
mode: admin
```

Calls from this card are trusted only when the logged-in user is a Home Assistant administrator, so the Parent PIN is skipped there and nowhere else.

## Setting it up

Open the **Parent** tab on the family card, or the admin dashboard:

1. **Racers.** Add or edit people. Set each adult's **Logged-in person** or leave it on "Match by name".
2. **Rooms.** Add rooms and give them a group name so they share a filter button.
3. **Quests.** Pick icon, coins, who does it, room, how often and times per day.
4. **Prizes.** Add rewards and costs.
5. **Settings.** Optional Parent PIN (for the family card), all-done bonus, and a `notify.*` service for prize alerts.

## Day and night quests

Chore Quest reads one entity that reports the time of day, for example an `input_select` or sensor with the states Morning, Afternoon, Evening and Night. Only the first word matters, so values like `Morning` or `Night` with an emoji after them also work.

| Entity state | Counts as |
|---|---|
| Morning, Afternoon (also Day, AM) | day |
| Evening, Night (also PM) | night |

A quest's time of day is its **Times per day** label. A quest with the label `Morning` shows only during the day, and one labelled `Night` shows only at night. Labels it does not recognise, and quests with no label, are always available.

- The Quests tab shows a Day or Night banner with a count of quests waiting for the other half.
- The server also refuses a tap on a quest from the other half, so it cannot be done early or late.
- The Week view always shows everything.
- The `chore_quest.complete_chore` service skips the check, so automations can award any quest at any time.
- If the entity is missing or has an unrecognised state, nothing is hidden.
- The chore day rolls over at 2 AM by default (not midnight), so the day half starts together with a new day's quests. Change this with **New chore day starts at** in Settings (0 to 6).
- Turn it off, or change the entity, under **Settings** in the Parent tab or the admin dashboard. The default entity is `input_select.timeofday`.

## Sensors

One sensor per racer: `sensor.chore_quest_<name>_coins`.

| Attribute | Meaning |
|---|---|
| state | Current coin balance |
| `streak` | Days in a row with every quest done |
| `chores_left` / `chores_total` | Today's open and total quests |
| `chores_left_now` | Open quests that can be done in the current half of the day |
| `role` | `kid` or `adult` |
| `member_id`, `date` | Racer id, current day |

## Services

### `chore_quest.add_coins`

| Field | Description |
|---|---|
| `member` | Racer id or name |
| `amount` | Coins to add (negative removes) |
| `reason` | Shown in History |

### `chore_quest.complete_chore`

| Field | Description |
|---|---|
| `member` | Racer id or name |
| `chore` | Quest id or name |
| `slot` | Optional time of day, 0 is the first |

Example: give the coins when a trash reminder is acknowledged.

```yaml
action: chore_quest.complete_chore
data:
  member: randy
  chore: Take Out the Trash
```

## Events

| Event | When |
|---|---|
| `chore_quest_updated` | Anything changed (the cards listen to this) |
| `chore_quest_redeemed` | A prize was redeemed |

## Data and backups

Everything is stored in `/config/.storage/chore_quest` and is included in normal Home Assistant backups. Upgrades migrate the data in place and never re-add a starter quest you deleted.

## Development notes

- The card is plain JavaScript in a Shadow DOM, with no build step.
- The card avoids template literals and emoji (iOS WebView and Shadow DOM quirks), using `ha-icon` and inline SVG instead.
- Publish a release by bumping `version` in `manifest.json`, adding a line to `CHANGELOG.md`, then tagging the same version, for example `v2.5.0`.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).
