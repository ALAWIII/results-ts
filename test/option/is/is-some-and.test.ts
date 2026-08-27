import { None, Some } from '../../../src';
describe('Some.isSomeAnd', () => {
    test('should return true for Some.isSomeAnd because the predicate evaluates to true', () => {
        const some = Some('hello');
        expect(some.isSomeAnd((v) => v === 'hello')).toBe(true);
    });
    test('should return false for Some.isSomeAnd because the predicate evaluates to false', () => {
        const some = Some('hello');
        expect(some.isSomeAnd((v) => v.length === 30)).toBe(false);
    });
});
describe('None.isSomeAnd', () => {
    test('should return false for None.isSomeAnd because its None regardless the predicates returned value.', () => {
        const none = None<string>();
        expect(none.isSomeAnd((v) => true)).toBe(false);
        expect(none.isSomeAnd((v) => false)).toBe(false);
    });
});
