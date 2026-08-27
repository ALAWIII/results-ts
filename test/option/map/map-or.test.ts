import { None, Some } from '../../../src';

describe('Some.mapOr', () => {
    test('should return the contained value of Some when calling mapOr.', () => {
        const some = Some(5).mapOr('0', (v) => `${v + 5}`);
        expect(some).toEqual(`10`);
        expect(some).not.toEqual(`0`);
    });
});
describe('None.mapOr', () => {
    test('should return the default provided value and ignore evaluating the closure on None.', () => {
        const none = None().mapOr('0', (v) => `5`);
        expect(none).toEqual(`0`);
        expect(none).not.toEqual(`5`);
    });
});
