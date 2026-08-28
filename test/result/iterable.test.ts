import { expect_never } from '../util';
import { Err, Ok } from '../../src';

test('Ok.iterable', () => {
    expect(Array.from(Ok('hello'))).toEqual(['hello']);
    expect(Array.from(Ok([1, 2, 3]))).toEqual([[1, 2, 3]]);
    expect(Array.from(Ok(1))).toEqual([1]);
});

test('Err.iterable', () => {
    for (const item of Err([123])) {
        expect_never(item, true);
        throw Error('Unreachable, Err@@iterator should emit no value and return');
    }
});
