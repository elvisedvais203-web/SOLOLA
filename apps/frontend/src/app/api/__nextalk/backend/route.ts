import { NextResponse } from "next/server";
import { getBackendOrigin } from "../../../../lib/nextalkbackendorigin";

/**
 * Petite config runtime : le navigateur peut connaître l’URL réelle du backend
 * sans NEXT_PUBLIC_* au build (variables serveur uniquement sur Render).
 */
export async function GET() {
  return NextResponse.json({ origin: getBackendOrigin() });
}
