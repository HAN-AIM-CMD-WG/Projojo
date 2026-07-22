import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ThemePicker from '../components/ThemePicker';

/**
 * ThemePickerHarness - a minimal mount point for E2E-testing the reusable
 * ThemePicker in isolation. Its real consumers (project create/edit, inline
 * detail edit, student interests) are separate tasks, so no production page
 * mounts the component yet. Registered only in dev builds (see App.jsx).
 *
 * Configured entirely through the URL so the E2E suite can drive every prop:
 *   ?readonly=1            -> read-only mode
 *   ?selected=id1,id2      -> initially selected theme ids
 *   ?delayed=1             -> start empty and apply `selected` only when the
 *                             "apply-delayed" button is pressed, simulating an
 *                             async fetch that resolves after mount
 * The latest onChange payload is rendered as JSON for assertion.
 *
 * The delayed selection is test-triggered rather than timer-based so the suite
 * controls the ordering exactly: it can assert the empty state, or let the user
 * toggle a pill first, and know which happened before the late value arrives.
 * `delayed-applied` marks the commit that pushed the new value, so assertions
 * never run before the component has seen it.
 */
export default function ThemePickerHarness() {
    const [params] = useSearchParams();
    const readOnly = params.get('readonly') === '1';
    const delayed = params.get('delayed') === '1';
    const selectedParam = params.get('selected');
    const wanted = selectedParam ? selectedParam.split(',').filter(Boolean) : [];

    const [initialSelected, setInitialSelected] = useState(delayed ? [] : wanted);
    const [applied, setApplied] = useState(false);
    const [lastChange, setLastChange] = useState(null);

    return (
        <div className="min-h-screen bg-[var(--neu-bg)] p-8">
            <div className="max-w-3xl mx-auto neu-flat p-6 space-y-4">
                <h1 className="text-lg font-bold text-[var(--text-primary)]">ThemePicker harness</h1>
                <ThemePicker initialSelected={initialSelected} readOnly={readOnly} onChange={setLastChange} />
                {delayed && (
                    <button
                        type="button"
                        data-testid="apply-delayed"
                        className="text-xs underline text-[var(--text-muted)]"
                        onClick={() => { setInitialSelected(wanted); setApplied(true); }}
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
