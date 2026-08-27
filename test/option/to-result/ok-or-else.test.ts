import { Err, None, Ok, Result, Some } from '../../../src';
import { eq } from '../../util';
describe('Some.okOrElse', () => {
    test('should success transform Some(v) to Ok(v) when using okOrElse', () => {
        const someToOk = Some(12).okOrElse(() => 'error');
        expect(someToOk).toMatchResult(Ok(12));
        expect(someToOk.unwrap()).toBe(12);
        eq<typeof someToOk, Result<number, string>>(true);
    });
});
describe('None.okOrElse', () => {
    test('should success transform None to Err(e) when using okOrElse', () => {
        const noneToErr = None<number>().okOrElse(() => 'error');
        expect(noneToErr).toMatchResult(Err('error'));
        expect(noneToErr.unwrapErr()).toBe('error');
        eq<typeof noneToErr, Result<number, string>>(true);
    });
});
