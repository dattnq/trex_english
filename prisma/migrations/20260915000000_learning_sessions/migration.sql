BEGIN;
CREATE TABLE learning_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind "AttemptKind" NOT NULL,
  source_id TEXT NOT NULL,
  title TEXT NOT NULL,
  state JSONB NOT NULL CHECK (jsonb_typeof(state) = 'object'),
  created_at TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ(3) NOT NULL
);
CREATE INDEX learning_sessions_user_id_updated_at_idx
  ON learning_sessions(user_id, updated_at);
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts DROP CONSTRAINT attempts_snapshot_check;
ALTER TABLE attempts ADD CONSTRAINT attempts_snapshot_check
CHECK (CASE WHEN jsonb_typeof(questions) = 'array' THEN
  jsonb_array_length(questions) > 0 AND answers IS NOT NULL
  AND array_ndims(answers) = 1
  AND cardinality(answers) = jsonb_array_length(questions)
  AND array_position(answers, NULL) IS NULL
  AND -1 <= ALL(answers)
  AND score BETWEEN 0 AND jsonb_array_length(questions)
ELSE false END);
COMMIT;
