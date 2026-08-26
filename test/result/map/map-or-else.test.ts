import { Err, Ok } from '../../../src';

describe('Ok.mapOrElse', () => {
    test('should transform and return value when calling Ok.mapOrElse ', () => {
        const ok = Ok('Hello');
        const mappedOk = ok.mapOrElse(
            (e) => 'default when error',
            (v) => `${v} World`,
        );
        expect(mappedOk).toEqual('Hello World');
        expect(mappedOk).not.toEqual('default when error');
    });
});
describe('Err.mapOrElse', () => {
    test('should fallback and return the default value when calling Err.mapOr', () => {
        const err = Err('Hello');
        const mappedErr = err.mapOrElse(
            (e) => 'default when error',
            (v) => `${v} World`,
        );
        expect(mappedErr).toEqual('default when error');
        expect(mappedErr).not.toEqual('Hello World');
    });
});
