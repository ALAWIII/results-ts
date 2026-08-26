import { Err, Ok } from '../../../src';

describe('Ok.inspect', () => {
    test('it should call provided function on Ok.inspect', () => {
        const ok = Ok('Hello');
        let called: undefined | string;
        ok.inspect((v) => (called = `${v} World`));
        expect(called).toEqual('Hello World');
        expect(called).toBeDefined();
    });
});

describe('Err.inspect', () => {
    test('it should ignore the provided function on Err.inspect', () => {
        const ok = Err('Hello');
        let called: undefined | string;
        ok.inspect((v) => (called = `${v} Error`));
        expect(called).toBeUndefined();
        expect(called).not.toEqual('Hello Error');
    });
});
