import { None, Some } from '../../../src';
describe('None.isNoneOr', () => {
    test('should return true for None.isNoneOr because its None regardless the predicates returned value.', () => {
        const none = None<string>();
        expect(none.isNoneOr((v) => true)).toBe(true);
        expect(none.isNoneOr((v) => false)).toBe(true);
    });
});
describe('Some.isNoneOr', () => {
    test('should return true for Some.isNoneOr because the predicate evaluates to true', () => {
        const some = Some(90);
        expect(some.isNoneOr((v) => v > 80)).toBe(true);
    });
    test('should return false for Some.isNoneOr because its not None and the predicate evaluates to false', () => {
        const some = Some(50);
        expect(some.isNoneOr((v) => v === 30)).toBe(false);
    });
});
