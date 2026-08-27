import { Err, None, Ok, Result, Some } from '../../../src';
import { eq } from '../../util';
describe('Some.okOr', () => {
    test('should success transform Some(v) to Ok(v)', () => {
        const someToOk = Some(12).okOr('error');
        expect(someToOk).toMatchResult(Ok(12));
        expect(someToOk.unwrap()).toBe(12);
        eq<typeof someToOk, Result<number, string>>(true);
    });
});
describe('None.okOr', () => {
    test('should success transform None to Err(e)', () => {
        const noneToErr = None<number>().okOr('error');
        expect(noneToErr).toMatchResult(Err('error'));
        expect(noneToErr.unwrapErr()).toBe('error');
        eq<typeof noneToErr, Result<number, string>>(true);
    });
});
