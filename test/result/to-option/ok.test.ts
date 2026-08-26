import { eq } from '../../util';
import { Err, NoneImpl, Ok, Option, Some, SomeImpl } from '../../../src';

describe('Ok.ok', () => {
    test('should return Some(v) when calling Ok.ok', () => {
        const ok = Ok(23);
        const option = ok.ok();
        expect(option).toEqual(Some(23));
        expect(option).toBeInstanceOf(SomeImpl);
        eq<typeof option, Option<number>>(true);
    });
});
describe('Err.ok', () => {
    test('should return None when calling Err.ok', () => {
        const err = Err(23);
        const option = err.ok();
        expect(option).not.toEqual(Some(23));
        expect(option).toBeInstanceOf(NoneImpl);
        eq<typeof option, Option<never>>(true);
    });
});
