import { None, Some } from '../../../src';

describe('Some.unwrapOr', () => {
    test('should successfully unwrap the contained value for Some and ignore the provided one.', () => {
        const some = Some(8);
        expect(some.unwrapOr(7)).toBe(8);
    });
});
describe('None.unwrapOr', () => {
    test('should successfully return the provided value to None and not throwing any error.', () => {
        const none = None<number>();
        expect(none.unwrapOr(7)).toBe(7);
    });
});
