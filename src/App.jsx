import { useReducer, useState } from 'react'
import { initialState } from './state/initialState.js'
import { reducer } from './state/reducer.js'
import Landing from './screens/Landing.jsx'
import Wizard from './screens/Wizard.jsx'
import Result from './screens/Result.jsx'
import { LangProvider } from './i18n/LangContext.jsx'

function AppInner() {
  const [model, dispatch] = useReducer(reducer, initialState)
  const [screen, setScreen] = useState('landing')
  const [startAtRecap, setStartAtRecap] = useState(false)

  if (screen === 'result') {
    return (
      <Result
        model={model}
        onRecommencer={() => {
          dispatch({ type: 'RESET' })
          setStartAtRecap(false)
          setScreen('landing')
        }}
        onModifier={() => {
          setStartAtRecap(true)
          setScreen('wizard')
        }}
      />
    )
  }

  if (screen === 'wizard') {
    return (
      <Wizard
        model={model}
        dispatch={dispatch}
        startAtRecap={startAtRecap}
        onBack={() => {
          setStartAtRecap(false)
          setScreen('landing')
        }}
        onFinish={() => {
          setStartAtRecap(false)
          setScreen('result')
        }}
      />
    )
  }

  return <Landing onStart={() => setScreen('wizard')} />
}

export default function App() {
  return (
    <LangProvider>
      <AppInner />
    </LangProvider>
  )
}
