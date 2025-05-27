export enum PostgresErrorCodes {
  UNIQUE_VIOLATION = '23505', // Unique constraint violation
  FOREIGN_KEY_VIOLATION = '23503', // Foreign key violation
  NOT_NULL_VIOLATION = '23502', // Not null constraint violation
  CHECK_VIOLATION = '23514', // Check constraint violation
  EXCLUSION_VIOLATION = '23P01', // Exclusion constraint violation
}

export enum SupabaseErrorCodes {
  NO_ROWS_FOUND = 'PGRST116', // No rows found when using `.single()`
}