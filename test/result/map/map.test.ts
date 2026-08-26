import { Err, Ok } from '../../../src';

describe('Ok.map', () => {
    test('should map the value of an Ok', () => {
        const ok = Ok(12);
        const mappedOk = ok.map((v) => `${v + 12}`);
        expect(mappedOk).toMatchResult(Ok('24'));
        expect(mappedOk.unwrap()).toBe('24');
    });
});

describe('Err.map', () => {
    test('calling map on Err should take no effect', () => {
        const err = Err('hello');
        const mappedErr = err.map((v) => v + 12);
        expect(mappedErr).toMatchResult(Err('hello'));
        expect(mappedErr.unwrapErr()).toEqual('hello');
    });
});
