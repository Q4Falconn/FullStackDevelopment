import '@/styles.css'
import type { AppProps } from 'next/app'
import { Provider } from 'react-redux'
import { useEffect } from 'react'
import { store } from '@/store/store'
import Nav from '@/components/Nav'
import { useAppDispatch } from '@/store/hooks'
import { refreshMe } from '@/features/auth/authSlice'

/**
 * Custom App component for Next.js.  This wraps every page in the Redux
 * Provider so that the store is available to the entire application.  It
 * also renders the global navigation bar and triggers a refresh of the
 * current user on mount to determine whether the player is already
 * authenticated.  Global styles are imported at the top of this module.
 */
function InnerApp({ Component, pageProps }: AppProps) {
  const dispatch = useAppDispatch()
  useEffect(() => {
    // Attempt to load the current user from localStorage when the app is
    // first mounted.  This mirrors the behaviour from the original
    // assignment and ensures that the UI reflects the authentication
    // status immediately.
    dispatch(refreshMe())
  }, [dispatch])

  return (
    <>
      <Nav />
      <div className="container">
        <Component {...pageProps} />
      </div>
    </>
  )
}

export default function AppWrapper(props: AppProps) {
  return (
    <Provider store={store}>
      <InnerApp {...props} />
    </Provider>
  )
}