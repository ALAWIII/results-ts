import { None, Some } from '../../../src';

describe('Some.orElse', () => {
    test('should ignore the provided closure "orElse" and return original Some contained value', () => {
        const some = Some(5).orElse(() => Some(10));
        expect(some).toEqual(Some(5));
        expect(some.unwrap()).toEqual(5);
    });
});
describe('None.orElse', () => {
    test('should evaluate the closure and return the provided None value value and ignore original None', () => {
        const none = None<number>().orElse(() => Some(10));
        expect(none).toEqual(Some(10));
        expect(none.isSome()).toBe(true);
        const noneAndNone = None<number>().orElse(() => None());
        expect(noneAndNone.isNone()).toBe(true);
    });
});
