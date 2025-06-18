ALTER TABLE profiles
ADD COLUMN default_temperature REAL,
ADD COLUMN default_top_p REAL,
ADD COLUMN default_min_p REAL,
ADD COLUMN default_seed INTEGER,
ADD COLUMN default_system_prompt TEXT;
