-- Domain and payload rules that complement the keys defined in schema.sql.

ALTER TABLE users
    ADD CONSTRAINT users_username_not_blank_check
        CHECK (length(btrim(username)) > 0),
    ADD CONSTRAINT users_email_not_blank_check
        CHECK (length(btrim(email)) > 0);

ALTER TABLE repositories
    ADD CONSTRAINT repositories_name_not_blank_check
        CHECK (length(btrim(name)) > 0);

ALTER TABLE branches
    ADD CONSTRAINT branches_name_not_blank_check
        CHECK (length(btrim(name)) > 0);

ALTER TABLE commits
    ADD CONSTRAINT commits_message_not_blank_check
        CHECK (length(btrim(message)) > 0);

ALTER TABLE change_sets
    ADD CONSTRAINT change_sets_status_check
        CHECK (status IN ('OPEN', 'COMMITTED'));

ALTER TABLE pending_changes
    ADD CONSTRAINT pending_changes_operation_check
        CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    ADD CONSTRAINT pending_changes_table_name_not_blank_check
        CHECK (length(btrim(table_name)) > 0),
    ADD CONSTRAINT pending_changes_record_id_not_blank_check
        CHECK (length(btrim(record_id)) > 0),
    ADD CONSTRAINT pending_changes_data_matches_operation_check
        CHECK (
            (operation = 'INSERT' AND old_data IS NULL AND new_data IS NOT NULL)
            OR (operation = 'UPDATE' AND old_data IS NOT NULL AND new_data IS NOT NULL)
            OR (operation = 'DELETE' AND old_data IS NOT NULL AND new_data IS NULL)
        );

ALTER TABLE record_versions
    ADD CONSTRAINT record_versions_operation_check
        CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    ADD CONSTRAINT record_versions_table_name_not_blank_check
        CHECK (length(btrim(table_name)) > 0),
    ADD CONSTRAINT record_versions_record_id_not_blank_check
        CHECK (length(btrim(record_id)) > 0),
    ADD CONSTRAINT record_versions_data_matches_operation_check
        CHECK (
            (operation = 'INSERT' AND old_data IS NULL AND new_data IS NOT NULL)
            OR (operation = 'UPDATE' AND old_data IS NOT NULL AND new_data IS NOT NULL)
            OR (operation = 'DELETE' AND old_data IS NOT NULL AND new_data IS NULL)
        );
