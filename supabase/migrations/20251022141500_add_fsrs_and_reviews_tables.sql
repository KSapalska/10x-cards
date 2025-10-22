-- migration: add fsrs columns to flashcards and create reviews table
-- purpose: enhance the flashcards table with spaced repetition fields and add a reviews table to track study history.

-- 1. alter flashcards table to add fsrs columns -----------------------------------------------
ALTER TABLE public.flashcards
ADD COLUMN IF NOT EXISTS due timestamptz NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS stability real,
ADD COLUMN IF NOT EXISTS difficulty real,
ADD COLUMN IF NOT EXISTS elapsed_days integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS scheduled_days integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS reps integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS lapses integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS state varchar(20) NOT NULL DEFAULT 'New' CHECK (state IN ('New', 'Learning', 'Review', 'Relearning')),
ADD COLUMN IF NOT EXISTS last_review timestamptz;

-- 2. create reviews table ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
    id bigserial PRIMARY KEY,
    flashcard_id bigint NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 4), -- 1:Again, 2:Hard, 3:Good, 4:Easy
    state_before varchar(20),
    state_after varchar(20),
    review_duration integer, -- review duration in milliseconds
    reviewed_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.reviews.rating IS 'User rating for the flashcard review. 1: Again, 2: Hard, 3: Good, 4: Easy';
COMMENT ON COLUMN public.reviews.review_duration IS 'Time in milliseconds spent on the flashcard before rating';

-- 3. enable row level security on reviews table ----------------------------------------------
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 4. add rls policies for reviews table -------------------------------------------------------
CREATE POLICY "Users can view their own reviews"
ON public.reviews FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reviews"
ON public.reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Note: Update and Delete policies are omitted as reviews should be immutable records of past events.

-- 5. add indexes for performance -------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_reviews_flashcard_id ON public.reviews(flashcard_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

-- 6. create rpc for transactional update -----------------------------------------------------
CREATE OR REPLACE FUNCTION rate_flashcard_and_log_review(
    p_flashcard_id bigint,
    p_user_id uuid,
    p_rating smallint,
    p_state_before text,
    p_state_after text,
    p_due timestamptz,
    p_stability real,
    p_difficulty real,
    p_elapsed_days integer,
    p_scheduled_days integer,
    p_reps integer,
    p_lapses integer,
    p_state text,
    p_last_review timestamptz
)
RETURNS SETOF flashcards AS $$
DECLARE
    updated_row flashcards;
BEGIN
    -- Update the flashcard's FSRS state
    UPDATE public.flashcards
    SET
        due = p_due,
        stability = p_stability,
        difficulty = p_difficulty,
        elapsed_days = p_elapsed_days,
        scheduled_days = p_scheduled_days,
        reps = p_reps,
        lapses = p_lapses,
        state = p_state,
        last_review = p_last_review
    WHERE id = p_flashcard_id AND user_id = p_user_id
    RETURNING * INTO updated_row;

    -- Insert a new record into the reviews table
    INSERT INTO public.reviews (
        flashcard_id,
        user_id,
        rating,
        state_before,
        state_after,
        reviewed_at
    )
    VALUES (
        p_flashcard_id,
        p_user_id,
        p_rating,
        p_state_before,
        p_state_after,
        NOW()
    );

    -- Return the updated flashcard row
    RETURN QUERY SELECT * FROM public.flashcards WHERE id = p_flashcard_id;
END;
$$ LANGUAGE plpgsql;
