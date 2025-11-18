-- Add foreign key relationship between pool_participants and profiles
ALTER TABLE public.pool_participants
ADD CONSTRAINT pool_participants_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Also add the same for other tables that reference user_id
ALTER TABLE public.user_learning_streaks
ADD CONSTRAINT user_learning_streaks_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.module_completions
ADD CONSTRAINT module_completions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.pool_module_completions
ADD CONSTRAINT pool_module_completions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.learning_pools
ADD CONSTRAINT learning_pools_created_by_fkey
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;