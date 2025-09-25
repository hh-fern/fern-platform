# EndpointContextToOpenApi Tests

This directory contains organized test files for the `endpointContextToOpenApi` functionality, broken down by type and functionality.

## Test Files

### `discriminated-union.test.ts`
Tests for discriminated union conversion to OpenAPI spec:
- Simple discriminated unions
- Discriminated unions in responses
- Optional properties in discriminated unions
- Complete OpenAPI 3.1 discriminated union generation

### `alias.test.ts`
Tests for alias type handling:
- Alias wrapping ID references
- Alias referencing enum types
- Alias referencing discriminated unions
- Missing ID reference fallback

### `union.test.ts`
Tests for union type handling:
- Undiscriminated unions
- Nullable types

### `primitive-types.test.ts`
Tests for primitive type conversion:
- Enum types
- Literal types
- Set types with uniqueItems
- Map types with additionalProperties

### `response-types.test.ts`
Tests for response type handling:
- Streaming text responses
- Stream responses with payload
- File download responses

### `request-body-types.test.ts`
Tests for request body type handling:
- Bytes request body
- Form data request body

## Running Tests

To run all tests in this directory:
```bash
pnpm vitest __test__/endpointContextToOpenApi
```

To run a specific test file:
```bash
pnpm vitest __test__/endpointContextToOpenApi/discriminated-union.test.ts
```

## Test Structure

Each test file follows the same pattern:
- Uses `OpenApiYamlFormatter` class
- Tests complete YAML output comparison
- Includes specific property checks for critical functionality
- Maintains consistent YAML structure and formatting
