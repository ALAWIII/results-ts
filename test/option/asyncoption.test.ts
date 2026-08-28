import { AsyncOption, None, Some } from '../../src/index.js';

test('the constructor should work', async () => {
    const option = new AsyncOption(Some(1));
    expect(await option).toEqual(Some(1));
});

test('andThen() should work', async () => {
    const noValue = new AsyncOption(None());
    const hasValue = new AsyncOption(Some(1));

    expect(
        await noValue.andThen(() => {
            throw new Error('Should not be called');
        }),
    ).toEqual(None());

    expect(await hasValue.andThen((value) => Some(value * 3))).toEqual(Some(3));
    expect(await hasValue.andThen(async (value) => Some(value * 3))).toEqual(Some(3));
    expect(await hasValue.andThen((value) => new AsyncOption(Some(value * 3)))).toEqual(Some(3));
});

test('map() should work', async () => {
    const noValue = new AsyncOption(None());
    const hasValue = new AsyncOption(Some(1));

    expect(
        await noValue.map(() => {
            throw new Error('Should not be called');
        }),
    ).toEqual(None());
    expect(await hasValue.map((value) => value * 2)).toEqual(Some(2));
    expect(await hasValue.map(async (value) => value * 2)).toEqual(Some(2));
});

test('or() should work', async () => {
    const noValue = new AsyncOption(None());
    const hasValue = new AsyncOption(Some(1));

    expect(await noValue.or(Some(200))).toEqual(Some(200));
    expect(await hasValue.or(Some(200))).toEqual(Some(1));

    expect(await noValue.or(new AsyncOption(Some(200)))).toEqual(Some(200));
    expect(await hasValue.or(new AsyncOption(Some(200)))).toEqual(Some(1));

    expect(await noValue.or(Promise.resolve(Some(200)))).toEqual(Some(200));
    expect(await hasValue.or(Promise.resolve(Some(200)))).toEqual(Some(1));
});

test('orElse() should work', async () => {
    const noValue = new AsyncOption(None());
    const hasValue = new AsyncOption(Some(1));

    function notExpectedToBeCalled(): never {
        throw new Error('Not expected to be called');
    }

    expect(await hasValue.orElse(notExpectedToBeCalled)).toEqual(Some(1));
    expect(await noValue.orElse(() => Some(200))).toEqual(Some(200));
    expect(await noValue.orElse(() => new AsyncOption(Some(200)))).toEqual(Some(200));
    expect(await noValue.orElse(() => Promise.resolve(Some(200)))).toEqual(Some(200));
});

test('AsyncOption should be awaitable', async () => {
    const hasValue = new AsyncOption(Some(42));
    const noValue = new AsyncOption(None());

    // Should be able to await AsyncOption directly
    const result1 = await hasValue;
    expect(result1).toEqual(Some(42));

    const result2 = await noValue;
    expect(result2).toEqual(None());
});

describe('AsyncOption extensions', () => {
    describe('and', () => {
        it('returns other when self is Some, otherwise None', async () => {
            const some = Some(1).toAsyncOption();
            const none = None().toAsyncOption();

            await expect(some.and(Some('ok'))).resolves.toEqual(Some('ok'));
            await expect(none.and(Some('ok'))).resolves.toEqual(None());
        });
    });

    describe('filter', () => {
        it('keeps Some when predicate passes, returns None otherwise, and does not call predicate for None', async () => {
            let calls = 0;
            const some = Some(4).toAsyncOption();
            const none = None().toAsyncOption();

            await expect(
                some.filter((v) => {
                    calls++;
                    return v % 2 === 0;
                }),
            ).resolves.toEqual(Some(4));

            await expect(some.filter((v) => v > 10)).resolves.toEqual(None());

            await expect(
                none.filter(() => {
                    calls++;
                    return true;
                }),
            ).resolves.toEqual(None());

            expect(calls).toBe(1); // only called for the 1 Some case and ignored for None.
        });
    });

    describe('okOrElse', () => {
        it('converts Some to Ok without calling error, and None to Err calling error once', async () => {
            let calls = 0;
            const error = () => {
                calls++;
                return 'err';
            };

            const some = Some(5).toAsyncOption();
            const none = None().toAsyncOption();

            const r1 = await some.okOrElse(error);
            const r2 = await none.okOrElse(error);

            expect(r1.isOk()).toBe(true);
            expect(r1.unwrap()).toBe(5);

            expect(r2.isErr()).toBe(true);
            expect(r2.unwrapErr()).toBe('err');

            expect(calls).toBe(1); // only for None
        });
    });

    describe('okOr', () => {
        it('converts Some to Ok and None to Err with the given error', async () => {
            const some = Some(5).toAsyncOption();
            const none = None().toAsyncOption();

            const r1 = await some.okOr('missing');
            const r2 = await none.okOr('missing');

            expect(r1.isOk()).toBe(true);
            expect(r1.unwrap()).toBe(5);

            expect(r2.isErr()).toBe(true);
            expect(r2.unwrapErr()).toBe('missing');
        });
    });

    describe('xor', () => {
        it('returns Some only when exactly one operand is Some', async () => {
            const some1 = Some(1).toAsyncOption();
            const some2 = Some(2).toAsyncOption();
            const none = None<number>().toAsyncOption();

            await expect(some1.xor(some2)).resolves.toEqual(None());
            await expect(some1.xor(none)).resolves.toEqual(Some(1));
            await expect(none.xor(some2)).resolves.toEqual(Some(2));
            await expect(none.xor(none)).resolves.toEqual(None());
        });
    });
});
