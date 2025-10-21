import { z } from 'zod';

const idParam = (field) =>
  z
    .object({
      [field]: z
        .preprocess((value) => {
          if (value == null || value === '') {
            return value;
          }
          const numeric = Number(value);
          return Number.isFinite(numeric) ? numeric : value;
        }, z.number({ invalid_type_error: `${field} must be a number.` }))
        .int({ message: `${field} must be an integer.` })
        .positive({ message: `${field} must be a positive integer.` }),
    })
    .strip();

export const bookingParamsSchema = idParam('bookingId');
export const clientParamsSchema = idParam('clientId');
export const eventParamsSchema = idParam('eventId');
export const ticketParamsSchema = idParam('ticketId');
export const messageParamsSchema = idParam('messageId');
export const documentParamsSchema = idParam('documentId');
export const transactionParamsSchema = idParam('transactionId');
export const invoiceParamsSchema = idParam('invoiceId');
export const payoutParamsSchema = idParam('payoutId');

export default {
  bookingParamsSchema,
  clientParamsSchema,
  eventParamsSchema,
  ticketParamsSchema,
  messageParamsSchema,
  documentParamsSchema,
  transactionParamsSchema,
  invoiceParamsSchema,
  payoutParamsSchema,
};
