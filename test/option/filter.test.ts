import { None, Some } from '../../src';

describe('Some.filter', () => {
    test('should return Some(v) because its originally Some and the predicate evaluates to true.', () => {
        const some = Some(44).filter((v) => v > 0);
        expect(some).toEqual(Some(44));
        expect(some.isSome()).toBe(true);
    });
    test('should return None because its originally Some and the predicate evaluates to false.', () => {
        const some = Some(44).filter((v) => v > 100);
        expect(some).toEqual(None());
        expect(some.isNone()).toBe(true);
    });
});
describe('None.filter', () => {
    test('should return None because its originally None, regardless the value of filter being true.', () => {
        const none = None().filter((v) => true);
        expect(none).toEqual(None());
        expect(none.isNone()).toBe(true);
    });
    test('should return None because its originally None, regardless the value of filter being false.', () => {
        const none = None().filter((v) => false);
        expect(none).toEqual(None());
        expect(none.isNone()).toBe(true);
    });
});
