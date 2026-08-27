import { None, Some } from '../../../src';

describe('Some.map', () => {
    test('should map the contained value of Some.', () => {
        const some = Some(5);
        expect(some.map((v) => v + 5)).toEqual(Some(10));
    });
});
describe('None.map', () => {
    test('invoking map one None should take no effect.', () => {
        const none = None();
        expect(none.map((v) => 5 + 5)).not.toEqual(Some(10));
        expect(none.map((v) => 5 + 5)).toEqual(None());
    });
});
