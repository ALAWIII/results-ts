import { Err, Ok } from '../../../src';

describe('Err.unwrapErr', () => {
    test('it should return the value when unwrapping Err', () => {
        const err = Err(312);
        expect(err.unwrapErr()).toBe(312);
    });
});
describe('Ok.unwrapErr', () => {
    test('it should throw error when try to invoke unwrapErr on Ok', () => {
        const ok = Ok(312);
        try {
            ok.unwrapErr();
        } catch (e) {
            expect(e).toBe(312);
        }
    });
});
