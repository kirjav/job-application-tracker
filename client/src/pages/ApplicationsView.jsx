import useMediaQuery from "../hooks/useMediaQuery";
import ApplicationOverview from "./ApplicationOverview";
import ApplicationsMobile from "./ApplicationsMobile";

const MOBILE_BREAKPOINT = "(max-width: 768px)";

/**
 * Renders the table view on larger screens and a simple mobile list view on small screens.
 * Same route /applications; content depends on viewport.
 */
export default function ApplicationsView() {
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT);
  return isMobile ? <ApplicationsMobile /> : <ApplicationOverview />;
}
