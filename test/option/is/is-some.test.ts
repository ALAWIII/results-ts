import { None, Option, Some, SomeImpl } from '../../../src';
import { eq } from '../../util';
describe('Some.isSome', () => {
    test('should return true for Some.isSome', () => {
        const some = Some('hello');
        expect(some.isSome()).toBe(true);
        expect(some).toBeInstanceOf(SomeImpl);
        eq<typeof some, Option<string>>(true);
    });
});
describe('None.isSome', () => {
    test('should return false for None.isSome', () => {
        const none = None<string>();
        expect(none.isSome()).toBe(false);
        expect(none).not.toBeInstanceOf(SomeImpl);
        eq<typeof none, Option<string>>(true);
    });
});
