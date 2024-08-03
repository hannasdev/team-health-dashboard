# Jest Testing Best Practices for TypeScript Projects

## Mocking Strategy

1. **Consolidate Mocks**:

   - Keep all mock factories in a single file, typically `src/__mocks__/mockFactories.ts`.
   - Create separate factory functions for each type of mock (e.g., `createMockRepository()`, `createMockService()`).

2. **Use `jest.mock()` with Factory Functions**:

   - In each test file, use `jest.mock()` to mock dependencies.
   - Return the result of the appropriate mock factory function.

   Example:

   ```typescript
   jest.mock('@/services/SomeService', () => ({
     __esModule: true,
     default: jest.fn(() => createMockSomeService()),
   }));
   ```

3. **Avoid Global Mocks**:
   - Prefer local mocks in test files over global mocks.
   - If global mocks are necessary, use them sparingly and document their usage clearly.

## Test File Structure

1. **Import Mocks and Types**:

   - Import mock factories and interfaces at the top of the test file.

2. **Declare Variables**:

   - Declare variables for the system under test and its dependencies.

3. **Use `beforeEach`**:

   - Reset mocks and create fresh instances before each test.

   Example:

   ```typescript
   beforeEach(() => {
     jest.clearAllMocks();
     mockDependency = createMockDependency();
     systemUnderTest = new SystemUnderTest(mockDependency);
   });
   ```

4. **Group Related Tests**:
   - Use `describe` blocks to group related tests.

## Writing Tests

1. **Arrange-Act-Assert**:

   - Follow the Arrange-Act-Assert pattern in each test.

2. **Mock Return Values**:

   - Set up mock return values at the beginning of each test.

3. **Test Behavior, Not Implementation**:

   - Focus on testing the public API and outcomes, not internal implementation details.

4. **Use Type-Safe Mocks**:
   - Leverage TypeScript to ensure type safety in mocks.
