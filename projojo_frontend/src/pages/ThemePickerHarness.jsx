import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ThemePicker from '../components/ThemePicker';

/**
 * ThemePickerHarness - a minimal mount point for E2E-testing the reusable
 * ThemePicker in isolation. The production consumers (project create, project
 * edit, inline detail edit) all mount it as an editable picker, so this harness
 * is what drives the props they leave untouched: read-only display, and a
 * selection supplied after mount. Registered only in dev builds (see App.jsx).
 *
 * The ThemePicker is controlled, so this harness owns the selection array and
 * applies every onChange back to it. Configured entirely through the URL so the
 * E2E suite can drive every prop:
 *   ?readonly=1            -> read-only mode
 *   ?selected=id1,id2      -> initially selected theme ids
 *   ?delayed=1             -> start empty and push `selected` only when the
 *                             "apply-delayed" button is pressed, simulating a
 *                             parent that supplies the selection after mount
 * The latest onChange payload is rendered as JSON for assertion.
 *
 * The delayed selection is test-triggered rather than timer-based so the suite
 * controls the ordering exactly: it can assert the empty state before letting
 * the late value arrive. `delayed-applied` marks the commit that pushed the new
 * value, so assertions never run before the component has seen it.
 */
export default function ThemePickerHarness() {
    const [params] = useSearchParams();
    const readOnly = params.get('readonly') === '1';
    const delayed = params.get('delayed') === '1';
    const selectedParam = params.get('selected');
    const wanted = selectedParam ? selectedParam.split(',').filter(Boolean) : [];

    const [selected, setSelected] = useState(delayed ? [] : wanted);
    const [applied, setApplied] = useState(false);
    const [lastChange, setLastChange] = useState(null);

    // Controlled parent: apply every toggle to `selected` so the pill updates,
    // and mirror it to the read-out the E2E suite asserts on.
    function handleChange(ids) {
        setSelected(ids);
        setLastChange(ids);
    }

    return (
        <div className="min-h-screen bg-[var(--neu-bg)] p-8">
            <div className="max-w-3xl mx-auto neu-flat p-6 space-y-4">
                <h1 className="text-lg font-bold text-[var(--text-primary)]">ThemePicker harness</h1>
                <ThemePicker selected={selected} readOnly={readOnly} onChange={handleChange} />
                {delayed && (
                    <button
                        type="button"
                        data-testid="apply-delayed"
                        className="text-xs underline text-[var(--text-muted)]"
                        onClick={() => { setSelected(wanted); setApplied(true); }}
                    >
                        Apply delayed selection
                    </button>
                )}
                {delayed && applied && <span data-testid="delayed-applied" className="sr-only">applied</span>}
                <div data-testid="themepicker-onchange" className="font-mono text-xs text-[var(--text-muted)]">
                    {lastChange === null ? '' : JSON.stringify(lastChange)}
                </div>
            </div>
        </div>
    );
}