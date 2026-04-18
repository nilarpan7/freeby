"""
Database Migration Script
Adds new fields to existing Task table and creates TaskApplication table
"""
import sqlite3
import os
from database.database import DATABASE_URL

def migrate_database():
    """Add new fields to Task table and create TaskApplication table"""
    
    # Extract database path from URL
    db_path = DATABASE_URL.replace('sqlite:///', '')
    
    if not os.path.exists(db_path):
        print(f"Database {db_path} does not exist. Creating new database with updated schema.")
        # If database doesn't exist, the models will create it with the new schema
        from database.database import init_db
        init_db()
        return
    
    print(f"Migrating database: {db_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if new columns exist
        cursor.execute("PRAGMA table_info(tasks)")
        columns = [column[1] for column in cursor.fetchall()]
        
        # Add new columns to tasks table if they don't exist
        new_columns = [
            ('min_karma', 'INTEGER DEFAULT 0'),
            ('reward_amount', 'REAL DEFAULT 0.0'),
            ('reward_karma', 'INTEGER DEFAULT 10'),
            ('figma_url', 'TEXT'),
            ('design_files', 'TEXT DEFAULT "[]"'),
            ('deadline', 'DATETIME')
        ]
        
        for column_name, column_def in new_columns:
            if column_name not in columns:
                print(f"Adding column: {column_name}")
                cursor.execute(f"ALTER TABLE tasks ADD COLUMN {column_name} {column_def}")
        
        # Create TaskApplication table if it doesn't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS task_applications (
                id TEXT PRIMARY KEY,
                task_id TEXT NOT NULL,
                student_id TEXT NOT NULL,
                application_text TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES tasks (id),
                FOREIGN KEY (student_id) REFERENCES users (id)
            )
        """)
        
        print("TaskApplication table created/verified")
        
        # Commit changes
        conn.commit()
        print("✅ Database migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()