import { PublishersView } from "@/components/vymc/publishers/publishers-view";

/**
 * Publicadores del panel Territorios: misma vista que VYMC,
 * con el mismo contexto de tema para que se vea idéntica
 * en modo claro y oscuro.
 */
export default function TerritoriesPublishersPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8">
      <div className="vymc-theme">
        <PublishersView />
      </div>
    </div>
  );
}
