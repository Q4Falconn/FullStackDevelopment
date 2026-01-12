import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import lobbyReducer from '../features/game/lobbySlice'
import gameReducer from '../features/game/gameSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    lobby: lobbyReducer,
    game: gameReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
