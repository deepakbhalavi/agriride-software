"""
AgriRide - SQLite to MySQL Data Migration Script

Usage:
    python migrate_sqlite_to_mysql.py

What it does:
  1. Connects to SQLite (agriride.db) and MySQL (agriride_db)
  2. Migrates all 11 tables in dependency order
  3. Preserves all IDs and relationships
  4. Skips tables that already have data (safe to re-run)
"""

import sqlite3
import pymysql
import sys

# Config
SQLITE_PATH = "agriride.db"
MYSQL_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "",
    "database": "agriride_db",
    "charset": "utf8mb4",
}

# Tables in dependency order (parents before children)
TABLES = [
    "users",
    "farmers",
    "drivers",
    "vehicles",
    "bookings",
    "shared_trips",
    "trip_bookings",
    "cost_allocations",
    "payments",
    "notifications",
    "matching_config",
]

def get_sqlite_rows(sqlite_conn, table):
    cursor = sqlite_conn.cursor()
    try:
        cursor.execute(f"SELECT * FROM {table}")
        cols = [d[0] for d in cursor.description]
        rows = cursor.fetchall()
        return cols, rows
    except sqlite3.OperationalError as e:
        print(f"  WARNING: SQLite table '{table}' not found or error: {e}")
        return [], []

def get_mysql_count(mysql_conn, table):
    with mysql_conn.cursor() as cur:
        cur.execute(f"SELECT COUNT(*) FROM `{table}`")
        return cur.fetchone()[0]

def migrate_table(sqlite_conn, mysql_conn, table):
    cols, rows = get_sqlite_rows(sqlite_conn, table)
    if not cols:
        return 0
    if not rows:
        print(f"  SKIP '{table}' - no data in SQLite")
        return 0
    existing = get_mysql_count(mysql_conn, table)
    if existing > 0:
        print(f"  SKIP '{table}' - already has {existing} rows in MySQL")
        return 0
    col_names = ", ".join(f"`{c}`" for c in cols)
    placeholders = ", ".join(["%s"] * len(cols))
    sql = f"INSERT INTO `{table}` ({col_names}) VALUES ({placeholders})"
    with mysql_conn.cursor() as cur:
        cur.execute("SET FOREIGN_KEY_CHECKS=0")
        try:
            cur.executemany(sql, rows)
            mysql_conn.commit()
        except Exception as e:
            mysql_conn.rollback()
            print(f"  ERROR inserting into '{table}': {e}")
            return 0
        finally:
            cur.execute("SET FOREIGN_KEY_CHECKS=1")
    print(f"  OK '{table}' - migrated {len(rows)} rows")
    return len(rows)

def main():
    print("=" * 50)
    print("  AgriRide: SQLite to MySQL Migration")
    print("=" * 50)
    try:
        sqlite_conn = sqlite3.connect(SQLITE_PATH)
        print(f"\nConnected to SQLite: {SQLITE_PATH}")
    except Exception as e:
        print(f"ERROR: Cannot open SQLite '{SQLITE_PATH}': {e}")
        sys.exit(1)
    try:
        mysql_conn = pymysql.connect(**MYSQL_CONFIG)
        print(f"Connected to MySQL: {MYSQL_CONFIG['database']}@{MYSQL_CONFIG['host']}\n")
    except Exception as e:
        print(f"ERROR: Cannot connect to MySQL: {e}")
        sqlite_conn.close()
        sys.exit(1)
    total = 0
    for table in TABLES:
        print(f"Migrating '{table}' ...")
        count = migrate_table(sqlite_conn, mysql_conn, table)
        total += count
    sqlite_conn.close()
    mysql_conn.close()
    print("\n" + "=" * 50)
    print(f"  Migration complete! Total rows: {total}")
    print("=" * 50)

if __name__ == "__main__":
    main()
