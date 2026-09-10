import sqlite3
conn = sqlite3.connect('agriride.db')
cur = conn.cursor()
tables = cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").fetchall()
print("=" * 40)
print(" AgriRide Database Contents")
print("=" * 40)
for t in tables:
    count = cur.execute(f"SELECT COUNT(*) FROM {t[0]}").fetchone()[0]
    print(f"  {t[0]:25s} -> {count} rows")
conn.close()
