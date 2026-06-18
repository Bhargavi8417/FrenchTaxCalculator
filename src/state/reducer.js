import { initialState } from './initialState.js'

export function reducer(state, action) {
  switch (action.type) {
    case 'SET':
      return { ...state, [action.field]: action.value }
    case 'SET_MANY':
      return { ...state, ...action.fields }
    case 'RESET':
      return { ...initialState }
    default:
      return state
  }
}
