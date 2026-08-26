import { Err, Ok } from '../../../src';

describe('Err.inspectErr', () => {
    test('it should call the provided function on Err.inspectErr', () => {
        const err = Err('Hello');
        let called: undefined | string;
        err.inspectErr((v) => (called = `${v} Error`));
        expect(called).toBeDefined();
        expect(called).toEqual('Hello Error');
    });
});
describe('Ok.inspectErr', () => {
    test('it should ignore provided function on Ok.inspectErr', () => {
        const ok = Ok('Hello');
        let called: undefined | string;
        ok.inspectErr((v) => (called = `${v} World`));
        expect(called).toBeUndefined();
        expect(called).not.toEqual('Hello World');
    });
});
