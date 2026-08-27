import { None, Option, Some } from '../../../src';
import { eq } from '../../util';

describe('Some.collapse', () => {
    test('should fully collapse deeply nested Some values: Some(Some(Some(val))) -> Some(val).', () => {
        const some = Some(Some(Some(43)));
        const collapsed = some.collapse();
        expect(collapsed).toMatchOption(Some(43));
        expect(collapsed.unwrap()).toBe(43);
        eq<typeof collapsed, Option<number>>(true);
    });

    test('should collapse only up to the given depth D: Some(Some(Some(val))).collapse(1) -> Some(Some(val)).', () => {
        const some = Some(Some(Some(43)));
        const collapsed = some.collapse(1);
        expect(collapsed).toMatchOption(Some(Some(43)));
        eq<typeof collapsed, Option<Option<number>>>(true);
    });

    test('should fully collapse when D exceeds the actual nesting depth.', () => {
        const some = Some(Some(Some(43)));
        const collapsed = some.collapse(1000);
        expect(collapsed).toMatchOption(Some(43));
        eq<typeof collapsed, Option<number>>(true);
    });

    test('should have no effect when D is zero or negative.', () => {
        const some = Some(Some(Some(43)));
        const collapsed0 = some.collapse(0);
        const collapsedNeg = some.collapse(-100);
        expect(collapsed0).toMatchOption(Some(Some(Some(43))));
        expect(collapsedNeg).toMatchOption(Some(Some(Some(43))));
        eq<typeof collapsed0, Option<Option<Option<number>>>>(true);
        eq<typeof collapsed0, typeof some>(true);
        eq<typeof collapsedNeg, typeof some>(true);
    });

    test('should leave a flat Some unchanged: Some(val).collapse() -> Some(val).', () => {
        const some = Some(42);
        const collapsed = some.collapse();
        expect(collapsed).toMatchOption(Some(42));
        expect(collapsed.unwrap()).toBe(42);
        eq<typeof collapsed, Option<number>>(true);
    });
});

describe('None.collapse', () => {
    test('should leave None unchanged: None.collapse() -> None.', () => {
        const none = None<number>();
        const collapsed = none.collapse();
        expect(collapsed).toMatchOption(None());
        expect(collapsed.isNone()).toBe(true);
        eq<typeof collapsed, Option<number>>(true);
    });

    test('should preserve None when calling collapse with depth D.', () => {
        const none = None<string>();
        const collapsed = none.collapse(5);
        expect(collapsed).toMatchOption(None());
        expect(collapsed.isNone()).toBe(true);
        eq<typeof collapsed, Option<string>>(true);
    });

    test('should have no effect when D is zero or negative on None.', () => {
        const none = None<number>();
        const collapsed0 = none.collapse(0);
        const collapsedNeg = none.collapse(-100);
        expect(collapsed0).toMatchOption(None());
        expect(collapsedNeg).toMatchOption(None());
        eq<typeof collapsed0, Option<number>>(true);
        eq<typeof collapsed0, typeof none>(true);
        eq<typeof collapsedNeg, typeof none>(true);
    });
});
