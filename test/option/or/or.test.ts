import { None, Some } from '../../../src';

describe('Some.or', () => {
    test('should ignore the provided value and return original Some contained value', () => {
        const some = Some(5).or(Some(10));
        expect(some).toEqual(Some(5));
        expect(some.unwrap()).toEqual(5);
    });
});
describe('None.or', () => {
    test('should return the provided value and ignore original None', () => {
        const none = None<number>().or(Some(10));
        expect(none).toEqual(Some(10));
        expect(none.isSome()).toBe(true);
        const noneAndNone = None<number>().or(None());
        expect(noneAndNone.isNone()).toBe(true);
    });
});
