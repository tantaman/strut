import { appPath } from '../shared/appPath'

export function AamuSlidesLogo({ className = '' }: { className?: string }) {
  const classes = `${className} aamu-slides-logo`.trim()
  return (
    <>
      <img
        className={`${classes} aamu-slides-logo--light`}
        src={appPath('/aamu-slides-logo.svg')}
        alt="Aamu Slides"
      />
      <img
        className={`${classes} aamu-slides-logo--dark`}
        src={appPath('/aamu-slides-logo-dark.svg')}
        alt=""
        aria-hidden="true"
      />
    </>
  )
}
