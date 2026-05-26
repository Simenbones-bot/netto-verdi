import { useRef } from 'react'

function strippe(str) {
  return String(str || '').replace(/[^\d]/g, '')
}

function formater(siffer) {
  if (!siffer) return ''
  return siffer.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

/**
 * Tallinput med tusen-mellomrom og tomt felt ved 0.
 * onChange(num) kalles med Number.
 */
export default function TallInput({ value, onChange, ...props }) {
  const ref = useRef(null)

  function handleChange(e) {
    const el = e.target
    const pos = el.selectionStart

    // Antall siffer foran cursor i nåværende verdi
    const siferForPos = strippe(el.value.substring(0, pos)).length

    const bareDigits = strippe(el.value)
    const formatert = formater(bareDigits)

    // Reposisjonerer cursor etter React-rerender
    requestAnimationFrame(() => {
      if (!ref.current) return
      let teller = 0
      let nyPos = formatert.length
      for (let i = 0; i < formatert.length; i++) {
        if (formatert[i] !== ' ') {
          teller++
          if (teller === siferForPos) {
            nyPos = i + 1
            break
          }
        }
      }
      if (siferForPos === 0) nyPos = 0
      ref.current.setSelectionRange(nyPos, nyPos)
    })

    onChange(bareDigits ? parseInt(bareDigits, 10) : 0)
  }

  function handleFocus(e) {
    e.target.select()
  }

  const num = Number(value) || 0
  const visVerdi = num === 0 ? '' : formater(String(num))

  return (
    <input
      ref={ref}
      type="text"
      inputMode="numeric"
      value={visVerdi}
      onChange={handleChange}
      onFocus={handleFocus}
      {...props}
    />
  )
}
