import { Suspense } from "react";
import Client404 from "./Client";

export default function Page404() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <Client404 />
    </Suspense>
  );
}
