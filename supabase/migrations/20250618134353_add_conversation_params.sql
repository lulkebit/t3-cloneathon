ALTER TABLE conversations
ADD COLUMN temperature REAL,
ADD COLUMN top_p REAL,
ADD COLUMN min_p REAL,
ADD COLUMN seed INTEGER,
ADD COLUMN system_prompt TEXT;
