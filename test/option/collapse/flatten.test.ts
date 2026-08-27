import { None, Option, Some } from '../../../src';
import { eq } from '../../util';

describe('Some.flatten', () => {
    test('should flatten only one level at a time: Some(Some(Some(val))) -> Some(Some(val)).', () => {
        const some = Some(Some(Some(43)));
        const flattened = some.flatten();
        expect(flattened).toMatchOption(Some(Some(43)));
        eq<typeof flattened, Option<Option<number>>>(true);
    });

    test('should leave a flat Some unchanged when calling flatten: Some(val) -> Some(val).', () => {
        const some = Some(42);
        const flattened = some.flatten();
        expect(flattened).toMatchOption(Some(42));
        expect(flattened.unwrap()).toBe(42);
        eq<typeof flattened, Option<number>>(true);
    });

    test('should preserve the final value when calling flatten beyond nesting depth.', () => {
        const some = Some(Some(Some(43)));
        const flattened = some.flatten().flatten().flatten().flatten();
        expect(flattened).toMatchOption(Some(43));
        eq<typeof flattened, Option<number>>(true);
    });
});

describe('None.flatten', () => {
    test('should leave None unchanged: None -> None.', () => {
        const none = None<number>();
        const flattened = none.flatten();
        expect(flattened).toMatchOption(None());
        expect(flattened.isNone()).toBe(true);
        eq<typeof flattened, Option<number>>(true);
    });

    test('should preserve None when calling flatten multiple times.', () => {
        const none = None<string>();
        const flattened = none.flatten().flatten().flatten();
        expect(flattened).toMatchOption(None());
        expect(flattened.isNone()).toBe(true);
        eq<typeof flattened, Option<string>>(true);
    });
});
