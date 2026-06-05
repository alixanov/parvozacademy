export const success = (res, data, message = 'Success', status = 200) =>
  res.status(status).json({ success: true, message, data });

export const paginated = (res, data, pagination, message = 'Success') =>
  res.status(200).json({ success: true, message, data, pagination });

export const created = (res, data, message = 'Created') =>
  success(res, data, message, 201);

export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}
