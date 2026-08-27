import { None, Some } from '../../../src';

describe('Some.unwrapOrElse', () => {
    test('should successfully unwrap the contained value for Some and ignore the provided closure.', () => {
        const some = Some(8);
        expect(some.unwrapOr(7)).toBe(8);
    });
});
describe('None.unwrapOr', () => {
    test('should successfully evaluated the provided closure to None and return.', () => {
        const none = None<number>();
        expect(none.unwrapOrElse(() => 7)).toBe(7);
    });
});
