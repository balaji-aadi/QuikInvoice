/**
 * Middleware factory for validating incoming requests with Zod schemas
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {'body' | 'query' | 'params'} [source='body'] - Request property to validate
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req[source]);
      req[source] = validated;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export default validate;
