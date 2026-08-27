import { None, Some } from '../../../src';

describe('Some.xor', () => {
    test('should return None when both Some.xor(Some)', () => {
        const some = Some(5).xor(Some(10));
        expect(some).toEqual(None());
        expect(some.isNone()).toBe(true);
    });
    test('should return first Some(5) when both Some.xor(None)', () => {
        const some = Some(5).xor(None());
        expect(some).toEqual(Some(5));
        expect(some.isSome()).toBe(true);
    });
});
describe('None.xor', () => {
    test('should return the provided Some value when both None.xor(Some)', () => {
        const none = None<number>().xor(Some(10));
        expect(none).toEqual(Some(10));
        expect(none.isSome()).toBe(true);
    });
    test('should return the None value when both None.xor(None)', () => {
        const none = None<number>().xor(None());
        expect(none).toEqual(None());
        expect(none.isNone()).toBe(true);
    });
});
