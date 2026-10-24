"""Add source-faithful COP31 programme entries to the idempotent production seed.

The source import remains an audit of all 688 programme rows. Two ceremonies
listed in both Brazil Pavilion rooms become one public event with both rooms.
Unknown organizer, event language and Turkish translation are never guessed.
"""

import csv
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SEED = ROOT / "data/cop31-events.json"
OUT = ROOT / "data/cop31-import-2026-10-24.json"
IMPORT = ROOT / "data/COP31_2026-10-24_site_import.csv"
AUDIT = ROOT / "data/COP31_2026-10-24_import_source_audit.csv"

SOURCE_NAMES = {
    "SEORS side event": ("UNFCCC resmî yan etkinlik", "UNFCCC official side event"),
    "GCA programme": ("Global Climate Action", "Global Climate Action"),
    "UN Climate Change Pavilion": ("UN Climate Change Pavilion", "UN Climate Change Pavilion"),
    "COP31 Presidency programme overview": ("COP31 Türkiye Başkanlığı", "COP31 Türkiye Presidency"),
    "Brazil Pavilion": ("Brezilya Pavyonu", "Brazil Pavilion"),
    "Regional Climate Foundations Pavilion": ("Regional Climate Foundations Pavyonu", "Regional Climate Foundations Pavilion"),
    "OECD COP31 Virtual Pavilion": ("OECD COP31 Sanal Pavyonu", "OECD COP31 Virtual Pavilion"),
}

ROOM_PAIRS = {
    "bra-2026-078": "bra-2026-005",
    "bra-2026-102": "bra-2026-029",
}

existing = json.loads(SEED.read_text(encoding="utf-8"))
source_rows = list(csv.DictReader(IMPORT.open(encoding="utf-8-sig", newline="")))
audit_rows = {row["slug"]: row for row in csv.DictReader(AUDIT.open(encoding="utf-8-sig", newline=""))}
by_slug = {row["slug"]: row for row in source_rows}

assert len(source_rows) == 688
assert len(existing) == 442
assert all(row["status"] == "DRAFT" for row in source_rows)
assert not ({row["slug"] for row in source_rows} & {row["slug"] for row in existing})

for omitted, retained in ROOM_PAIRS.items():
    first, second = by_slug[retained], by_slug[omitted]
    assert first["startsAt"] == second["startsAt"] and first["endsAt"] == second["endsAt"]
    first_content, second_content = json.loads(first["contentEn"]), json.loads(second["contentEn"])
    assert first_content["title"] == second_content["title"]
    assert first_content["organizers"] == second_content["organizers"]
    assert first_content["sourceUrl"] == second_content["sourceUrl"]

created_at = datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")
new_records = []
for row in source_rows:
    slug = row["slug"]
    if slug in ROOM_PAIRS:
        continue
    source = audit_rows[slug]["source"]
    tr_source, en_source = SOURCE_NAMES[source]
    en = json.loads(row["contentEn"])
    if slug in ROOM_PAIRS.values():
        counterpart = next(other for other, primary in ROOM_PAIRS.items() if primary == slug)
        other_venue = json.loads(by_slug[counterpart]["contentEn"])["venueName"]
        first_venue = en["venueName"]
        shared_prefix = "Antalya EXPO Center, Blue Zone — "
        assert first_venue.startswith(shared_prefix) and other_venue.startswith(shared_prefix)
        en["venueName"] = shared_prefix + first_venue[len(shared_prefix):] + " / " + other_venue[len(shared_prefix):]
        assert len(en["venueName"]) <= 160

    en["summary"] = f"Listed in the {en_source} COP31 programme."
    en["cop31Connection"] = "COP31 programme"
    en["officialStatus"] = "Listed in source programme"
    en.setdefault("organizers", [])
    en.setdefault("languages", [])
    en.setdefault("topics", [])

    tr = {key: value for key, value in en.items() if key != "description"}
    tr["summary"] = f"Başlık kaynak dilinde korunmuştur. Etkinlik {tr_source} COP31 programında listeleniyor."
    tr["cop31Connection"] = "COP31 programı"
    tr["officialStatus"] = "Kaynak programında listeleniyor"

    record = {
        "slug": slug,
        "contentTr": tr,
        "contentEn": en,
        "titleTr": tr["title"],
        "titleEn": en["title"],
        "summaryTr": tr["summary"],
        "summaryEn": en["summary"],
        "descriptionTr": None,
        "descriptionEn": en.get("description"),
        "startsAt": row["startsAt"],
        "endsAt": row["endsAt"] or None,
        "timeKnown": row["timeKnown"] == "true",
        "timezone": row["timezone"],
        "format": row["format"],
        "venueName": tr.get("venueName"),
        "venueAddress": None,
        "city": tr.get("city"),
        "country": tr.get("country"),
        "organizers": tr["organizers"],
        "organizerUrl": None,
        "languages": [],
        "topics": tr["topics"],
        "cop31Connection": tr["cop31Connection"],
        "registrationUrl": None,
        "informationUrl": None,
        "sourceUrl": en["sourceUrl"],
        "status": "PUBLISHED",
        "featured": False,
        "verifiedAt": row["verifiedAt"],
        "createdAt": created_at,
        "updatedAt": created_at,
    }
    assert len(tr["title"]) <= 160 and 20 <= len(tr["summary"]) <= 360
    assert len(en["title"]) <= 160 and 20 <= len(en["summary"]) <= 360
    assert record["sourceUrl"].startswith("https://")
    new_records.append(record)

assert len(new_records) == 686
assert len({row["slug"] for row in existing + new_records}) == len(existing) + len(new_records)
OUT.write_text(json.dumps(new_records, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print(json.dumps({"previously_published": len(existing), "newly_published": len(new_records), "total": len(existing) + len(new_records), "merged_room_pairs": ROOM_PAIRS}, ensure_ascii=False))
