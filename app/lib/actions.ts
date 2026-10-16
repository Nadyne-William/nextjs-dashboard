'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth, signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';
import { sql } from '@/app/lib/db';
import { can, type Permission } from '@/app/lib/permissions';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ date: true, id: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
  // Set when the session ran out between loading the page and submitting.
  // The UI shows a blocking "session expired" modal instead of a field error.
  sessionExpired?: boolean;
};

export type DeleteResult =
  | { ok: true }
  | { ok: false; message: string; sessionExpired?: boolean };

// Every mutating action goes through this check. Hiding a button in the UI is
// not security on its own: a server action can be called directly.
async function authorize(
  permission: Permission,
): Promise<{ ok: true } | { ok: false; message: string; sessionExpired?: boolean }> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, sessionExpired: true, message: 'Your session has expired.' };
  }
  if (!can(session.user.role, permission)) {
    return { ok: false, message: "You don't have permission to do that." };
  }
  return { ok: true };
}

// Dollars to cents without floating-point drift (19.99 * 100 = 1998.9999...).
const toCents = (amount: number) => Math.round(amount * 100);

export async function createInvoice(prevState: State, formData: FormData): Promise<State> {
  const access = await authorize('invoices:write');
  if (!access.ok) return { message: access.message, sessionExpired: access.sessionExpired };

  // Validate form fields using Zod
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = toCents(amount);
  const date = new Date().toISOString().split('T')[0];

  // Insert data into the database
  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    // If a database error occurs, return a more specific error.
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }

  // Revalidate the cache for the invoices page and redirect the user.
  // The toast param tells the page to confirm the change, then it's removed from the URL.
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices?toast=created');
}

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
): Promise<State> {
  const access = await authorize('invoices:write');
  if (!access.ok) return { message: access.message, sessionExpired: access.sessionExpired };

  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    };
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = toCents(amount);

  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
  } catch (error) {
    return { message: 'Database Error: Failed to Update Invoice.' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices?toast=updated');
}

export async function deleteInvoice(id: string): Promise<DeleteResult> {
  const access = await authorize('invoices:write');
  if (!access.ok) return access;

  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
  } catch (error) {
    console.error('Database Error:', error);
    return { ok: false, message: 'Failed to delete the invoice. Please try again.' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/invoices');
  return { ok: true };
}

// Used by the idle timer and the "session expired" modal. The reason ends up
// on the login page so people know why they were signed out.
export async function signOutWithReason(reason: 'idle' | 'expired' | 'manual') {
  const redirectTo = reason === 'manual' ? '/' : `/login?reason=${reason}`;
  await signOut({ redirectTo });
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}
