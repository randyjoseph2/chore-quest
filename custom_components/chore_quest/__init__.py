"""Chore Quest: a gaming-themed chore and coin tracker for Home Assistant."""
from __future__ import annotations

import datetime as dt
import logging
import re
import uuid
from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, ServiceCall
import homeassistant.helpers.config_validation as cv
from homeassistant.helpers.event import async_track_time_change
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util, slugify

_LOGGER = logging.getLogger(__name__)

DOMAIN = "chore_quest"
CONFIG_SCHEMA = cv.empty_config_schema(DOMAIN)

STORAGE_VERSION = 1
VERSION = "2.7.1"
SCHEMA = 4
EVENT_UPDATED = "chore_quest_updated"
EVENT_REDEEMED = "chore_quest_redeemed"
LEDGER_MAX = 1500
KEEP_DAYS = 120
EARN_KINDS = {"chore", "bonus", "undo", "bonus_undo"}
ADMIN_ACTIONS = {
    "verify_pin",
    "save_chore",
    "delete_chore",
    "save_member",
    "delete_member",
    "save_prize",
    "delete_prize",
    "save_area",
    "delete_area",
    "adjust",
    "set_settings",
}

DAY_WORDS = {"morning", "afternoon", "day", "am"}
NIGHT_WORDS = {"evening", "night", "pm"}

DEFAULT_SETTINGS = {
    "day_start_hour": 2,
    "phase_entity": "input_select.timeofday",
    "phase_filter": True,
    "pin": "",
    "all_done_bonus": 0,
    "notify_service": "notify.mobile_app_randys_iphone",
}


def phase_of_text(text: Any) -> str | None:
    """Map a slot label or a time-of-day state to "day" or "night" (None = not time bound).

    Matches on the first word, so "Morning", "morning" and "Morning (sun emoji)" all count.
    """
    m = re.match(r"[a-z]+", str(text or "").strip().lower())
    word = m.group(0) if m else ""
    if word in DAY_WORDS:
        return "day"
    if word in NIGHT_WORDS:
        return "night"
    return None


def _uid() -> str:
    return uuid.uuid4().hex[:8]


def _clean_str(value: Any, limit: int = 40) -> str:
    return str(value or "").strip()[:limit]


def _clean_int(value: Any, lo: int, hi: int, default: int = 0) -> int:
    try:
        number = int(value)
    except (TypeError, ValueError):
        number = default
    return max(lo, min(hi, number))


def _starter_areas() -> list[dict]:
    return [
        {"id": "kitchen", "name": "Kitchen", "group": "Kitchen", "icon": "mdi:silverware-fork-knife"},
        {"id": "living", "name": "Living & Dining", "group": "Living Area", "icon": "mdi:sofa"},
        {"id": "bath_down", "name": "Downstairs Bath", "group": "Bathrooms", "icon": "mdi:toilet"},
        {"id": "bath_boys", "name": "Boys Bath", "group": "Bathrooms", "icon": "mdi:bathtub-outline"},
        {"id": "bath_master", "name": "Master Bath", "group": "Bathrooms", "icon": "mdi:shower"},
        {"id": "bed_master", "name": "Master Bedroom", "group": "Bedrooms", "icon": "mdi:bed-king"},
        {"id": "bed_parker", "name": "Parker's Room", "group": "Bedrooms", "icon": "mdi:bed"},
        {"id": "bed_jacob", "name": "Jacob's Room", "group": "Bedrooms", "icon": "mdi:teddy-bear"},
    ]


def _starter_chores() -> list[dict]:
    base = {"freq": "daily", "days": [], "date": "", "claim": "each", "rotate": "none", "slots": []}

    def mk(seed, name, icon, coins, assignees, area, **kw):
        return dict(base, id=_uid(), seed=seed, name=name, icon=icon, coins=coins,
                    assignees=assignees, area=area, **kw)

    kids = ["parker", "jacob"]
    adults = ["randy", "sam"]
    return [
        mk("brush_teeth", "Brush Teeth", "mdi:toothbrush", 1, kids, "bath_boys", slots=["Morning", "Night"]),
        mk("toys_vacuum", "Clean Up Toys & Start Robot Vacuum", "mdi:robot-vacuum", 2, adults, "living",
           rotate="daily", slots=["Night"]),
        mk("dishwasher", "Manage Dishwasher", "mdi:dishwasher", 1, adults, "kitchen",
           slots=["Morning", "Night"], claim="first"),
        mk("bath_toys", "Put Bath Toys Away", "mdi:duck", 1, kids, "bath_boys", slots=["Night"]),
        mk("bath_down", "Wipe Down Downstairs Bath", "mdi:toilet", 3, adults, "bath_down",
           freq="days", days=[5], rotate="weekly"),
        mk("bath_boys", "Wipe Down Boys Bath", "mdi:bathtub-outline", 3, adults, "bath_boys",
           freq="days", days=[6], rotate="weekly"),
        mk("bath_master", "Wipe Down Master Bath", "mdi:shower", 3, ["sam", "randy"], "bath_master",
           freq="days", days=[5], rotate="weekly"),
        mk("bed_master_make", "Make the Bed", "mdi:bed-king", 1, adults, "bed_master", slots=["Morning"]),
        mk("laundry", "Manage Laundry", "mdi:washing-machine", 1, ["sam", "randy"], "bed_master"),
        mk("trash", "Take Out the Trash", "mdi:trash-can", 2, ["randy", "sam"], "",
           freq="days", days=[1], claim="first"),
        mk("parker_bed", "Make Bed", "mdi:bed", 1, ["parker"], "bed_parker", slots=["Morning"]),
        mk("parker_toys", "Toys in the Bin", "mdi:toy-brick", 1, ["parker"], "bed_parker", slots=["Night"]),
        mk("jacob_toys", "Toys in the Bin", "mdi:toy-brick", 1, ["jacob"], "bed_jacob", slots=["Night"]),
        mk("jacob_hamper", "Clothes in the Hamper", "mdi:tshirt-crew", 1, ["jacob"], "bed_jacob", slots=["Night"]),
    ]


def _default_data() -> dict[str, Any]:
    return {
        "members": [
            {"id": "parker", "name": "Parker", "role": "kid", "color": "#3b82f6", "icon": "mdi:racing-helmet", "coins": 0},
            {"id": "jacob", "name": "Jacob", "role": "kid", "color": "#22c55e", "icon": "mdi:dinosaur", "coins": 0},
            {"id": "randy", "name": "Randy", "role": "adult", "color": "#ff9f1a", "icon": "mdi:rocket-launch", "coins": 0},
            {"id": "sam", "name": "Sam", "role": "adult", "color": "#a855f7", "icon": "mdi:star-face", "coins": 0},
        ],
        "chores": _starter_chores(),
        "areas": _starter_areas(),
        "prizes": [
            {"id": _uid(), "name": "Pick the Movie", "icon": "mdi:movie-open", "cost": 10},
            {"id": _uid(), "name": "Ice Cream Trip", "icon": "mdi:ice-cream", "cost": 25},
            {"id": _uid(), "name": "Stay Up Late", "icon": "mdi:alarm-plus", "cost": 15},
            {"id": _uid(), "name": "New Toy", "icon": "mdi:teddy-bear", "cost": 60},
        ],
        "completions": {},
        "bonuses": {},
        "streaks": {},
        "ledger": [],
        "schema": SCHEMA,
        "seeded": [c["seed"] for c in _starter_chores()],
        "settings": dict(DEFAULT_SETTINGS),
    }


class ChoreQuest:
    """Holds all data and game logic."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self.store = Store(hass, STORAGE_VERSION, DOMAIN)
        self.data: dict[str, Any] = {}
        self._sensor_ids: set[str] = set()
        self._phase_unsub = None
        self._roll_unsub = None

    # ------------------------------------------------------------ storage
    async def async_load(self) -> None:
        data = await self.store.async_load()
        if not data:
            data = _default_data()
        for key in ("members", "chores", "prizes", "ledger", "areas"):
            data.setdefault(key, [])
        for key in ("completions", "bonuses", "streaks"):
            data.setdefault(key, {})
        if data.get("schema", 1) < SCHEMA:
            self._migrate(data)
            data["schema"] = SCHEMA
        settings = dict(DEFAULT_SETTINGS)
        settings.update(data.get("settings") or {})
        settings.pop("bonus_table", None)
        settings.pop("streak_bonus", None)
        data["settings"] = settings
        self.data = data
        self._prune()
        self.save()

    @staticmethod
    def _migrate(data: dict) -> None:
        """Idempotent upgrades: time slots (2.1), claim races (2.2), rooms + starter chores (2.3)."""
        schema = data.get("schema", 1)
        if not data.get("areas"):
            data["areas"] = _starter_areas()
        legacy = {
            "brush teeth": "brush_teeth",
            "clean up toys & start robot vacuum": "toys_vacuum",
            "manage dishwasher": "dishwasher",
        }
        for ch in data["chores"]:
            seed = legacy.get(ch["name"].lower())
            if seed and not ch.get("seed"):
                ch["seed"] = seed
        for ch in data["chores"]:
            if ch.get("seed") == "bed_master_laundry":
                ch.update({"seed": "laundry", "name": "Manage Laundry", "icon": "mdi:washing-machine", "coins": 1,
                           "freq": "daily", "days": [], "rotate": "none", "claim": "each", "slots": []})
        seeded_old = set(data.get("seeded") or [])
        if "bed_master_laundry" in seeded_old:
            seeded_old.discard("bed_master_laundry")
            seeded_old.add("laundry")
            data["seeded"] = sorted(seeded_old)
        areas = {a["id"] for a in data["areas"]}
        starters = {c["seed"]: c for c in _starter_chores()}
        for ch in data["chores"]:
            st = starters.get(ch.get("seed"))
            if not st:
                continue
            if ch["seed"] == "brush_teeth" and not ch.get("slots"):
                ch["slots"] = list(st["slots"])
            if ch["seed"] == "dishwasher" and "claim" not in ch:
                ch["claim"] = "first"
            if not ch.get("area") and st["area"] in areas:
                ch["area"] = st["area"]
        seeded = set(data.get("seeded") or [])
        seeded.add("brush_teeth")
        if schema >= 2:
            seeded |= {"toys_vacuum", "dishwasher"}
        have = {ch.get("seed") for ch in data["chores"]}
        member_ids = {m["id"] for m in data["members"]}
        for seed, st in starters.items():
            if seed in seeded or seed in have:
                continue
            st["assignees"] = [a for a in st["assignees"] if a in member_ids]
            if st["assignees"]:
                if st["area"] not in areas:
                    st["area"] = ""
                data["chores"].append(st)
            seeded.add(seed)
        data["seeded"] = sorted(seeded)

    def save(self) -> None:
        self.store.async_delay_save(lambda: self.data, 1)

    def _prune(self) -> None:
        cutoff = (self.today() - dt.timedelta(days=KEEP_DAYS)).isoformat()
        for bucket in ("completions", "bonuses"):
            self.data[bucket] = {k: v for k, v in self.data[bucket].items() if k.split("|")[0] >= cutoff}
        self.data["ledger"] = self.data["ledger"][-LEDGER_MAX:]

    # ------------------------------------------------------------ lookups
    def phase(self) -> str | None:
        """Current "day" or "night" from the time-of-day entity; None when unknown or off."""
        s = self.data["settings"]
        eid = s.get("phase_entity") or ""
        if not eid or s.get("phase_filter") is False:
            return None
        st = self.hass.states.get(eid)
        return phase_of_text(st.state) if st is not None else None

    def track_phase(self) -> None:
        """Refresh sensors and the cards whenever the time-of-day entity changes."""
        from homeassistant.helpers.event import async_track_state_change_event

        if self._phase_unsub:
            self._phase_unsub()
            self._phase_unsub = None
        eid = self.data["settings"].get("phase_entity") or ""
        if not eid:
            return

        def changed(_event) -> None:
            self.publish_states()
            self.hass.bus.async_fire(EVENT_UPDATED, {"action": "phase"})

        self._phase_unsub = async_track_state_change_event(self.hass, [eid], changed)

    def today(self) -> dt.date:
        """The chore day. It rolls over at day_start_hour (default 2 AM), not at midnight."""
        start = _clean_int((self.data.get("settings") or {}).get("day_start_hour"), 0, 6, 0)
        return (dt_util.now() - dt.timedelta(hours=start)).date()

    def track_rollover(self) -> None:
        """Start the new chore day at day_start_hour."""
        if self._roll_unsub:
            self._roll_unsub()
            self._roll_unsub = None
        start = _clean_int(self.data["settings"].get("day_start_hour"), 0, 6, 0)

        def rolled(_now) -> None:
            self.publish_states()
            self.hass.bus.async_fire(EVENT_UPDATED, {"action": "new_day"})

        self._roll_unsub = async_track_time_change(self.hass, rolled, hour=start, minute=0, second=5)

    def member(self, mid: Any) -> dict | None:
        for m in self.data["members"]:
            if m["id"] == mid:
                return m
        return None

    def chore(self, cid: Any) -> dict | None:
        for c in self.data["chores"]:
            if c["id"] == cid:
                return c
        return None

    def prize(self, pid: Any) -> dict | None:
        for p in self.data["prizes"]:
            if p["id"] == pid:
                return p
        return None

    def area(self, aid: Any) -> dict | None:
        for a in self.data["areas"]:
            if a["id"] == aid:
                return a
        return None

    def find_member(self, ref: str) -> dict | None:
        ref = str(ref).strip().lower()
        for m in self.data["members"]:
            if m["id"] == ref or m["name"].lower() == ref:
                return m
        return None

    def find_chore(self, ref: str) -> dict | None:
        ref = str(ref).strip().lower()
        for c in self.data["chores"]:
            if c["id"] == ref or c["name"].lower() == ref:
                return c
        return None

    # ------------------------------------------------------------ schedule
    @staticmethod
    def _key(day: dt.date, cid: str, mid: str, slot: int = 0) -> str:
        base = "%s|%s|%s" % (day.isoformat(), cid, mid)
        return "%s|%d" % (base, slot) if slot else base

    @staticmethod
    def slots_of(ch: dict) -> list[str]:
        slots = [s for s in (ch.get("slots") or []) if s]
        return slots or [""]

    def _label(self, ch: dict, slot: int) -> str:
        slots = self.slots_of(ch)
        label = slots[slot] if slot < len(slots) else ""
        return "%s (%s)" % (ch["name"], label) if label else ch["name"]

    def is_active(self, ch: dict, day: dt.date) -> bool:
        freq = ch.get("freq", "daily")
        if freq == "daily":
            return True
        if freq == "days":
            return day.weekday() in ch.get("days", [])
        if freq == "once":
            return ch.get("date") == day.isoformat()
        return False

    def assignees_on(self, ch: dict, day: dt.date) -> list[str]:
        pool = [m for m in ch.get("assignees", []) if self.member(m)]
        if not pool or not self.is_active(ch, day):
            return []
        rotate = ch.get("rotate", "none")
        if rotate == "none":
            return pool
        if rotate == "daily":
            idx = day.toordinal()
        else:
            monday = day - dt.timedelta(days=day.weekday())
            idx = monday.toordinal() // 7
        return [pool[idx % len(pool)]]

    def due(self, day: dt.date) -> list[dict]:
        out = []
        done = self.data["completions"]
        for ch in self.data["chores"]:
            slots = self.slots_of(ch)
            who = self.assignees_on(ch, day)
            race = ch.get("claim") == "first" and len(who) > 1
            for idx, label in enumerate(slots):
                owner = ""
                if race:
                    for mid in who:
                        if self._key(day, ch["id"], mid, idx) in done:
                            owner = mid
                            break
                for mid in who:
                    mine = self._key(day, ch["id"], mid, idx) in done
                    out.append(
                        {
                            "chore_id": ch["id"],
                            "member_id": mid,
                            "slot": idx,
                            "label": label,
                            "phase": phase_of_text(label),
                            "done": mine,
                            "taken_by": owner if owner and owner != mid and not mine else "",
                        }
                    )
        return out

    def all_done(self, mid: str, day: dt.date) -> bool:
        mine = [i for i in self.due(day) if i["member_id"] == mid and not i["taken_by"]]
        return bool(mine) and all(i["done"] for i in mine)

    def streak_now(self, mid: str) -> int:
        s = self.data["streaks"].get(mid)
        if not s or not s.get("last"):
            return 0
        today = self.today()
        if s["last"] in (today.isoformat(), (today - dt.timedelta(days=1)).isoformat()):
            return int(s.get("count", 0))
        return 0

    # ------------------------------------------------------------ ledger
    def log(self, mid: str, delta: int, kind: str, label: str) -> None:
        now = dt_util.now()
        self.data["ledger"].append(
            {
                "ts": now.isoformat(),
                "date": now.date().isoformat(),
                "member": mid,
                "delta": delta,
                "kind": kind,
                "label": label,
            }
        )
        if len(self.data["ledger"]) > LEDGER_MAX:
            self.data["ledger"] = self.data["ledger"][-LEDGER_MAX:]

    def _standings(self) -> dict:
        today = self.today()
        week_start = today - dt.timedelta(days=today.weekday())
        last_start = week_start - dt.timedelta(days=7)
        cur = {m["id"]: 0 for m in self.data["members"]}
        last = dict(cur)
        for e in self.data["ledger"]:
            if e["kind"] not in EARN_KINDS or e["member"] not in cur:
                continue
            try:
                day = dt.date.fromisoformat(e["date"])
            except ValueError:
                continue
            if day >= week_start:
                cur[e["member"]] += e["delta"]
            elif day >= last_start:
                last[e["member"]] += e["delta"]
        ranked = sorted(cur.items(), key=lambda kv: -kv[1])
        champ = None
        if last and max(last.values()) > 0:
            best = max(last.items(), key=lambda kv: kv[1])
            champ = {"member_id": best[0], "coins": best[1]}
        return {
            "week_start": week_start.isoformat(),
            "this_week": [{"member_id": k, "coins": max(0, v)} for k, v in ranked],
            "last_champion": champ,
        }

    # ------------------------------------------------------------ state
    def state(self) -> dict:
        today = self.today()
        monday = today - dt.timedelta(days=today.weekday())
        dates = [(monday + dt.timedelta(days=i)).isoformat() for i in range(7)]
        week = {d: self.due(dt.date.fromisoformat(d)) for d in dates}
        cur = self.phase()
        members = []
        for m in self.data["members"]:
            mine = [i for i in week[today.isoformat()] if i["member_id"] == m["id"] and not i["taken_by"]]
            members.append(
                dict(
                    m,
                    streak=self.streak_now(m["id"]),
                    total=len(mine),
                    left=len([i for i in mine if not i["done"]]),
                    left_now=len([i for i in mine if not i["done"] and (not cur or not i["phase"] or i["phase"] == cur)]),
                )
            )
        settings = {k: v for k, v in self.data["settings"].items() if k != "pin"}
        settings["has_pin"] = bool(self.data["settings"].get("pin"))
        return {
            "version": VERSION,
            "today": today.isoformat(),
            "phase": cur,
            "week_dates": dates,
            "members": members,
            "chores": self.data["chores"],
            "areas": self.data["areas"],
            "prizes": self.data["prizes"],
            "settings": settings,
            "week": week,
            "standings": self._standings(),
            "recent": list(reversed(self.data["ledger"][-60:])),
        }

    def publish_states(self) -> None:
        """Expose per-member sensors so automations can use coins and chores left."""
        today = self.today().isoformat()
        wanted = set()
        for m in self.state()["members"]:
            entity_id = "sensor.chore_quest_%s_coins" % slugify(m["name"])
            wanted.add(entity_id)
            self.hass.states.async_set(
                entity_id,
                m["coins"],
                {
                    "friendly_name": "%s coins" % m["name"],
                    "unit_of_measurement": "coins",
                    "icon": "mdi:star-circle",
                    "member_id": m["id"],
                    "role": m["role"],
                    "streak": m["streak"],
                    "chores_total": m["total"],
                    "chores_left": m["left"],
                    "chores_left_now": m["left_now"],
                    "date": today,
                },
            )
        for stale in self._sensor_ids - wanted:
            self.hass.states.async_remove(stale)
        self._sensor_ids = wanted

    # ------------------------------------------------------------ actions
    async def async_action(self, action: str, payload: dict, pin: str, trusted: bool = False) -> dict:
        settings_pin = self.data["settings"].get("pin", "")
        if action in ADMIN_ACTIONS and settings_pin and pin != settings_pin and not trusted:
            raise ValueError("bad_pin")
        handler = getattr(self, "_a_" + action, None)
        if handler is None:
            raise ValueError("Unknown action")
        result = handler(payload or {})
        if hasattr(result, "__await__"):
            result = await result
        if action != "get":
            self.save()
            self.publish_states()
            self.hass.bus.async_fire(EVENT_UPDATED, {"action": action})
        return {"state": self.state(), "result": result or {}}

    def _a_get(self, p: dict) -> dict:
        return {}

    def _a_verify_pin(self, p: dict) -> dict:
        return {}

    def _a_complete(self, p: dict) -> dict:
        ch = self.chore(p.get("chore_id"))
        m = self.member(p.get("member_id"))
        if not ch or not m:
            raise ValueError("Unknown chore or member")
        return self.complete(ch, m, _clean_int(p.get("slot"), 0, 9, 0), enforce_phase=not p.get("force"))

    def complete(self, ch: dict, m: dict, slot: int = 0, enforce_phase: bool = True) -> dict:
        today = self.today()
        if m["id"] not in self.assignees_on(ch, today) or slot >= len(self.slots_of(ch)):
            raise ValueError("That quest is not on the board today")
        if enforce_phase:
            cur = self.phase()
            want = phase_of_text(self.slots_of(ch)[slot])
            if cur and want and want != cur:
                raise ValueError("That quest is for the %s" % ("day" if want == "day" else "night"))
        key = self._key(today, ch["id"], m["id"], slot)
        if key in self.data["completions"]:
            return {"already": True}
        if ch.get("claim") == "first":
            for other in self.assignees_on(ch, today):
                if other != m["id"] and self._key(today, ch["id"], other, slot) in self.data["completions"]:
                    om = self.member(other)
                    raise ValueError("%s already did that one" % (om["name"] if om else "Someone"))
        coins = int(ch.get("coins", 1))
        self.data["completions"][key] = {"coins": coins, "ts": dt_util.now().isoformat()}
        m["coins"] += coins
        self.log(m["id"], coins, "chore", self._label(ch, slot))
        result = {"coins": coins, "bonus": 0, "streak": self.streak_now(m["id"]), "member_id": m["id"]}
        bonus_key = "%s|%s" % (today.isoformat(), m["id"])
        if self.all_done(m["id"], today) and bonus_key not in self.data["bonuses"]:
            streaks = self.data["streaks"]
            prev = dict(streaks.get(m["id"], {"count": 0, "last": None}))
            yesterday = (today - dt.timedelta(days=1)).isoformat()
            count = prev.get("count", 0) + 1 if prev.get("last") == yesterday else 1
            streaks[m["id"]] = {"count": count, "last": today.isoformat()}
            amount = _clean_int(self.data["settings"].get("all_done_bonus"), 0, 20, 0)
            if amount > 0:
                m["coins"] += amount
                self.log(m["id"], amount, "bonus", "All quests cleared")
            self.data["bonuses"][bonus_key] = {"amount": amount, "prev": prev}
            result.update(bonus=amount, streak=count, all_done=True)
        return result

    def _a_uncomplete(self, p: dict) -> dict:
        ch = self.chore(p.get("chore_id"))
        m = self.member(p.get("member_id"))
        if not ch or not m:
            raise ValueError("Unknown chore or member")
        today = self.today()
        slot = _clean_int(p.get("slot"), 0, 9, 0)
        key = self._key(today, ch["id"], m["id"], slot)
        rec = self.data["completions"].pop(key, None)
        if not rec:
            return {}
        coins = int(rec.get("coins", 0))
        m["coins"] = max(0, m["coins"] - coins)
        self.log(m["id"], -coins, "undo", self._label(ch, slot))
        bonus_key = "%s|%s" % (today.isoformat(), m["id"])
        bonus = self.data["bonuses"].get(bonus_key)
        if bonus and not self.all_done(m["id"], today):
            m["coins"] = max(0, m["coins"] - int(bonus.get("amount", 0)))
            self.log(m["id"], -int(bonus.get("amount", 0)), "bonus_undo", "Bonus removed")
            self.data["streaks"][m["id"]] = bonus.get("prev", {"count": 0, "last": None})
            del self.data["bonuses"][bonus_key]
        return {}

    async def _a_redeem(self, p: dict) -> dict:
        prize = self.prize(p.get("prize_id"))
        m = self.member(p.get("member_id"))
        if not prize or not m:
            raise ValueError("Unknown prize or member")
        cost = int(prize["cost"])
        if m["coins"] < cost:
            raise ValueError("Not enough coins yet")
        m["coins"] -= cost
        self.log(m["id"], -cost, "redeem", prize["name"])
        self.hass.bus.async_fire(
            EVENT_REDEEMED,
            {"member": m["name"], "member_id": m["id"], "prize": prize["name"], "cost": cost},
        )
        await self._notify("Prize redeemed", "%s spent %d coins on %s" % (m["name"], cost, prize["name"]))
        return {"prize": prize["name"], "cost": cost}

    async def _notify(self, title: str, message: str) -> None:
        service = self.data["settings"].get("notify_service", "")
        if not service or "." not in service:
            return
        domain, name = service.split(".", 1)
        if not self.hass.services.has_service(domain, name):
            return
        try:
            await self.hass.services.async_call(domain, name, {"title": title, "message": message}, blocking=False)
        except Exception:  # noqa: BLE001
            _LOGGER.warning("Chore Quest could not send notification via %s", service)

    def _a_save_chore(self, p: dict) -> dict:
        name = _clean_str(p.get("name"))
        if not name:
            raise ValueError("Quest needs a name")
        ch = None
        if p.get("id"):
            ch = self.chore(p["id"])
            if not ch:
                raise ValueError("Unknown quest")
        new = ch is None
        if new:
            ch = {"id": _uid()}
        freq = p.get("freq") if p.get("freq") in ("daily", "days", "once") else "daily"
        days = sorted({_clean_int(d, 0, 6) for d in (p.get("days") or [])})
        date = _clean_str(p.get("date"), 10)
        if freq == "days" and not days:
            raise ValueError("Pick at least one day")
        if freq == "once":
            try:
                dt.date.fromisoformat(date)
            except ValueError as err:
                raise ValueError("Pick a date") from err
        ch.update(
            {
                "name": name,
                "icon": _clean_str(p.get("icon"), 60) or "mdi:star",
                "slots": [s for s in (_clean_str(x, 12) for x in (p.get("slots") or [])) if s][:4],
                "claim": "first" if p.get("claim") == "first" else "each",
                "area": p.get("area") if self.area(p.get("area")) else "",
                "coins": _clean_int(p.get("coins"), 0, 100, 1),
                "assignees": [m for m in (p.get("assignees") or []) if self.member(m)],
                "freq": freq,
                "days": days,
                "date": date if freq == "once" else "",
                "rotate": p.get("rotate") if p.get("rotate") in ("none", "daily", "weekly") else "none",
            }
        )
        if new:
            self.data["chores"].append(ch)
        return {"id": ch["id"]}

    def _a_delete_chore(self, p: dict) -> dict:
        self.data["chores"] = [c for c in self.data["chores"] if c["id"] != p.get("id")]
        return {}

    def _a_save_member(self, p: dict) -> dict:
        name = _clean_str(p.get("name"), 20)
        if not name:
            raise ValueError("Racer needs a name")
        m = self.member(p.get("id")) if p.get("id") else None
        if p.get("id") and not m:
            raise ValueError("Unknown racer")
        new = m is None
        if new:
            base = slugify(name) or _uid()
            mid, n = base, 2
            while self.member(mid):
                mid = "%s_%d" % (base, n)
                n += 1
            m = {"id": mid, "coins": 0}
        color = str(p.get("color") or "")
        m.update(
            {
                "name": name,
                "role": "adult" if p.get("role") == "adult" else "kid",
                "color": color if re.fullmatch(r"#[0-9a-fA-F]{6}", color) else "#3b82f6",
                "icon": _clean_str(p.get("icon"), 60) or "mdi:account",
                "person": (str(p.get("person")) if re.fullmatch(r"person\.[a-z0-9_]+", str(p.get("person") or "")) else ""),
            }
        )
        if new:
            self.data["members"].append(m)
        return {"id": m["id"]}

    def _a_delete_member(self, p: dict) -> dict:
        mid = p.get("id")
        self.data["members"] = [m for m in self.data["members"] if m["id"] != mid]
        for ch in self.data["chores"]:
            ch["assignees"] = [a for a in ch.get("assignees", []) if a != mid]
        self.data["streaks"].pop(mid, None)
        return {}

    def _a_save_prize(self, p: dict) -> dict:
        name = _clean_str(p.get("name"))
        if not name:
            raise ValueError("Prize needs a name")
        prize = None
        if p.get("id"):
            prize = self.prize(p["id"])
            if not prize:
                raise ValueError("Unknown prize")
        new = prize is None
        if new:
            prize = {"id": _uid()}
        prize.update(
            {
                "name": name,
                "icon": _clean_str(p.get("icon"), 60) or "mdi:gift",
                "cost": _clean_int(p.get("cost"), 1, 1000, 10),
            }
        )
        if new:
            self.data["prizes"].append(prize)
        return {"id": prize["id"]}

    def _a_delete_prize(self, p: dict) -> dict:
        self.data["prizes"] = [x for x in self.data["prizes"] if x["id"] != p.get("id")]
        return {}

    def _a_save_area(self, p: dict) -> dict:
        name = _clean_str(p.get("name"), 30)
        if not name:
            raise ValueError("Room needs a name")
        a = self.area(p.get("id")) if p.get("id") else None
        if p.get("id") and not a:
            raise ValueError("Unknown room")
        new = a is None
        if new:
            a = {"id": _uid()}
        a.update(
            {
                "name": name,
                "group": _clean_str(p.get("group"), 20),
                "icon": _clean_str(p.get("icon"), 60) or "mdi:door",
            }
        )
        if new:
            self.data["areas"].append(a)
        return {"id": a["id"]}

    def _a_delete_area(self, p: dict) -> dict:
        aid = p.get("id")
        self.data["areas"] = [a for a in self.data["areas"] if a["id"] != aid]
        for ch in self.data["chores"]:
            if ch.get("area") == aid:
                ch["area"] = ""
        return {}

    def _a_adjust(self, p: dict) -> dict:
        m = self.member(p.get("member_id"))
        if not m:
            raise ValueError("Unknown racer")
        delta = _clean_int(p.get("delta"), -1000, 1000, 0)
        if delta == 0:
            raise ValueError("Enter an amount")
        applied = max(-m["coins"], delta)
        m["coins"] += applied
        self.log(m["id"], applied, "adjust", _clean_str(p.get("label"), 40) or "Parent adjustment")
        return {}

    def _a_set_settings(self, p: dict) -> dict:
        s = self.data["settings"]
        if "pin" in p:
            pin = re.sub(r"\D", "", str(p.get("pin") or ""))[:8]
            s["pin"] = pin
        if "all_done_bonus" in p:
            s["all_done_bonus"] = _clean_int(p.get("all_done_bonus"), 0, 20, 0)
        if "phase_entity" in p:
            eid = str(p.get("phase_entity") or "").strip().lower()
            s["phase_entity"] = eid if re.fullmatch(r"[a-z_]+\.[a-z0-9_]+", eid) else ""
            self.track_phase()
        if "day_start_hour" in p:
            s["day_start_hour"] = _clean_int(p.get("day_start_hour"), 0, 6, 2)
            self.track_rollover()
        if "phase_filter" in p:
            s["phase_filter"] = bool(p.get("phase_filter"))
        if "notify_service" in p:
            s["notify_service"] = _clean_str(p.get("notify_service"), 80)
        return {}


async def _async_register_card(hass: HomeAssistant) -> None:
    """Serve the Lovelace card from this integration and load it on every dashboard."""
    from pathlib import Path

    from homeassistant.components.frontend import add_extra_js_url
    from homeassistant.components.http import StaticPathConfig

    path = Path(__file__).parent / "www" / "chore-quest-card.js"
    url = "/chore_quest/chore-quest-card.js"
    await hass.http.async_register_static_paths([StaticPathConfig(url, str(path), False)])
    add_extra_js_url(hass, "%s?v=%s" % (url, VERSION))


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    try:
        await _async_register_card(hass)
    except Exception:  # noqa: BLE001 - the card is a convenience, never block the integration
        _LOGGER.exception("Chore Quest could not register its card; add /local/chore-quest-card.js as a resource instead")
    mgr = ChoreQuest(hass)
    await mgr.async_load()
    hass.data[DOMAIN] = mgr

    @websocket_api.websocket_command(
        {
            vol.Required("type"): "chore_quest/action",
            vol.Required("action"): str,
            vol.Optional("payload", default={}): dict,
            vol.Optional("pin", default=""): str,
            vol.Optional("as_admin", default=False): bool,
        }
    )
    @websocket_api.async_response
    async def ws_action(hass: HomeAssistant, connection, msg: dict) -> None:
        try:
            trusted = bool(msg["as_admin"] and connection.user and connection.user.is_admin)
            result = await mgr.async_action(msg["action"], msg["payload"], msg["pin"], trusted)
        except ValueError as err:
            connection.send_error(msg["id"], "chore_quest_error", str(err))
            return
        connection.send_result(msg["id"], result)

    websocket_api.async_register_command(hass, ws_action)

    async def svc_add_coins(call: ServiceCall) -> None:
        m = mgr.find_member(call.data["member"])
        if not m:
            raise ValueError("Unknown member %s" % call.data["member"])
        await mgr.async_action(
            "adjust",
            {"member_id": m["id"], "delta": call.data["amount"], "label": call.data.get("reason", "Automation")},
            mgr.data["settings"].get("pin", ""),
        )

    async def svc_complete(call: ServiceCall) -> None:
        m = mgr.find_member(call.data["member"])
        ch = mgr.find_chore(call.data["chore"])
        if not m or not ch:
            raise ValueError("Unknown member or chore")
        await mgr.async_action(
            "complete", {"chore_id": ch["id"], "member_id": m["id"], "slot": call.data.get("slot", 0), "force": True}, ""
        )

    hass.services.async_register(
        DOMAIN,
        "add_coins",
        svc_add_coins,
        schema=vol.Schema(
            {
                vol.Required("member"): cv.string,
                vol.Required("amount"): vol.Coerce(int),
                vol.Optional("reason"): cv.string,
            }
        ),
    )
    hass.services.async_register(
        DOMAIN,
        "complete_chore",
        svc_complete,
        schema=vol.Schema(
            {
                vol.Required("member"): cv.string,
                vol.Required("chore"): cv.string,
                vol.Optional("slot"): vol.Coerce(int),
            }
        ),
    )

    mgr.track_rollover()
    mgr.track_phase()
    mgr.publish_states()
    return True
