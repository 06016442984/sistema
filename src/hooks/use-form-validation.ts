"use client";

import { useState } from 'react';
import { z } from 'zod';

export function useFormValidation<T extends z.ZodSchema>(schema: T) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (data: unknown): data is z.infer<T> => {
    try {
      schema.parse(data);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          newErrors[path] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const clearErrors = () => setErrors({});

  const getFieldError = (field: string) => errors[field];

  const hasErrors = Object.keys(errors).length > 0;

  return {
    errors,
    validate,
    clearErrors,
    getFieldError,
    hasErrors
  };
}