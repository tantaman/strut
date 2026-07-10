-- 0010_generated_stylesheet
-- AI-authored theme CSS lives in its own deck layer. It renders before custom_stylesheet so a user's
-- hand-authored CSS always wins, and can be replaced/reset without touching user work.
ALTER TABLE deck ADD COLUMN generated_stylesheet TEXT NOT NULL DEFAULT '';
