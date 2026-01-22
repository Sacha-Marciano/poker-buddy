import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

export function handleError(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof ZodError) {
    const messages = error.errors.map((e) => e.message).join(', ');
    return errorResponse(`Validation error: ${messages}`, 400);
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(error.errors)
      .map((e) => e.message)
      .join(', ');
    return errorResponse(messages, 400);
  }

  if (error instanceof mongoose.Error.CastError) {
    return errorResponse('Invalid ID format', 400);
  }

  // MongoDB duplicate key error
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: number }).code === 11000
  ) {
    return errorResponse('Duplicate entry - record already exists', 409);
  }

  if (error instanceof Error) {
    return errorResponse(error.message, 500);
  }

  return errorResponse('Internal server error', 500);
}

export function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}
