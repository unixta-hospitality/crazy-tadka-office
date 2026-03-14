import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getSessionFromCookie, AUTH_COOKIE_NAME } from '@/lib/auth';

export default async function HomePage() {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = await getSessionFromCookie(token);

  if (session) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
