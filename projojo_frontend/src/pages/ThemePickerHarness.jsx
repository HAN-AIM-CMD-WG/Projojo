import { useEffect, useState } from 'react';
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
 *   ?delayed=1             -> apply `selected` shortly after mount, simulating an
 *                             async fetch, to exercise the re-sync contract
 * The latest onChange payload is rendered as JSON for assertion.
 */
export default function ThemePickerHarness() {
    const [params] = useSearchParams();
    const readOnly = params.get('readonly') === '1';
    const delayed = params.get('delayed') === '1';
    const selectedParam = params.get('selected');
    const wanted = selectedParam ? selectedParam.split(',').filter(Boolean) : [];

    const [initialSelected, setInitialSelected] = useState(delayed ? [] : wanted);
    const [lastChange, setLastChange] = useState(null);

    useEffect(() => {
        if (!delayed) return undefined;
        const timer = setTimeout(() => setInitialSelected(wanted), 800);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-[var(--neu-bg)] p-8">
            <div className="max-w-3xl mx-auto neu-flat p-6 space-y-4">
                <h1 className="text-lg font-bold text-[var(--text-primary)]">ThemePicker harness</h1>
                <ThemePicker initialSelected={initialSelected} readOnly={readOnly} onChange={setLastChange} />
                <div data-testid="themepicker-onchange" className="font-mono text-xs text-[var(--text-muted)]">
                    {lastChange === null ? '' : JSON.stringify(lastChange)}
                </div>
            </div>
        </div>
    );
}
