import pytest
from db.initDatabase import sanitize_string, format_value, build_query
from uuid import UUID
from datetime import datetime, date


class TestSanitizeString:
    def test_escapes_backslash(self):
        assert sanitize_string('test\\path') == 'test\\\\path'

    def test_escapes_quotes(self):
        assert sanitize_string('say "hello"') == 'say \\"hello\\"'

    def test_escapes_both(self):
        assert sanitize_string('end\\') == 'end\\\\'

    def test_injection_attempt_backslash_quote(self):
        # This would break out of string if not properly escaped
        assert sanitize_string('x\\"') == 'x\\\\\\"'


class TestFormatValue:
    def test_string(self):
        assert format_value('hello') == '"hello"'

    def test_uuid(self):
        uuid = UUID('12345678-1234-5678-1234-567812345678')
        assert format_value(uuid) == '"12345678-1234-5678-1234-567812345678"'

    def test_int(self):
        assert format_value(42) == '42'

    def test_float(self):
        assert format_value(3.14) == '3.14'

    def test_bool_true(self):
        assert format_value(True) == 'true'

    def test_bool_false(self):
        assert format_value(False) == 'false'

    def test_datetime(self):
        dt = datetime(2024, 1, 15, 10, 30, 0)
        assert format_value(dt) == '2024-01-15T10:30:00'

    def test_date(self):
        d = date(2024, 1, 15)
        assert format_value(d) == '2024-01-15'

    def test_list(self):
        assert format_value([1, 2, 3]) == '[1, 2, 3]'

    def test_list_of_strings(self):
        assert format_value(['a', 'b']) == '["a", "b"]'

    def test_none_raises_error(self):
        with pytest.raises(ValueError, match="format_value received None"):
            format_value(None)


class TestBuildQueryValidation:
    """Tests for build_query parameter validation"""

    def test_duplicate_placeholder_raises(self):
        template = 'match $x isa task, has id ~id, has name ~id;'  # ~id used twice
        with pytest.raises(ValueError, match="Duplicate placeholders"):
            build_query(template, {'id': 'abc'}, allow_none=False)

    def test_unused_param_raises(self):
        template = 'match $x isa task, has id ~id;'
        with pytest.raises(ValueError, match="Unused parameters"):
            build_query(template, {'id': 'abc', 'extra': 'value'}, allow_none=False)

    def test_missing_param_raises(self):
        template = 'match $x isa task, has id ~id, has name ~name;'
        with pytest.raises(ValueError, match="Missing parameters"):
            build_query(template, {'id': 'abc'}, allow_none=False)  # missing 'name'

    def test_empty_params_with_placeholders_raises(self):
        template = 'match $x isa task, has id ~id;'
        with pytest.raises(ValueError, match="Missing parameters"):
            build_query(template, {}, allow_none=False)


class TestBuildQueryReadMode:
    """Tests for build_query with allow_none=False (read transactions)"""

    def test_substitutes_params(self):
        template = 'match $x isa task, has id ~id;'
        result = build_query(template, {'id': 'abc'}, allow_none=False)
        assert result == 'match $x isa task, has id "abc";'

    def test_with_uuid(self):
        template = 'match $x isa task, has id ~task_id;'
        uuid = UUID('12345678-1234-5678-1234-567812345678')
        result = build_query(template, {'task_id': uuid}, allow_none=False)
        assert result == 'match $x isa task, has id "12345678-1234-5678-1234-567812345678";'

    def test_multiple_params(self):
        template = 'match $x isa task, has id ~id, has name ~name;'
        result = build_query(template, {'id': 'abc', 'name': 'Test Task'}, allow_none=False)
        assert result == 'match $x isa task, has id "abc", has name "Test Task";'

    def test_none_param_raises_in_read_mode(self):
        template = 'match $x isa task, has id ~id;'
        with pytest.raises(ValueError, match="Cannot use None in read queries"):
            build_query(template, {'id': None}, allow_none=False)


class TestBuildQueryWriteMode:
    """Tests for build_query with allow_none=True (write transactions)"""

    def test_none_removes_single_clause(self):
        template = '''insert
            $task isa task,
            has id ~id,
            has description ~desc;'''
        result = build_query(template, {'id': 'abc', 'desc': None}, allow_none=True)
        assert 'description' not in result
        assert 'has id "abc"' in result

    def test_none_cleans_trailing_comma(self):
        template = '''insert
            $task isa task,
            has name ~name,
            has desc ~desc;'''
        result = build_query(template, {'name': 'Test', 'desc': None}, allow_none=True)
        # Should not have ",;" or dangling comma
        assert ',;' not in result
        assert ', ;' not in result

    def test_none_multiple_optional_attrs(self):
        template = '''insert
            $x isa entity,
            has required ~req,
            has opt1 ~opt1,
            has opt2 ~opt2;'''
        result = build_query(template, {
            'req': 'value',
            'opt1': None,
            'opt2': None
        }, allow_none=True)
        assert 'opt1' not in result
        assert 'opt2' not in result
        assert 'has required "value"' in result

    def test_pythonic_optional_pattern(self):
        # Realistic usage pattern - just pass fields directly, including None
        class Task:
            id = 'task-123'
            name = 'My Task'
            description = None  # Optional field not set

        task = Task()
        template = '''insert
            $task isa task,
            has id ~id,
            has name ~name,
            has description ~description;'''
        result = build_query(template, {
            'id': task.id,
            'name': task.name,
            'description': task.description  # Can be None
        }, allow_none=True)
        assert 'description' not in result
        assert 'has id "task-123"' in result
        assert 'has name "My Task"' in result

    def test_with_value_present(self):
        # When value is present, it should be included
        template = '''insert
            $task isa task,
            has id ~id,
            has description ~description;'''
        result = build_query(template, {
            'id': 'task-123',
            'description': "A real description"
        }, allow_none=True)
        assert 'has description "A real description"' in result