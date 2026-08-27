import { None, Some } from '../../src';

describe('Some.expect', () => {
    test('should return the value when call expect on Some.', () => {
        const some = Some(8);
        expect(some.expect('will not throw')).toBe(8);
    });
});
describe('None.expect', () => {
    test('should throw error message when call expect on None.', () => {
        const some = None();
        try {
            some.expect('called on None throws error');
        } catch (e) {
            expect(e).toEqual(new Error('called on None throws error'));
        }
    });
});
