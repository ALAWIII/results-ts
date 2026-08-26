import { Err, Ok } from '../../../src';

describe('Err.mapErr', () => {
    test('should mapErr the value of an Err', () => {
        const err = Err(12);
        const mappedErr = err.mapErr((v) => `${v + 12}`);
        expect(mappedErr).toMatchResult(Err('24'));
        expect(mappedErr.unwrapErr()).toBe('24');
    });
});

describe('Ok.mapErr', () => {
    test('calling mapErr on Ok should take no effect', () => {
        const ok = Ok('hello');
        const mappedOk = ok.mapErr((v) => v + 12);
        expect(mappedOk).toMatchResult(Ok('hello'));
        expect(mappedOk.unwrap()).toEqual('hello');
    });
});
