import test from 'ava';
import OverlayModel from './OverlayModel.mjs';

test('is closed', (t) => {
    t.is(new OverlayModel().isOpen, false);
});

test('can be toggled, opened, closed', (t) => {
    const om = new OverlayModel();
    let emittedEvents = 0;
    om.on('change', () => emittedEvents++);
    // Toggle
    om.toggle();
    t.is(om.isOpen, true);
    t.is(emittedEvents, 1);
    // Close
    om.close();
    t.is(om.isOpen, false);
    t.is(emittedEvents, 2);
    // Open
    om.open();
    t.is(om.isOpen, true);
    t.is(emittedEvents, 3);
});

test('does only fire update on change', (t) => {
    const om = new OverlayModel();
    let emittedEvents = 0;
    om.on('change', () => emittedEvents++);
    // Is already open
    om.close();
    om.open();
    om.open();
    t.is(emittedEvents, 1);
});
