import { AsyncResult, Err, Ok, Some } from '../../src/index.js';

test('and() should work', async () => {
    const err = Err('error');
    const badResult = new AsyncResult(err);
    const goodResult = new AsyncResult(Ok<number, string>(100));

    // Err.and ignores the argument and keeps the original Err
    expect(await badResult.and(Ok(999))).toEqual(err);
    expect(await badResult.and(Promise.resolve(Ok(999)))).toEqual(err);
    expect(await badResult.and(Ok(999).toAsyncResult())).toEqual(err);

    // Ok.and returns the provided result (sync, async, or AsyncResult)
    expect(await goodResult.and(Ok(200))).toEqual(Ok(200));
    expect(await goodResult.and(Promise.resolve(Ok(300)))).toEqual(Ok(300));
    expect(await goodResult.and(Ok(400).toAsyncResult())).toEqual(Ok(400));

    // Ok.and with Err short-circuits to that Err
    expect(await goodResult.and(Err('new error'))).toEqual(Err('new error'));
    expect(await goodResult.and(Promise.resolve(Err('async error')))).toEqual(Err('async error'));
    expect(await goodResult.and(Err('asyncresult error').toAsyncResult())).toEqual(Err('asyncresult error'));
});
test('andThen() should work', async () => {
    const err = Err('error');
    const badResult = new AsyncResult(err);
    const goodResult = new AsyncResult(Ok(100));

    expect(
        await badResult.andThen(() => {
            throw new Error('Should not be called');
        }),
    ).toEqual(err);
    expect(await goodResult.andThen((value) => Promise.resolve(Ok(value * 2)))).toEqual(Ok(200));
    expect(await goodResult.andThen((value) => Ok(value * 3).toAsyncResult())).toEqual(Ok(300));
});

test('map() should work', async () => {
    const err = Err('error');
    const badResult = new AsyncResult(err);
    const goodResult = new AsyncResult(Ok(100));

    expect(
        await badResult.map(() => {
            throw new Error('Should not be called');
        }),
    ).toEqual(err);
    expect(await goodResult.map((value) => Promise.resolve(value * 2))).toEqual(Ok(200));
});

test('mapErr() should work', async () => {
    const err = Err('Boo');
    const badResult = new AsyncResult(err);
    const goodResult = new AsyncResult(Ok(100));

    expect(
        await goodResult.mapErr((_error) => {
            throw new Error('Should not be called');
        }),
    ).toEqual(Ok(100));

    expect((await badResult.mapErr((error) => `Error is ${error}`)).unwrapErr()).toEqual('Error is Boo');
    expect((await badResult.mapErr(async (error) => `Error is ${error}`)).unwrapErr()).toEqual('Error is Boo');
});

test('or() should work', async () => {
    const err = Err<string, number>('Boo');
    const badResult = new AsyncResult(err);
    const goodResult = new AsyncResult(Ok(100));

    expect(await badResult.or(Ok(200))).toEqual(Ok(200));
    expect(await goodResult.or(Ok(200))).toEqual(Ok(100));

    expect(await badResult.or(new AsyncResult(Ok(200)))).toEqual(Ok(200));
    expect(await goodResult.or(new AsyncResult(Ok(200)))).toEqual(Ok(100));

    expect(await badResult.or(Promise.resolve(Ok(200)))).toEqual(Ok(200));
    expect(await goodResult.or(Promise.resolve(Ok(200)))).toEqual(Ok(100));
});

test('orElse() should work', async () => {
    const err = Err<string, number>('Boo');
    const badResult = new AsyncResult(err);
    const goodResult = new AsyncResult(Ok(100));
    function notExpectedToBeCalled(): never {
        throw new Error('Not expected to be called');
    }

    expect(await goodResult.orElse(notExpectedToBeCalled)).toEqual(Ok(100));
    expect(await badResult.orElse(() => Ok(200))).toEqual(Ok(200));
    expect(await badResult.orElse(() => new AsyncResult(Ok(200)))).toEqual(Ok(200));
    expect(await badResult.orElse(() => Promise.resolve(Ok(200)))).toEqual(Ok(200));
});

test('ok() should work', async () => {
    const result = new AsyncResult(Ok(1));
    expect(await result.ok()).toEqual(Some(1));
});
test('err() should work', async () => {
    const result = new AsyncResult(Err(1));
    expect(await result.err()).toEqual(Some(1));
});

test('AsyncResult should be awaitable', async () => {
    const goodResult = new AsyncResult(Ok(42));
    const badResult = new AsyncResult(Err('error'));

    // Should be able to await AsyncResult directly
    const result1 = await goodResult;
    expect(result1).toEqual(Ok(42));

    const result2 = await badResult;
    expect(result2.isErr()).toBe(true);
    expect(result2.unwrapErr()).toEqual('error');
});
describe('AsyncResult.inspect', () => {
    test('inspect() should call the callback only for Ok values', async () => {
        const goodResult = new AsyncResult(Ok(100));
        const badResult = new AsyncResult(Err('error'));

        let inspectedValue: number | undefined;
        await goodResult.inspect((v) => {
            inspectedValue = v;
        });
        expect(inspectedValue).toBe(100);

        let badInspected = false;
        await badResult.inspect(() => {
            badInspected = true;
        });
        expect(badInspected).toBe(false);
    });

    test('inspect() should work with async callbacks', async () => {
        const goodResult = new AsyncResult(Ok(42));

        let inspectedValue: number | undefined;
        await goodResult.inspect(async (v) => {
            // Simulate async work
            await new Promise((r) => setTimeout(r, 1));
            inspectedValue = v;
        });
        expect(inspectedValue).toBe(42);
    });
});
describe('AsyncResult.inspectErr', () => {
    test('inspectErr() should call the callback only for Err values', async () => {
        const goodResult = new AsyncResult(Ok(100));
        const badResult = new AsyncResult(Err('error'));

        let goodInspected = false;
        await goodResult.inspectErr(() => {
            goodInspected = true;
        });
        expect(goodInspected).toBe(false);

        let inspectedError: string | undefined;
        await badResult.inspectErr((e) => {
            inspectedError = e;
        });
        expect(inspectedError).toBe('error');
    });

    test('inspectErr() should work with async callbacks', async () => {
        const badResult = new AsyncResult(Err('async error'));

        let inspectedError: string | undefined;
        await badResult.inspectErr(async (e) => {
            await new Promise((r) => setTimeout(r, 1));
            inspectedError = e;
        });
        expect(inspectedError).toBe('async error');
    });
});
