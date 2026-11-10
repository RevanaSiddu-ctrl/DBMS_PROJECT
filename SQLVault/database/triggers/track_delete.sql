-- Track DELETEs on the SQLVault demo table.
DROP TRIGGER IF EXISTS students_track_delete ON public.students;

CREATE TRIGGER students_track_delete
AFTER DELETE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.track_changes('id');
