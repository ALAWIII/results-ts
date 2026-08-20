declare module 'vitest' {
    interface Matchers<T> {
        toMatchResult(result: Result<any, any>): T;
        toMatchObsResult(result: Result<any, any>): T;
        toMatchObs(value: any): T;
    }
}
