import { Err, Ok, Result } from '../../../src';
import { eq } from '../../util';

describe('Ok.collapse', () => {
    test('should fully collapse deeply nested Ok values: Ok(Ok(Ok(Ok(val)))) -> Ok(val).', () => {
        const ok = Ok(Ok(Ok(Ok(5))));
        const collapsedOk = ok.collapse();
        expect(collapsedOk).toMatchResult(Ok(5));
        eq<Result<number, never>, typeof collapsedOk>(true);
    });

    test('should fully collapse to the innermost Err: Ok(Ok(Ok(Err(val)))) -> Err(val).', () => {
        const ok = Ok(Ok(Ok(Err(5))));
        const collapsedOk = ok.collapse();
        expect(collapsedOk).toMatchResult(Err(5));
        eq<Result<never, number>, typeof collapsedOk>(true);
    });

    test('should leave an already-flat Ok unchanged: Ok(val) -> Ok(val).', () => {
        const ok = Ok(5);
        const collapsedOk = ok.collapse();
        expect(collapsedOk).toMatchResult(Ok(5));
        eq<Result<number, never>, typeof collapsedOk>(true);
    });

    test('should collapse only up to the given depth D.', () => {
        const ok = Ok(Ok(Ok(Ok(5))));
        const collapsedOk = ok.collapse(2);
        expect(collapsedOk).toMatchResult(Ok(Ok(5)));
        eq<typeof collapsedOk, Result<Result<number, never>, never>>(true);
    });

    test('should fully collapse when D exceeds the actual nesting depth.', () => {
        const ok = Ok(Ok(Ok(Ok(5))));
        const collapsedOk = ok.collapse(1000);
        expect(collapsedOk).toMatchResult(Ok(5));
        eq<typeof collapsedOk, Result<number, never>>(true);
    });

    test('should have no effect when D is zero or negative.', () => {
        const ok = Ok(Ok(Ok<number, string>(5)));
        const collapsedOk1 = ok.collapse(0);
        const collapsedOk2 = ok.collapse(-1000);
        expect(collapsedOk1).toMatchResult(Ok(Ok(Ok(5))));
        expect(collapsedOk1).toMatchResult(ok);
        expect(collapsedOk2).toMatchResult(ok);
        eq<typeof collapsedOk1, Result<Result<Result<number, string>, never>, never>>(true);
        eq<typeof collapsedOk1, typeof ok>(true);
        eq<typeof collapsedOk2, typeof ok>(true);
    });
});

describe('Err.collapse', () => {
    test('should leave an already-flat Err unchanged: Err(val) -> Err(val).', () => {
        const err = Err(5);
        const collapsedErr = err.collapse();
        expect(collapsedErr).toMatchResult(Err(5));
        eq<Result<never, number>, typeof collapsedErr>(true);
    });

    test('should fully collapse when D exceeds the actual nesting depth.', () => {
        const err = Err<number, string>(5);
        const collapsedErr = err.collapse(1000);
        expect(collapsedErr).toMatchResult(Err(5));
        eq<typeof collapsedErr, Result<string, number>>(true);
    });

    test('should have no effect when D is zero or negative.', () => {
        const err = Err<number, string>(5);
        const collapsedErr1 = err.collapse(0);
        const collapsedErr2 = err.collapse(-1000);
        expect(collapsedErr1).toMatchResult(Err(5));
        expect(collapsedErr1).toMatchResult(err);
        expect(collapsedErr2).toMatchResult(err);
        eq<typeof collapsedErr1, Result<string, number>>(true);
        eq<typeof collapsedErr1, typeof err>(true);
        eq<typeof collapsedErr2, typeof err>(true);
    });
});
