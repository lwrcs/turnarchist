-- UUID extension.
create extension if not exists "uuid-ossp";

-- Create `set_updated_at` psql function
create or replace function set_updated_at()
    returns trigger as
$$
begin
    NEW.updated_at = now();
    return NEW;
end;
$$ language plpgsql;


-- While `created_at` can just be `default now()`, setting `updated_at` on update requires a trigger which
-- is a lot of boilerplate. These two functions save us from writing that every time as instead we can just do
--
-- select trigger_updated_at('<table name>');
--
-- after a `CREATE TABLE`.
create or replace function trigger_updated_at(tablename regclass)
    returns void as
$$
begin
    execute format('CREATE TRIGGER set_updated_at
        BEFORE UPDATE
        ON %s
        FOR EACH ROW
        WHEN (OLD is distinct from NEW)
    EXECUTE FUNCTION set_updated_at();', tablename);
end;
$$ language plpgsql;
