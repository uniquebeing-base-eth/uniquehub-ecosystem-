
-- Add RLS policy for users to update their achievement claim status
CREATE POLICY "Users can claim their own achievements"
ON public.creator_achievements
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
