-- Track UPDATEs on the SQLVault demo table.
DROP TRIGGER IF EXISTS students_track_update ON public.students;

CREATE TRIGGER students_track_update
AFTER UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.track_changes('id');
