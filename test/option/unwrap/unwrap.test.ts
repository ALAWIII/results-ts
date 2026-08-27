import { None, Some } from '../../../src';

describe('Some.unwrap', () => {
    test('should successfully unwrap the contained value for Some.', () => {
        const some = Some(8);
        expect(some.unwrap()).toBe(8);
    });
});
describe('None.unwrap', () => {
    test('should throw error when attempting to unwrap None.', () => {
        const none = None<number>();
        try {
            none.unwrap();
        } catch (e) {
            expect(e).toEqual(new Error('Tried to unwrap None'));
        }
    });
});
