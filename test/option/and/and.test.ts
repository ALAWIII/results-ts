import { None, Some } from '../../../src';

describe('Some.and', () => {
    test('should return the provided value when invoked and on Some', () => {
        const some = Some(9).and(Some('hello'));
        expect(some).toEqual(Some('hello'));
        expect(some.unwrap()).toEqual('hello');
        const someAndNone = Some(9).and(None());
        expect(someAndNone.isNone()).toBe(true);
    });
});
describe('None.and', () => {
    test('invoking "and" on None should take no effect', () => {
        const none = None().and(Some('hello'));
        expect(none).not.toEqual(Some('hello'));
        expect(none.isNone()).toBe(true);
    });
});
