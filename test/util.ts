import { IsExact, IsNever } from 'conditional-type-checks';
import { Option, Result } from '../src/index.js';
import { Observable } from 'rxjs';

export function expect_string<T>(x: T, y: IsExact<T, string>) {}

export function expect_never<T>(x: T, y: IsNever<T>) {}

export function eq<A, B>(x: IsExact<A, B>) {}

expect.extend({
    toMatchResult(received: Result<any, any>, expected: Result<any, any>) {
        const receivedIsOk = received.isOk();
        const expectedIsOk = expected.isOk();

        if (receivedIsOk !== expectedIsOk) {
            return {
                pass: false,
                message: () => `expected ${receivedIsOk ? 'Ok' : 'Err'} to match ${expectedIsOk ? 'Ok' : 'Err'}`,
            };
        }

        const receivedValue = receivedIsOk ? (received as any).value : (received as any).error;

        const expectedValue = expectedIsOk ? (expected as any).value : (expected as any).error;

        const pass = this.equals(receivedValue, expectedValue);

        const type = receivedIsOk ? 'Ok' : 'Err';
        const expectedType = expectedIsOk ? 'Ok' : 'Err';

        return {
            pass,
            message: () =>
                `expected ${type}(${this.utils.printReceived(receivedValue)}) to match ${expectedType}(${this.utils.printExpected(expectedValue)})`,
        };
    },
    toMatchObsResult(obs: Observable<Result<any, any>>, result: Result<any, any>) {
        let pass = true;

        let received: Result<any, any> | undefined;
        let receivedInner;
        const resultInner = 'value' in result ? result.value : result.error;
        try {
            obs.subscribe((val) => {
                received = val;
                receivedInner = 'value' in received ? received.value : received.error;
            }).unsubscribe();

            expect(received?.isOk()).toBe(result.isOk());

            if (receivedInner !== resultInner) {
                expect(receivedInner).toMatchObject(resultInner);
            }
        } catch (e) {
            pass = false;
        }

        const type = received?.isOk() ? 'Ok' : 'Err';
        const expectedType = received?.isOk() ? 'Ok' : 'Err';
        const val = JSON.stringify(receivedInner);
        const expectedVal = JSON.stringify(resultInner);

        return {
            message: () => `expected ${type}(${val}) ${pass ? '' : 'not '}to equal ${expectedType}(${expectedVal})`,
            pass,
        };
    },
    toMatchObs(obs: Observable<any>, value: any) {
        let pass = true;

        let received: any | undefined;
        try {
            obs.subscribe((val) => (received = val)).unsubscribe();

            expect(received).toEqual(value);
        } catch (e) {
            pass = false;
        }

        return {
            message: () => `expected observable value: ${JSON.stringify(value)}\n\nFound: ${JSON.stringify(received)}`,
            pass,
        };
    },
});

export function notSupposedToBeCalled() {
    throw new Error('This is not supposed to be called');
}

expect.extend({
    toMatchOption(received: Option<any>, expected: Option<any>) {
        const receivedIsSome = received.isSome();
        const expectedIsSome = expected.isSome();

        if (receivedIsSome !== expectedIsSome) {
            return {
                pass: false,
                message: () =>
                    `expected ${receivedIsSome ? 'Some' : 'None'} to match ${expectedIsSome ? 'Some' : 'None'}`,
            };
        }

        if (!receivedIsSome) {
            // both None
            return { pass: true, message: () => 'expected None to match None' };
        }

        const receivedValue = (received as any).value;
        const expectedValue = (expected as any).value;

        const pass = this.equals(receivedValue, expectedValue);

        return {
            pass,
            message: () =>
                `expected Some(${this.utils.printReceived(receivedValue)}) to match Some(${this.utils.printExpected(expectedValue)})`,
        };
    },
});
