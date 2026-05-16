import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminLogin from './AdminLogin';

// Mock fetch
beforeAll(() => {
  global.fetch = jest.fn((url, opts) => {
    if (url.includes('/api/login')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          user: { id: 2, email: 'admin@sistema.com', role: 'admin' },
          access_token: 'fake-token',
        }),
      });
    }
    return Promise.reject(new Error('Unknown endpoint'));
  });
});

afterAll(() => {
  global.fetch.mockRestore();
});

test('Admin login flow works', async () => {
  render(
    <BrowserRouter>
      <AdminLogin />
    </BrowserRouter>
  );

  fireEvent.change(screen.getByLabelText(/e-mail/i), {
    target: { value: 'admin@sistema.com', name: 'email' },
  });
  fireEvent.change(screen.getByLabelText(/senha/i), {
    target: { value: '010200', name: 'password' },
  });
  fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

  await waitFor(() => {
    expect(localStorage.getItem('token')).toBe('fake-token');
    expect(JSON.parse(localStorage.getItem('user')).role).toBe('admin');
  });
});
