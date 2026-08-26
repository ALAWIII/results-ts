import { eq } from '../../util';
import { Err, NoneImpl, Ok, Option, Some, SomeImpl } from '../../../src';

describe('Err.err', () => {
    test('should return Some(e) when calling Err.err', () => {
        const err = Err(23);
        const option = err.err();
        expect(option).toEqual(Some(23));
        expect(option).toBeInstanceOf(SomeImpl);
        eq<typeof option, Option<number>>(true);
    });
});
describe('Ok.err', () => {
    test('should return Some(v) when calling Ok.ok', () => {
        const ok = Ok(23);
        const option = ok.err();
        expect(option).not.toEqual(Some(23));
        expect(option).toBeInstanceOf(NoneImpl);
        eq<typeof option, Option<never>>(true);
    });
});
