import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ThemePicker from '../components/ThemePicker';

/**
 * ThemePickerHarness - a minimal mount point for E2E-testing the reusable
 * ThemePicker in isolation. Its real consumers (project create/edit, inline
 * detail edit, student interests) are separate tasks, so no production page
 * mounts the component yet.
 *
 * Configured entirely through the URL so the E2E suite can drive every prop:
 *   ?readonly=1            -> read-only mode
 *   ?selected=id1,id2      -> initially selected theme ids
 * The latest onChange payload is rendered as JSON for assertion.
 */
export default function ThemePickerHarness() {
    const [params] = useSearchParams();
    const readOnly = params.get('readonly') === '1';
    const selectedParam = params.get('selected');
    const initialSelected = selectedParam ? selectedParam.split(',').filter(Boolean) : [];

    const [lastChange, setLastChange] = useState(null);

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
