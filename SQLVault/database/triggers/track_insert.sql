-- Track INSERTs on the SQLVault demo table. DROP first so setup can be rerun
-- without installing duplicate triggers.
DROP TRIGGER IF EXISTS students_track_insert ON public.students;

CREATE TRIGGER students_track_insert
AFTER INSERT ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.track_changes('id');
