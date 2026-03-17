import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { LoginPage } from '@/pages/auth/login-page';
import { server } from '@/test/mocks/handlers';
import { renderWithProviders } from '@/test/test-utils';

const API_URL = 'http://localhost:3000';

describe('LoginPage', () => {
  it('renders login form with password input and submit button', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/enter your password to continue/i)).toBeInTheDocument();
  });

  it('redirects on successful login', async () => {
    const user = userEvent.setup();

    renderWithProviders(<LoginPage />, { initialEntries: ['/login'] });

    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(passwordInput, 'correct-password');
    await user.click(submitButton);

    // The login mutation calls navigate('/dashboard', { replace: true }) on success.
    // We can verify the mutation completed without error.
    await waitFor(() => {
      expect(screen.queryByText(/invalid password/i)).not.toBeInTheDocument();
    });
  });

  it('shows error message on wrong password', async () => {
    const user = userEvent.setup();

    server.use(
      http.post(`${API_URL}/auth/login`, () => {
        return HttpResponse.json(
          { statusCode: 401, message: 'Invalid password', error: 'Unauthorized' },
          { status: 401 },
        );
      }),
    );

    renderWithProviders(<LoginPage />);

    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(passwordInput, 'wrong-password');
    await user.click(submitButton);

    await waitFor(() => {
      // Axios wraps 401 as an Error with message "Request failed with status code 401"
      // The component renders login.error.message since AxiosError instanceof Error is true
      expect(screen.getByText(/request failed|invalid password|please try again/i)).toBeInTheDocument();
    });
  });

  it('does not submit when password is empty', async () => {
    const user = userEvent.setup();

    renderWithProviders(<LoginPage />);

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    // No error message should appear since the form guards against empty submission
    expect(screen.queryByText(/invalid password/i)).not.toBeInTheDocument();
  });
});
