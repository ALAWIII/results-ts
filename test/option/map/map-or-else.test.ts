import { None, Some } from '../../../src';

describe('Some.mapOrElse', () => {
    test('should evaluate the second main closure and convert the value of Some.', () => {
        const some = Some(5).mapOrElse(
            () => '0',
            (v) => `${v + 5}`,
        );
        expect(some).toEqual(`10`);
        expect(some).not.toEqual(`0`);
    });
});
describe('None.mapOr', () => {
    test('should evaluate the default closure and return its value when invoked on None.', () => {
        const none = None().mapOrElse(
            () => '0',
            (v) => `5`,
        );
        expect(none).toEqual(`0`);
        expect(none).not.toEqual(`5`);
    });
});
