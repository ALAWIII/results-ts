import { None, NoneImpl, Option, Some } from '../../../src';
import { eq } from '../../util';
describe('None.isNone', () => {
    test('should return true for None.isNone', () => {
        const none = None<string>();
        expect(none.isNone()).toBe(true);
        expect(none).toBeInstanceOf(NoneImpl);
        eq<typeof none, Option<string>>(true);
    });
});
describe('Some.isNone', () => {
    test('should return false for Some.isNone', () => {
        const some = Some('hello');
        expect(some.isNone()).toBe(false);
        expect(some).not.toBeInstanceOf(NoneImpl);
        eq<typeof some, Option<string>>(true);
    });
});
