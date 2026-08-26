import { Err, Ok } from '../../../src';

describe('Ok.mapOr', () => {
    test('should transform and return value when calling Ok.mapOr ', () => {
        const ok = Ok('Hello');
        const mappedOk = ok.mapOr('default when error', (v) => `${v} World`);
        expect(mappedOk).toEqual('Hello World');
        expect(mappedOk).not.toEqual('default when error');
    });
});
describe('Err.mapOr', () => {
    test('should fallback and return the default value when calling Err.mapOr', () => {
        const err = Err('Hello');
        const mappedErr = err.mapOr('default when error', (v) => `${v} World`);
        expect(mappedErr).toEqual('default when error');
        expect(mappedErr).not.toEqual('Hello World');
    });
});
