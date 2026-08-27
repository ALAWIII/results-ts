import { None, Some } from '../../../src';

describe('Some.andThen', () => {
    test('should evaluate the given closure and return value when calling "andThen" on Some', () => {
        const some = Some(9).andThen((v) => Some(`${v + 6}`));
        const someAndNone = Some(9).andThen((v) => None());
        expect(some).toEqual(Some('15'));
        expect(someAndNone.isNone()).toBe(true);
    });
});
describe('None.andThen', () => {
    test('invoking "andThen" on None should take no effect', () => {
        const none = None().andThen(() => Some('hello'));
        expect(none).not.toEqual(Some('hello'));
        expect(none.isNone()).toBe(true);
    });
});
