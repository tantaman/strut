export default function Syncify({
  fallback,
  what
}: {fallback: JSX.Element, what: Promise<JSX.Element>}) {
  // then the promise
  // cache the result
  // return the fallback while no cached result exists
  return fallback;
}

// Make an "asyncify" component?

/*
Potential syntax:
<Asyncify component={PresentButton} ... />
<Asyncify what={PresentButton({props})} fallback={} />
*/
