import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    // Set initial size
    checkSize();
    
    // Add event listener
    window.addEventListener("resize", checkSize);

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", checkSize);
  }, []) // Empty dependency array ensures this runs only on the client side

  return isMobile
}
