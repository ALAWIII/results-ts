import { Err, Ok, Result } from '../../../src';
import { eq } from '../../util';
describe('Ok.flatten', () => {
    test('should successfully flatten nested results Ok(Ok(val)) -> Ok(val).', () => {
        const ok = Ok(Ok<number, string>(44));
        const flattenedOk = ok.flatten();
        expect(flattenedOk).toMatchResult(Ok(44));
        eq<typeof flattenedOk, Result<number, string>>(true);
    });
    test('should successfully flatten nested results Ok(Err(val)) -> Err(val).', () => {
        const ok = Ok(Err<number, string>(44));
        const flattenedOk = ok.flatten();
        expect(flattenedOk).toMatchResult(Err(44));
        eq<typeof flattenedOk, Result<string, number>>(true);
    });
    test('should flatten deeply nested results and preserve the final type when flatten is called beyond nesting depth: Ok(Ok(Err(val))) -> Err(val).', () => {
        const ok = Ok(Ok(Err<number, string>(44)));
        const flattenedOk = ok.flatten().flatten().flatten().flatten();
        expect(flattenedOk).toMatchResult(Err(44));
        eq<typeof flattenedOk, Result<string, number>>(true);
    });
});

describe('Err.flatten', () => {
    test('should successfully flatten nested results Err(val) -> Err(val).', () => {
        const err = Err<string, number>('error');
        const flattenedErr = err.flatten();
        expect(flattenedErr).toMatchResult(Err('error'));
        eq<typeof flattenedErr, Result<number, string>>(true);
    });

    test('should flatten deeply nested results and preserve the final type when flatten is called beyond nesting depth: Err(val) -> Err(val).', () => {
        const err = Err<string, number>('err');
        const flattenedErr = err.flatten().flatten().flatten().flatten();
        expect(flattenedErr).toMatchResult(Err('err'));
        eq<typeof flattenedErr, Result<number, string>>(true);
    });
});
