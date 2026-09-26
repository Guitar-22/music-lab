-- Music Industry Lap — ฐานข้อมูลรวมจาก portal/*.js และเอกสารวิจัย 01–25
PRAGMA foreign_keys = ON;

CREATE TABLE categories (
  id    TEXT PRIMARY KEY,
  label TEXT NOT NULL
);

CREATE TABLE resources (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  owner         TEXT NOT NULL,
  url           TEXT NOT NULL CHECK (url LIKE 'https://%'),
  source_url    TEXT NOT NULL CHECK (source_url LIKE 'https://%'),
  category_id   TEXT NOT NULL REFERENCES categories(id),
  goal          TEXT NOT NULL,
  first_step    TEXT NOT NULL,
  cost          TEXT NOT NULL CHECK (cost IN ('free','freemium','trial','paid','subscription','varies')),
  cost_text     TEXT NOT NULL,
  account       TEXT NOT NULL,
  device        TEXT NOT NULL,
  language      TEXT NOT NULL,
  thai          INTEGER NOT NULL CHECK (thai IN (0,1)),
  no_instrument INTEGER NOT NULL CHECK (no_instrument IN (0,1)),
  checked       TEXT NOT NULL,
  note          TEXT NOT NULL,
  source_type   TEXT NOT NULL,
  guide_what    TEXT NOT NULL,
  guide_best    TEXT NOT NULL,
  guide_limit   TEXT NOT NULL,
  guide_next    TEXT NOT NULL
);

CREATE TABLE resource_guide_steps (
  resource_id TEXT NOT NULL REFERENCES resources(id),
  position    INTEGER NOT NULL,
  step        TEXT NOT NULL,
  PRIMARY KEY (resource_id, position)
);

CREATE TABLE resource_alternates (
  resource_id TEXT NOT NULL REFERENCES resources(id),
  name        TEXT NOT NULL,
  url         TEXT NOT NULL CHECK (url LIKE 'https://%'),
  PRIMARY KEY (resource_id, url)
);

CREATE TABLE resource_previews (
  resource_id TEXT PRIMARY KEY REFERENCES resources(id),
  image_url   TEXT NOT NULL,
  source_url  TEXT NOT NULL,
  credit      TEXT,
  kind        TEXT
);

CREATE TABLE rankings (
  id       TEXT PRIMARY KEY,
  title    TEXT NOT NULL,
  audience TEXT,
  basis    TEXT
);

CREATE TABLE ranking_picks (
  ranking_id   TEXT NOT NULL REFERENCES rankings(id),
  position     INTEGER NOT NULL,
  resource_id  TEXT NOT NULL REFERENCES resources(id),
  reason       TEXT,
  evidence     TEXT,
  evidence_url TEXT,
  confidence   TEXT,
  PRIMARY KEY (ranking_id, position)
);

CREATE TABLE universities (
  id         INTEGER PRIMARY KEY,
  name       TEXT NOT NULL,
  faculty    TEXT NOT NULL,
  province   TEXT NOT NULL,
  region     TEXT NOT NULL,
  levels     TEXT NOT NULL,
  url        TEXT NOT NULL,
  extra_url  TEXT,
  note       TEXT,
  UNIQUE (name, faculty)
);

CREATE TABLE university_majors (
  university_id INTEGER NOT NULL REFERENCES universities(id),
  major         TEXT NOT NULL,
  PRIMARY KEY (university_id, major)
);

CREATE TABLE school_groups (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  type        TEXT NOT NULL,
  area        TEXT NOT NULL,
  url         TEXT NOT NULL,
  locator_url TEXT,
  note        TEXT
);

CREATE TABLE school_genres (
  school_id INTEGER NOT NULL REFERENCES school_groups(id),
  genre     TEXT NOT NULL,
  PRIMARY KEY (school_id, genre)
);

CREATE TABLE school_branches (
  school_id INTEGER NOT NULL REFERENCES school_groups(id),
  branch    TEXT NOT NULL,
  PRIMARY KEY (school_id, branch)
);

CREATE TABLE zones (
  id   TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE districts (
  name    TEXT PRIMARY KEY,
  zone_id TEXT NOT NULL REFERENCES zones(id)
);

CREATE TABLE documents (
  file  TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  bytes INTEGER NOT NULL
);

CREATE TABLE doc_tables (
  id       INTEGER PRIMARY KEY,
  file     TEXT NOT NULL REFERENCES documents(file),
  heading  TEXT,
  line     INTEGER NOT NULL,
  headers  TEXT NOT NULL -- JSON array
);

CREATE TABLE doc_table_rows (
  table_id  INTEGER NOT NULL REFERENCES doc_tables(id),
  row_index INTEGER NOT NULL,
  cells     TEXT NOT NULL, -- JSON object {header: value}
  PRIMARY KEY (table_id, row_index)
);

CREATE TABLE doc_links (
  id      INTEGER PRIMARY KEY,
  file    TEXT NOT NULL REFERENCES documents(file),
  line    INTEGER NOT NULL,
  heading TEXT,
  text    TEXT,
  url     TEXT NOT NULL
);

CREATE TABLE gate_runs (
  id       INTEGER PRIMARY KEY,
  run_at   TEXT NOT NULL,
  gate     TEXT NOT NULL,
  pass     INTEGER NOT NULL,
  errors   TEXT NOT NULL,
  warnings TEXT NOT NULL,
  stats    TEXT NOT NULL
);

CREATE INDEX idx_resources_category ON resources(category_id);
CREATE INDEX idx_districts_zone ON districts(zone_id);
CREATE INDEX idx_doc_links_url ON doc_links(url);

-- มุมมองที่ใช้บ่อย: ทุก URL ในโครงการพร้อมที่มา สำหรับไล่ตรวจลิงก์
CREATE VIEW all_urls AS
  SELECT url, 'resource' AS kind, id AS ref FROM resources
  UNION ALL SELECT source_url, 'resource_source', id FROM resources
  UNION ALL SELECT url, 'resource_alternate', resource_id FROM resource_alternates
  UNION ALL SELECT evidence_url, 'ranking_evidence', ranking_id || '/' || resource_id FROM ranking_picks
  UNION ALL SELECT url, 'university', name FROM universities
  UNION ALL SELECT extra_url, 'university_extra', name FROM universities WHERE extra_url IS NOT NULL
  UNION ALL SELECT url, 'school', name FROM school_groups
  UNION ALL SELECT locator_url, 'school_locator', name FROM school_groups WHERE locator_url IS NOT NULL
  UNION ALL SELECT url, 'document', file || ':' || line FROM doc_links;

-- ===== สถานที่รายเขต (OSM + ค้นเว็บ) =====
CREATE TABLE district_progress (
  district       TEXT PRIMARY KEY REFERENCES districts(name),
  wave           INTEGER NOT NULL,
  status         TEXT NOT NULL CHECK (status IN ('not_started','osm_only','researched')),
  osm_fetched_at TEXT,
  researched_at  TEXT,
  osm_places     INTEGER NOT NULL,
  web_places     INTEGER NOT NULL,
  chain_places   INTEGER NOT NULL DEFAULT 0,
  gaps           TEXT NOT NULL -- JSON array
);

CREATE TABLE district_shapes (
  district TEXT PRIMARY KEY REFERENCES districts(name),
  osm_rel  INTEGER NOT NULL,
  rings    TEXT NOT NULL -- JSON [[[lon,lat],...],...]
);

CREATE TABLE places (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  name_en     TEXT,
  kind        TEXT NOT NULL,
  layer       TEXT NOT NULL,
  district    TEXT NOT NULL REFERENCES districts(name),
  lat         REAL,
  lon         REAL,
  address     TEXT,
  geocode     TEXT,
  phone       TEXT,
  website     TEXT,
  hours       TEXT,
  source      TEXT NOT NULL CHECK (source IN ('osm','web','chain')),
  source_url  TEXT NOT NULL,
  license     TEXT,
  evidence    TEXT,
  checked     TEXT,
  review_note TEXT,
  -- ขั้นตรวจบริบท (lib/context.cjs): verified/reviewed/tagged/lead แสดงได้; name_only/generic/conflict รอคนตรวจ
  context     TEXT NOT NULL CHECK (context IN ('verified','reviewed','tagged','lead','name_only','generic','conflict')),
  context_note TEXT
);

CREATE TABLE place_social (
  place_id TEXT NOT NULL REFERENCES places(id),
  url      TEXT NOT NULL,
  PRIMARY KEY (place_id, url)
);

CREATE TABLE place_offer (
  place_id TEXT NOT NULL REFERENCES places(id),
  item     TEXT NOT NULL,
  PRIMARY KEY (place_id, item)
);

CREATE TABLE place_rejects (
  id       TEXT PRIMARY KEY,
  district TEXT NOT NULL REFERENCES districts(name),
  reason   TEXT NOT NULL,
  note     TEXT
);

CREATE INDEX idx_places_district ON places(district);
CREATE INDEX idx_places_kind ON places(kind);
